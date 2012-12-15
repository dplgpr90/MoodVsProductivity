// Holds the name and the owner of the project
projectOwner = "";
projectName = "";
githubCredentials = "your_keys";

// Holds informations
collaboratorsInfo = new Array();
activityBubbles = new Array();
// Flags to syncronize executions
sync = 0;
contBubbles = 0;
contCollaborators = 0;

// Counts the number of collaborators that have 0 commits	
errorCollaborators = 0;

// True if 'first 10 collaborators' restriction is checked
restriction = false;

// Called through user interface (html page)
function analyzeMoodVsProductivity () {
	try {
		showProgressBar();
		// Get the name of the project, its owner and "restriction" value from input fields
		projectName =  $("#project").val();
		projectOwner = $("#owner").val();	
		restriction = $("#restriction")[0].checked;
		// Starts analysis
		analyze();
	} catch (exception) {
		exceptionHandler(exception);
	}
}

// Main function
function analyze () {	
	getCollaboratorsAndActivityBubbles();
}

// First step of execution
function getCollaboratorsAndActivityBubbles(){
	// Gets collaborators of the project
	getCollaboratorsByProject();
	// Creates activity bubbles for every commit
	getActivityBubbles();
}

// Second step of execution
function analyzeEachCollaborator(){
	// Result array
	var collaboratorsAnalysisResult = new Array();
	// Makes analysis for each collaborator
	$.each(collaboratorsInfo, function() {	
		if(this != undefined){
			/*
				ANALYSIS STEPS:
				1- Get Activity Bubbles
				2- Get all Tweet Bubbles according to first activity time
				3- Make time slots according to mood and productivity index
				4- Add slot to collaboratorsAnalysisResult array
			*/
			// Gets activity bubbles of current collaborator and the new array of activity bubbles where the ones computed are removed
			var computedActivityBubbles = getActivityBubblesByCollaborator(this);
			var collaboratorActivityBubbles = computedActivityBubbles.collaboratorBubbles;
			activityBubbles = computedActivityBubbles.activityBubbles;	
			if(collaboratorActivityBubbles[0] != undefined){
				// There is at least an activity bubble		
				// Updates GitHub url to link icon
				this.GitHubUrl = "https://github.com/" + this.login;
				// Computes maximum time of aging of a tweet
				var maxTimeOld = collaboratorActivityBubbles[collaboratorActivityBubbles.length - 1].beginTime;
				var tweetBubbleTemp = new TweetBubble();
				maxTimeOld = maxTimeOld - (tweetBubbleTemp.getRange().minutes*60*1000 + tweetBubbleTemp.getRange().hours*3600*1000); 
				// Creates tweet bubbles for every tweet
				var collaboratorTweetBubbles = getTweetBubbles(this, maxTimeOld);
				if(collaboratorTweetBubbles.length > 0){
					// Inserts Twitter Url for current collaborator (presence of at least one tweet)
					this.TwitterUrl = "https://twitter.com/" + collaboratorTweetBubbles[0].user.login;
				}
				// Creates an array of Result Slots
				var collaboratorSlots = getResultSlots(this, collaboratorTweetBubbles, collaboratorActivityBubbles);
				// Adds into result array a new structure containing a structure about collaborator info and the array of his slots
				collaboratorsAnalysisResult.push({"collaborator": this, "slots": collaboratorSlots, "activityBubbles": collaboratorActivityBubbles, "tweetBubbles": collaboratorTweetBubbles });		
			} else {
				// There is no activity bubbles
				// No commit by this collaborator, no information
				// Adds into result array a new structure containing a structure about collaborator info and undefined slots
				collaboratorsAnalysisResult.push({"collaborator": this, "slots": undefined });
			}
		} else {
			// Collaborator not recognized
			// Increase GitHub collaborator error counter
			errorCollaborators++;
		}
	});
	// Returns result
	var result = {"collaboratorsAnalysisResult": collaboratorsAnalysisResult, "errorCollaborators": errorCollaborators};
	// Shows result of the analysis
	showResult(result);
}

// Returns an array of urls, one for each collaborator of the specified project
function getCollaboratorsByProject(){
	var urlGitHubCollaborators = "https://api.github.com/repos/" + projectOwner + "/" + projectName + "/collaborators?" + githubCredentials;
	var collaborators = new Array();
	$.ajax({
  		url: urlGitHubCollaborators,
  		async: true,
  		success: function(data){
  			// Makes an array of urls
  			$.each(data, function(index) {	
				collaborators.push(this.url + "?" + githubCredentials);
				if(restriction == true && index == 9)
					return false;
			});
			contCollaborators = collaborators.length;
			$.each(collaborators, function() {	
				getCollaboratorInfo(this);
			});
		},
		error: function (jqXHR, textStatus, errorThrown){
			console.log("Error: GitHub getCollaboratorsByProject");
			throw new GitHubException(jqXHR.status, textStatus, "GetCollaboratorsByProject");
		}			
	});
}

// Returns a structure containing nickname, real name, GitHub url and Twitter url (now empty) of the specified collaborator
function getCollaboratorInfo(collaborator){
	$.ajax({
	  	url: collaborator + "?" + githubCredentials,
	  	async: true,
	  	success: function(data){
	  		// Creates a structure to hold collaborator info
	  		collaboratorsInfo.push({"login": data.login, "name": data.name, "GitHubUrl": undefined, "TwitterUrl": undefined});
	  		contCollaborators--;
			if(contCollaborators == 0){
				// All collaborators informations received
				// Updates flag
				sync++;
	  			if(sync == 2){
	  				// Syncronization
	  				analyzeEachCollaborator();
	  			}
	  		}
	  	},
		error: function (jqXHR, textStatus, errorThrown){
			console.log("Error: GitHub getCollaboratorInfo");
			collaboratorsInfo.push(undefined);
			contCollaborators--;
			if(contCollaborators == 0){
				// All collaborators informations received
				// Updates flag
				sync++;
	  			if(sync == 2){
	  				// Syncronization
	  				analyzeEachCollaborator();
	  			}
	  		}
			//throw new GitHubException(jqXHR.status, textStatus, "GetCollaboratorInfo");
		}				
	});
}

// Fills activityBubbles array with one bubble for every commit of the specified project
function getActivityBubbles(){
	var commits = getCommits();
	$.each(commits, function(index) {
		if(this.committer != null){
			activityBubbles.push(createActivityBubble(this));
		}
	});
	getBubblesProductivityIndex(); 
}

// Returns all commits of the specified project
function getCommits(){
	var commits = new Array();
	var commitsForRequest = 30;
	commits = requestCommits();
	if(commits.length == 0 || commits.length < commitsForRequest){
		return commits;
	} 
	var MAX_ITERATION_NUMBER = 5;
	while(MAX_ITERATION_NUMBER > 0){
		var lastCommitSha = commits[commits.length-1].sha;
		var commitsSet = requestCommits(lastCommitSha);
		var returnedCommits = commitsSet.length;
		commitsSet = commitsSet.slice(1,commitsSet.length);
		commits = commits.concat(commitsSet);
		if(returnedCommits < commitsForRequest){
			break;
		}
		MAX_ITERATION_NUMBER--;
	}
	return commits;
}

// Returns commits from the one with specified sha
function requestCommits (lastCommitSha){
	var urlGitHubCommits = "https://api.github.com/repos/" + projectOwner + "/" + projectName +"/commits?" + githubCredentials;
	var commits;
	if(lastCommitSha != undefined){
		urlGitHubCommits += "&sha=" + lastCommitSha;
	}	
	$.ajax({
  		url: urlGitHubCommits,
  		async: false,
  		success: function(data){
  			commits = data;
		},
		error: function (jqXHR, textStatus, errorThrown){
			console.log("Error: GitHub getCommits");
			throw new GitHubException(jqXHR.status, textStatus, "GetCommits");
		}		
	});
	return commits;
}

// Creates an activity bubble for the specified commit
function createActivityBubble (commit) {
	var bubble = new ActivityBubble();
	bubble.user.login = commit.committer.login;
	bubble.user.name = commit.commit.committer.name;
	bubble.commitUrl = commit.url;
	bubble.fixBugCommit = commit.commit.message.indexOf("fix") > -1 && commit.commit.message.indexOf("bug") > -1;
	bubble.commitSha = commit.sha;
	bubble.commitTime = new Date(commit.commit.committer.date).getTime();
	var rangeMilliseconds = bubble.getRange().hours*3600*1000 + bubble.getRange().minutes*60*1000;
	bubble.beginTime = bubble.commitTime - rangeMilliseconds;
	bubble.endTime = bubble.commitTime + rangeMilliseconds; 
  	return bubble;
}

// Starts computing to obtain productivityIndex of each bubble
function getBubblesProductivityIndex () {
	checkFilesActivityBubbles();
}

// Udates activity bubbles with numbers of files added, modified and removed according to the commit linket the each bubble
function checkFilesActivityBubbles(){
	var fileHandler = new FileHandler();
	var contBub = 0;
	$.each(activityBubbles, function() {
	 	var this_activityBubble = this;
	 	$.ajax({
	 		url: this.commitUrl + "?" + githubCredentials,
	 		async: true,
	 		success: function(data){
	 			$.each(data.files, function() {	
					var fileExtension = this.filename.substring(this.filename.lastIndexOf('.')+1);
					if(fileExtension != "gitattributes" && fileExtension != "gitignore"){
						// It is not a default file of GitHub
						if(fileHandler.isDocumentationFile(fileExtension)){
							switch(this.status){
								case "added":
									this_activityBubble.addedDocumentationFiles++;
									break;
								case "modified":
									this_activityBubble.modifiedDocumentationFiles++;
									break;
								case "removed":
									this_activityBubble.removedDocumentationFiles++;
									break;
							}
						} else {
							switch(this.status){
								case "added":
									this_activityBubble.addedCodeFiles++;
									break;
								case "modified":
									this_activityBubble.modifiedCodeFiles++;
									break;
								case "removed":
									this_activityBubble.removedCodeFiles++;
									break;
							}
						}
					}
				});		
				contBub++;
				if(contBub == activityBubbles.length){
					// It is the last one
					checkBuggyActivityBubbles();
				}
			},
			error: function (jqXHR, textStatus, errorThrown){
				console.log("Error: GitHub checkFilesActivityBubbles");
				throw new GitHubException(jqXHR.status, textStatus, "GetCommitInfo");
			}			
		});
	});
}

// Updates activity bubbles after checking in which one buggy code has been written
function checkBuggyActivityBubbles(){
	$.each(activityBubbles, function() {
		if(this.fixBugCommit == true){	
			// It is a commit fixing a bug
			if(activityBubbles.indexOf(this) < activityBubbles.length-2){
				// It is not the first bubble (time order)
				var previousActivityBubbleIndex = activityBubbles.indexOf(this) + 1;
				var previousActivityBubble = activityBubbles[previousActivityBubbleIndex];
				var urlGitHubCommitDiff = "https://github.com/" + projectOwner + "/" + projectName + "/compare/" + previousActivityBubble.commitSha + "..." + this.commitSha + ".diff";
				var this_bubble = this;
				$.ajax({
			  		url: urlGitHubCommitDiff + "?" + githubCredentials,
			  		async: true,
			  		success: function(data){	
			  			// Gets modified files only (among all files returned by API)
			  			var modifiedFiles = getModifiedFiles(data);
						/* 
			  				STEPS TO FIND BUGGY COMMIT:
				  				- Find changes
				  				- Find in which commits these changes were written
				  				- Set those commits as buggy (otherwise, the commit in which the file was created)	
			  			*/	
						findModifiedFilesBuggy(activityBubbles.indexOf(this_bubble), modifiedFiles);
						// Updates flag
						contBubbles++;
						if(contBubbles == activityBubbles.length){
							// All bubbles analyzed
							$.each(activityBubbles, function() {
								this.productivityIndex = getProductivityIndex(this);
							});
							// Updates flag
							sync++;
					  		if(sync == 2){
					  			// Syncronization
					  			analyzeEachCollaborator();
					  		}
						}
					},
					error: function (jqXHR, textStatus, errorThrown){
						console.log("Error: GitHub checkBuggyActivityBubbles");
						throw new GitHubException(jqXHR.status, textStatus, "GetCommitDifferences");
					}			
				});
			} else {
				if(activityBubbles.indexOf(this) == activityBubbles.length-2){
					// There are anly two commits left and the second one is a "fixing bug commit"
					// Set the other as buggy (necessarly)
					activityBubbles[activityBubbles.length-1].buggyCommit = true;
				} 
				// else branch
					/* 
						It is the last bubble (in time order the first one).
						It is not possible fixing a bug at the beginning of the project 
						or it is not possible obtaining older commits (API restriction).
					   	Assume that it is a "not fixing bug" commit.
					*/

					// Leave empty
				// Updates flag
				contBubbles++;
				if(contBubbles == activityBubbles.length){
					// All bubbles analyzed
					$.each(activityBubbles, function() {
						this.productivityIndex = getProductivityIndex(this);
					});
					sync++;
					if(sync == 2){
						// Syncronization
					  	analyzeEachCollaborator();
					}
				}
			}
		} else {
			// Updates flag
			contBubbles++;
			if(contBubbles == activityBubbles.length){
				// All bubbles analyzed
				$.each(activityBubbles, function() {
					this.productivityIndex = getProductivityIndex(this);
				});
				sync++;
		 		if(sync == 2){
		  			// Syncronization
					analyzeEachCollaborator();
		  		}
			}
		}
	});
}

// Returns modified files (only) of a commit
function getModifiedFiles (APIresponse) {
	// Regular expression to find beginning of each file to split 
	// API response (string) into an array of files (strings)
	var beginningDiffFileRegex = /diff\s\-{2}git\s/g;
	var allFiles =  APIresponse.split(beginningDiffFileRegex);
	// Holds indices of elements to be removed 
	var indicesToRemove = new Array();
	indicesToRemove.push(0); // By default, first element is empty 
	// Finds new, removed and documentation files
	$.each(allFiles, function() {
		var this_string = this.toString(); 
		// Checks it is not the first element (empty by default)
		if(this_string != ""){
			var filenameLine = this_string.substring(0,this_string.indexOf("\n"));
			var fileExtension = filenameLine.substring(filenameLine.lastIndexOf(".")+1);
			var fileHandler = new FileHandler();
			// Regular expression to find beginning of a new file
			var newFileRegex = /new\sfile\smode\s\d+\nindex\s.*\n\-{3}\s\/dev\/null/g;
			var isNewFile = this_string.search(newFileRegex)!=-1;
			// Regular expression to find beginning of a removed file
			var removedFileRegex = /deleted\sfile\smode\s\d+\nindex\s.*\n\-{3}\s.*\n\+{3}\s\/dev\/null/g;
			var isRemovedFile = this_string.search(removedFileRegex)!=-1;
			if(fileHandler.isDocumentationFile(fileExtension) == true || isNewFile == true || isRemovedFile == true){
				indicesToRemove.push(allFiles.indexOf(this_string));
			}
		}
	});
	// Holds modified files only (computed via indicesToRemove array) 
	var modifiedFiles = new Array();
	$.each(allFiles, function(index) {
		if($.inArray(index, indicesToRemove) == -1){
			// It is not a file to be removed, it is a modified file
			modifiedFiles.push(this.toString());
		}
	});
	return modifiedFiles;
}

// Returns activity bubbles after setting buggy ones (deriving from modified files)
function findModifiedFilesBuggy(currentBubbleIndex, modifiedFiles){
	/* 
		FOR EACH MODIFIED FILE:
			- Find changes
			- Find in which commit these changes were written
			- Set that commit as buggy (otherwise, the commit in which the file was created)				
	*/
	if(modifiedFiles.length > 0){
		// Array is not empty
		$.each(modifiedFiles, function(){
			/*
				STEPS:
					1) Retrieve file name
					2) Retreive deletions from previous commit
					3) Get commit info using GitHub API
					4) Look for the file in the response
						4.1) If it has status equals to "added" set that commit as buggy and terminate computation 
						4.2) Otherwise compare changes and verify
							4.2.1) If changes were introducted in that commit set it as buggy and continue to the next commit
							4.2.2) Otherwise continue to the next commit
			*/
			var this_string = this.toString();
			// point 1
			var filename = getFileName(this_string);
			// point 2
			var removedLines = getRemovedLines(this_string);
			// point 3
			var foundAll = false; // Flag setted true if it is found the commit in which the file with changes was added
			for(var i = currentBubbleIndex+2; i<activityBubbles.length && foundAll == false; i++){
				var currentCommitUrl = activityBubbles[i].commitUrl;
				$.ajax({
			  		url: currentCommitUrl + "?" + githubCredentials,
			  		async: false,
			  		success: function(data){	
			  			// point 4
			  			$.each(data.files, function(){
			  				if(this.filename == filename){
			  					if(this.status == "added"){
			  						// point 4.1
				  					activityBubbles[i].buggyCommit = true;
				  					found = true; 
			  					} else if (this.status == "modified") {
			  						// point 4.2
			  						// Flag true if this is a buggy commit
			  						var isPreviousBuggy = isBuggyPrevious(activityBubbles[currentBubbleIndex], activityBubbles[i], removedLines, filename);
									if(isPreviousBuggy.isBugHere == true){
			  							// point 4.2.1
			  							activityBubbles[i-1].buggyCommit = true;
			  						}
			  						if(isPreviousBuggy.remainingRemovedLines.length <= 0) {
			  							// All lines are computed
			  							foundAll = true;
			  						} else {
			  							removedLines = isPreviousBuggy.remainingRemovedLines;
			  							// point 4.2.2	
			  						}	  					 
			  					}
			  					return false;
			  				}
						});
			  		},
					error: function (jqXHR, textStatus, errorThrown){
						console.log("Error: GitHub findRemovedFilesBuggy");
						throw new GitHubException(jqXHR.status, textStatus, "GetCommitInfo");
					}	
				});		
			}
		});
	}
	return activityBubbles;
}

// Returns an object {boolean, array} in witch boolean value is true if one of currentRemovedLines 
// was created in the bubble preceding following2Bubble (in array order, so it is the followig in time order)
// and array value contains lines not found (as removed) in the actual computation (they will be analyzed in 
// following computations)
function isBuggyPrevious(currentBubble, following2Bubble, currentRemovedLines, currentFilename){
	var isBugHere = false;
	// Holds removed lines not runned in this computation
	var remainingRemovedLines = new Array();
	var urlGitHubCommitDiff = "https://github.com/" + projectOwner + "/" + projectName + "/compare/" + following2Bubble.commitSha + "..." + currentBubble.commitSha + ".diff";
	$.ajax({
		url: urlGitHubCommitDiff + "?" + githubCredentials,
		async: false,
		success: function(data){	
			// Gets modified files only (from all files returned by API)	  			
			var modifiedFiles = getModifiedFiles(data);
			if(modifiedFiles.length > 0){
				// Array is not empty
				$.each(modifiedFiles, function(){
					/*
						STEPS:
							1) Retrieve file name
							2) If the file is the same, retreive deletions from previous commit and compare
							3) Otherwise continue search
					*/
					var this_string = this.toString();
					// point 1
					var filename = getFileName(this_string);					
					if(currentFilename == filename){
						// point 2						
						var removedLines = getRemovedLines(this_string);
						// Comparison of removed lines
						$.each(currentRemovedLines, function(){
							if($.inArray(this, removedLines) == -1){
								// this line is not among removed lines
								isBugHere = true;
							} else {
								// this line has still to be analyzed
								remainingRemovedLines.push(this);
							}
						});
						return false;
					}
					// else branch
						// point 3
				});
			} else {
				isBugHere = false;
			}				
		},
		error: function (jqXHR, textStatus, errorThrown){
			console.log("Error: GitHub checkBuggyActivityBubbles");
			throw new GitHubException(jqXHR.status, textStatus, "GetCommitDifferences");
		}
	});
	return {"isBugHere": isBugHere, "remainingRemovedLines": remainingRemovedLines};
}

// Returns file name from a string obtained using GitHub API
function getFileName(string){
	var filenameLine = string.substring(0,string.indexOf("\n"));
	var beginFilenameRegex = /\sb\//g;
	var filename = filenameLine.substring(filenameLine.search(beginFilenameRegex)+3);
	return filename;
}

// Returns removed lines in the string returned by GitHub API 
function getRemovedLines(string){
	var allChangedLinesRegex = /\@\n(.*\n)*/g; // Matches each line ends with a "@" and followed by anything
	var allChangedLinesArray = string.match(allChangedLinesRegex);
	var allChangedLines = allChangedLinesArray[0]; // There is only one item in the array (that is a string)
	var addedLinesRegex = /\n[\+]{1}.*\n/g; // Matches each line begins with a "+"
	var removedLinesBlocks = allChangedLines.split(addedLinesRegex); // Now lines are still potentially made with added lines
	var removedLines = new Array(); // Holds real lines changed
	$.each(removedLinesBlocks, function(){
		var removedLinesRegex = /\n[\-]{1}.*/g; // Matches each line begins with a "-"
		var removedLinesMatch = this.match(removedLinesRegex);
		if(removedLinesMatch != null){
			$.each(removedLinesMatch, function(){
				removedLines.push(this.toString().replace("\n",""));
			});			
		}
	});
	return removedLines;
}

// Returns index of productivity linked to the specified activity bubble
function getProductivityIndex (activityBubble) {
	var scoringSystem = new ScoringSystem();
	var productivityIndex = 0;	
	if(activityBubble.fixBugCommit == true){
		productivityIndex += scoringSystem.getFixBuggyCodeValue();
	}		
	if(activityBubble.buggyCommit == true){
		productivityIndex += scoringSystem.getBuggyCodeValue();
	}
	productivityIndex += activityBubble.addedCodeFiles*scoringSystem.getCodeFileAddedValue() +
			  activityBubble.modifiedCodeFiles*scoringSystem.getCodeFileModifiedValue() +
			  activityBubble.removedCodeFiles*scoringSystem.getCodeFileRemovedValue() +
			  activityBubble.addedDocumentationFiles*scoringSystem.getDocumentationFileAddedValue() + 
			  activityBubble.modifiedDocumentationFiles*scoringSystem.getDocumentationFileModifiedValue() +
			  activityBubble.removedDocumentationFiles*scoringSystem.getDocumentationFileRemovedValue();
	return productivityIndex;
}

// Returns an array of activity bubbles of the specified collaborator
function getActivityBubblesByCollaborator(collaborator){
	var collaboratorBubbles = new Array(); 
	var newActivityBubbles = new Array();
	$.each(activityBubbles, function() {
		if(this.user.login == collaborator.login){
			collaboratorBubbles.push(this);
		} else {
			newActivityBubbles.push(this);
		}
	});	
	return {"collaboratorBubbles": collaboratorBubbles, "activityBubbles": newActivityBubbles};
}

// Returns tweetBubbles from tweets
function getTweetBubbles(collaborator, maxTimeOld){
	var tweets = getTweetsByUserFromTime(collaborator, maxTimeOld);			
	var tweetBubbles = new Array();
	$.each(tweets, function() {
		tweetBubbles.push(createTweetBubble(this));
	});
	return tweetBubbles;
}

// Returns tweets written at most maxTimeOld (plus a specific range) time ago
// To link a GitHub user to his twitter account:
// 1) Search an account with username equals to 'login'
// 2) If no account exists, search an account has the name equals to 'name'
function getTweetsByUserFromTime(user, maxTimeOld){
	// Holds twitter username of the user
	var screen_name = undefined;
	// Indicates the date of the oldest tweet to consider
	var maxTimeOldDate = new Date(maxTimeOld);
	var findUserTwitterUrl = "http://api.twitter.com/1.1/users/show.json";
	var queryUrl = "screen_name=" + user.login;
	var authHeader = getAuthorizationHeaders(findUserTwitterUrl, queryUrl);
	var requestUrl = findUserTwitterUrl + "?" + queryUrl;
	var xmlhttp = getXMLHttpRequest();
	// point 1
	xmlhttp.open("GET",requestUrl,false);
	xmlhttp.setRequestHeader("Authorization",authHeader);
	xmlhttp.onreadystatechange = function (){
		if(xmlhttp.readyState==4){	
	    	if(xmlhttp.status==200){
	    		// Success	
	    		// User known  		
				screen_name = user.login;
	       	} else {
	       		// Error
	       		// User unknown (from its username)
	       		// point 2
	       		// Gets screen_name from real name
				screen_name = getScreenName(user.name);
				// According to getScreenName implementation, if screen_name here
				// is not undefined the user called screen_name exists
	       	}
	    }
	};
	xmlhttp.send(null);		
	// Gets tweets of user called as screen_name
	if(screen_name != undefined){
		console.log("User " + screen_name + " (" + user.name + ") " + "linked to his twitter account");	
		var tweets = getTweets(screen_name, maxTimeOldDate);
	} else {
		console.log("User " + user.login + "not linked to his twitter account");	
		var tweets = [];
	}
	return tweets;
}

// Returns tweets of the specified user written at most at maxTimeOldDate
function getTweets(userScreenName, maxTimeOldDate){
	var tweets = new Array();
	var maxId = undefined;
	var tweetsForRequest = 200;
	tweets = requestTweets(userScreenName, maxId, tweetsForRequest);
	if(tweets.length == 0){
		return tweets;
	} 
	while(true){
		var dateLastTweet = new Date(tweets[tweets.length-1].created_at);
		if(dateLastTweet < maxTimeOldDate){
			break;
		}
		maxId = tweets[tweets.length-1].id;
		var tweetsSet = requestTweets(userScreenName, maxId, tweetsForRequest);
		var tweetsSetLength = tweetsSet.length;
		tweetsSet = tweetsSet.slice(1,tweetsSet.length);
		tweets = tweets.concat(tweetsSet);
		if(tweetsSetLength < tweetsForRequest){
			break;
		}
	}
	// Holds the last tweet to be considered
	var lastIndex = findLastIndex(tweets, maxTimeOldDate);	
	tweets = tweets.slice(0,lastIndex);
	return tweets;
}

// Returns tweets of the specified user with at most maxId as Id value
function requestTweets(userScreenName, maxId, tweetsForRequest){
	var tweets;
	var getTweetsTwitterUrl = "https://api.twitter.com/1.1/statuses/user_timeline.json";
	var queryUrl = "count=" + tweetsForRequest.toString() + "&screen_name=" + userScreenName;			
	if(maxId != undefined){
		queryUrl = "max_id=" + maxId + "&" + queryUrl;
	}			
	var authHeader = getAuthorizationHeaders(getTweetsTwitterUrl, queryUrl);
	var requestUrl = getTweetsTwitterUrl + "?" + queryUrl;
	var xmlhttp = getXMLHttpRequest();
	xmlhttp.open("GET",requestUrl,false);
	xmlhttp.setRequestHeader("Authorization",authHeader);
	xmlhttp.onreadystatechange = function (){
		if(xmlhttp.readyState==4){
	    	if(xmlhttp.status==200){
	    		// Success	
	    		// Tweets received
	    		tweets = eval("(" + xmlhttp.responseText + ")");
	       	} else {
	       		// Error
	       		console.log("Error: Twitter getTweets");
	       		tweets = undefined;
				//throw new TwitterException(xmlhttp.status, xmlhttp.statusText, "GetTweets");
	       	}
	    }
	};
	xmlhttp.send(null);	
	return tweets;
}

// Returns the index of the first tweet written before specified data
function findLastIndex(tweets, date){
	for(var index = tweets.length-1; index >= 0; index--){
		if(new Date(tweets[index].created_at) >= date){
			return index+1;
		}
	}
	return 0;
}

// Returns screen_name of specified user (by name)
function getScreenName (real_name) {
	var serverResponse;		
	var screen_name;				
	var getScreenNameTwitterUrl = "https://api.twitter.com/1.1/users/search.json";
	var queryUrl = "q=" + real_name;
	var authHeader = getAuthorizationHeaders(getScreenNameTwitterUrl, queryUrl);	
	var requestUrl = getScreenNameTwitterUrl + "?" + queryUrl;
	var xmlhttp = getXMLHttpRequest();
	xmlhttp.open("GET",requestUrl,false);
	xmlhttp.setRequestHeader("Authorization",authHeader);
	xmlhttp.onreadystatechange = function (){
		if(xmlhttp.readyState==4){
	    	if(xmlhttp.status==200){
	    		// Success	
	    		// User known
	    		serverResponse = eval("(" + xmlhttp.responseText + ")");
	    		serverResponse = serverResponse[0].screen_name;
	       	} else {
	       		// Error
	       		console.log("Error: Twitter getTweetsByUserFromTime");
	       		serverResponse = undefined;
				//throw new TwitterException(xmlhttp.status, xmlhttp.statusText, "GetUser");
	       	}
	    }
	};
	xmlhttp.send(null);	
	return serverResponse;
}

// Returns authorization headers for ajax requests according to MoodVSProductivity (Twitter Application) SECRET KEYS
function getAuthorizationHeaders(url, query){
	var accessor = { 
		consumerSecret: "your_key", 
		tokenSecret: "your_key"
	};		
	var consumerKey = "your_key";
	var accessToken = "your_key";	
	var timestamp = OAuth.timestamp();
	var nonce = OAuth.nonce(32);	
	var message = { 
		method: "GET", 
		action: url, 
		parameters: OAuth.decodeForm( query + "&oauth_version=1.0&oauth_consumer_key=" + consumerKey + "&oauth_token=" + accessToken + "&oauth_timestamp=" + timestamp + "&oauth_nonce=" + nonce + "&oauth_signature_method=HMAC-SHA1")
	};			
	var sign = OAuth.SignatureMethod.sign(message, accessor);		
	var normParams = OAuth.SignatureMethod.normalizeParameters(message.parameters);		
	var baseString = OAuth.SignatureMethod.getBaseString(message);		
	var param = OAuth.getParameter(message.parameters, "oauth_signature");		
	var authHeader = OAuth.getAuthorizationHeader("", message.parameters);	
	return authHeader;
}

// Returns XMLHttpRequest object
function getXMLHttpRequest(){
	if (window.XMLHttpRequest){
		// code for IE7+, Firefox, Chrome, Opera, Safari
		return new XMLHttpRequest();
	}
	// else branch
		// code for IE6, IE5
		return new ActiveXObject("Microsoft.XMLHTTP");
}

// Returns a tweet bubble for the specified tweet
function createTweetBubble(tweet){
	var bubble = new TweetBubble();
	bubble.user.login = tweet.user.screen_name;
	bubble.user.name = tweet.user.name;
	bubble.tweetText = tweet.text;
	bubble.mood = getMood(bubble.tweetText);
	bubble.tweetTime = new Date(tweet.created_at).getTime();
	var rangeMilliseconds = bubble.getRange().hours*3600*1000 + bubble.getRange().minutes*60*1000;
	bubble.beginTime = bubble.tweetTime - rangeMilliseconds;
	bubble.endTime = bubble.tweetTime + rangeMilliseconds; 
  	return bubble;
}

// Returns mood linked to the specified text (using "moodAPI")
function getMood(text){
	var moodApiUrl = 'http://localhost:8080/moodAPI/api/' + encodeURIComponent(text.replace(/\//g, "").replace(/\\/g, ""));
	var mood;
	$.ajax({
		url: moodApiUrl,
		async: false,
		dataType: "json",
		success: function(data) {
			mood = data;
		}
	});
	return mood;
}

// Returns an array of result slots built according to specified activity bubbles and tweet bubbles
function getResultSlots(collaboratorsInfo, collaboratorTweetBubbles, collaboratorActivityBubbles){
	// Holds
	var results = new Array(); 
	// Holds all times that indicate beginning or end of the bubbles
	var events = new Array();
	// For each bubbles adds in events array beginning and end time
	$.each(collaboratorTweetBubbles, function(){
		events.push(this.beginTime);
		events.push(this.endTime);
	});
	$.each(collaboratorActivityBubbles, function(){
		events.push(this.beginTime);
		events.push(this.endTime);
	});
	// Sorts events using comparing function eventsComparator (sorts according to eventTime)
	events = events.sort(eventsComparator);
	// Creates slots from events
	for(var i = 0; i<events.length-1; i++){
		// Considers beginning and end af a slot
		var eventBeginTimeDate = new Date(events[i]);
		var eventEndTimeDate = new Date(events[i+1]);
		// Finds involved tweetBubbles in this slot
		var involvedTweetBubbles = new Array();
		$.each(collaboratorTweetBubbles, function(){
			// A bubble is involved if the "intersection" between the bubble and the slot is not empty
			var tweetBubbleBeginTimeDate = new Date(this.beginTime);
			var tweetBubbleEndTimeDate = new Date(this.endTime);
			if(eventBeginTimeDate < tweetBubbleEndTimeDate && eventEndTimeDate > tweetBubbleBeginTimeDate){
				involvedTweetBubbles.push(this);
			}
		});
		// Finds involved activityBubbles in this slot
		var involvedActivityBubbles = new Array();
		// Helps to recognise if the slot is "fixing bug" or "buggy" one
		// For each "fix bug" bubble this counter in increased, for each "buggy" bubble it is decreased
		var bugFixingAndIntroduction = 0;
		$.each(collaboratorActivityBubbles, function(){
			// A bubble is involved if the "intersection" between the bubble and the slot is not empty
			var activityBubbleBeginTimeDate = new Date(this.beginTime);
			var activityBubbleEndTimeDate = new Date(this.endTime);
			if(eventBeginTimeDate < activityBubbleEndTimeDate && eventEndTimeDate > activityBubbleBeginTimeDate){
				involvedActivityBubbles.push(this);
				if(this.fixBugCommit == true){
					bugFixingAndIntroduction++;
				}
				if(this.buggyCommit == true){
					bugFixingAndIntroduction--;
				}
			}
		});
		// Builds slot object
		var slot = new ResultSlot();
		// Computes mood
		if(involvedTweetBubbles.length > 1){
			// More than one bubble is involved
			slot.mood = getMoodMergingTweetBubbles(involvedTweetBubbles);
			slot.isAverageMood = true;
		} else {
			// One bubble is involved or no one 
			if(involvedTweetBubbles.length == 1){
				// One bubble is involved
				slot.mood = involvedTweetBubbles[0].mood;
			}
			// else branch
				// Ok default value "undefined"
		}
		// Computes productivityIndex
		if(involvedActivityBubbles.length > 1){
			// More than one bubble is involved
			slot.productivityIndex = getProductivityIndexMergingActivityBubbles(involvedActivityBubbles);
			slot.isAverageProductivityIndex = true;
		} else {
			// One bubble is involved or no one 
			if(involvedActivityBubbles.length == 1){
				// One bubble is involved
				slot.productivityIndex = involvedActivityBubbles[0].productivityIndex;
			}
			// else branch
				// Ok default value "undefined"
		}
		slot.beginTime = events[i];
		slot.endTime = events[i + 1];
		// If the counter is equal to 0 the slot is not "buggy" neither "fixing bug", 
		// if it is smaller than 0 the slot is "buggy", otherwise the slot is "fixing bug"
		slot.bugFixingAndIntroduction = (bugFixingAndIntroduction==0) ? 0 : ((bugFixingAndIntroduction>0) ? 1 : -1);
		results.push(slot);	
	}
	return results;
}

// Returns productivityIndex considering bubbles overlapping (average of indices)
function getProductivityIndexMergingActivityBubbles(bubbles){
	// Following two conditions are for completness (they can be deleted in this implementation)
	if(bubbles.length == 0){
		return undefined;
	}
	if(bubbles.length == 1){
		return bubbles[0].productivityIndex;
	}
	var productivityIndex = 0;
	$.each(bubbles, function(){
		productivityIndex += this.productivityIndex;
	});
	// Computes average
	productivityIndex = productivityIndex/bubbles.length;
	return productivityIndex;
}

// Returns mood considering bubbles overlapping (texts in a single one)
function getMoodMergingTweetBubbles(tweetBubbles){
	// Following two conditions are for completness (they can be deleted in this implementation)
	if(tweetBubbles.length == 0){
		return undefined;
	}
	if(tweetBubbles.length == 1){
		return tweetBubbles[0].mood;
	}
	var completeText = "";
	$.each(tweetBubbles, function(){
		// Creates a new text from involved ones
		completeText += this.tweetText + " ";
	});
	// Returns mood of the new text
	return getMood(completeText);
}

// Returns -1, 0, 1 according to sorting policy
function eventsComparator(event1, event2){
	var date1 = new Date(event1);
	var date2 = new Date(event2);
	return (date1 == date2) ? 0 : (date1 > date2) ? 1 : -1;
}

// Handles exception
function exceptionHandler(e){
	hideProgressBar();
	if (e instanceof GitHubException){
		if(e.getStatus == 403){
			alert("ERROR: GitHub Rate-limit-exceeded");
			return;
		}
		// An exception about GitHub occurs
		switch (e.getType()){
			case "GetCollaboratorsByProject":
				showNoResultAlert();
				alert("ERROR: GitHub Request Collaborators List");
				break;
			case "GetCollaboratorInfo":
				alert("ERROR: GitHub Request Collaborator Information");
				break;
			case "GetCommits":
				if(e.getStatus() == "409"){
					showNoCommitsAlert();
					return;	
				}
				alert("ERROR: GitHub Request Project Commits");
				break;
			case "GetCommitInfo":
				alert("ERROR: GitHub Request Commit Information");
				break;
			case "GetCommitDifferences":
				alert("ERROR: GitHub Request Commits Differences");
				break;
		}
		return;
	}
	if (e instanceof TwitterException){		
		// An exception about Twitter occurs
		console.log(e);
		switch (e.getType()){
			case "GetUser":
				alert("ERROR: Twitter Search User");
				break;
			case "GetTweets":
				alert("ERROR: Twitter Request Tweets By User");
				break;
		}
		return;
	}
	// Never used
	if (e instanceof MoodAPIException){
		// An exception about MoodAPI occurs
		console.log(e);
		switch (e.getType()){
			case "GetMood":
				break;
		}
		return;
	}
	if (e instanceof NoResultException){
		// No result exception occurs
		showNoResultAlert();
		return;
	}
	// Another exception occurs
	console.log(e);
	console.log("generic error");
	alert("Unespected error occurs");
}

// Shows results in output
function showResult(collaboratorsAnalysisResult){
	hideProgressBar();
	if(collaboratorsAnalysisResult.collaboratorsAnalysisResult == undefined){
		throw new NoResultException("no result");
	} else  {
		// Moves elements shown in the page
		buildPage();
		// Passes data
		shareDataToGraphics(collaboratorsAnalysisResult);
		// Fills collaborators list
		createCollaboratorsList();
		// Draws the plot about overview
		drawOverviewPlot();
		// Opens a new window with analysis result as a string
		openResultWindow(collaboratorsAnalysisResult);
	}
}

// Opens a new window with analysis result as a string
function openResultWindow(collaboratorsAnalysisResult){
	var recipe = window.open("",'Analysis Result','width=800,height=600');
	var html = "<html><head><title>Analysis Result</title></head><body>" + JSON.stringify(collaboratorsAnalysisResult) + "</body></html>";
    recipe.document.open();
    recipe.document.write(html);
    recipe.document.close();
}