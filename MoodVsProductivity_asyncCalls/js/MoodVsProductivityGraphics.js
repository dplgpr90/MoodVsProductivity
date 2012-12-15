/* RESULT DATA */
collaboratorsAnalysisResult = undefined;
errorCollaborator = undefined;
actualUserInfo = undefined;
noMoodAndProdResult = false;
alertLimitMoodAPIShown = false;

function onClickAnalyze(){
	analyzeMoodVsProductivity();
}

// Receives data from MoodVsProductivity module
function shareDataToGraphics(result){
	collaboratorsAnalysisResult = result.collaboratorsAnalysisResult;
	errorCollaborator = result.errorCollaborator;
	console.log(result);
}
/* RESULT DATA END */

/* BUILD PAGE */
// Moves elements shown in the page
function buildPage(){	
	if($("div.startInputs").attr("class") == "startInputs"){
	    // It is the first analysis
	    // Move input fields and button
	    $("div.startInputs").attr("class", "resultInputs");
	    // Shows separator line (<hr>)
	    $("#topSeparator").css("display", "block");
	    // Shows separator line (<hr>)
	    $("#container").css("display", "block");
	} else {
	    // It is not the first analysis
	}
}

// Shows alert when there is no result
function showNoResultAlert(){
	$("#noProjectResultAlert").show();
}

// Hides alert when there is no result
function onClickCloseNoResultAlert(){
	$("#noProjectResultAlert").hide();
}

// Shows alert when there are no commits for specified project
function showNoCommitsAlert(){
	$("#noProjectCommitsAlert").show();
}

// Hides alert when there are no commits for specified project
function onClickCloseNoCommitsAlert(){
	$("#noProjectCommitsAlert").hide();
}
/* BUILD PAGE END */


/* PROGRESS BAR */
progressBarSteps = 1;
actualProgressBarWidth = 0;

// Shows progress bar
function showProgressBar(){
  $("#dark").show();
  $("#progressBar").show();
}

// Hides progress bar
function hideProgressBar(){ 
  $("#progressBar").hide();
  $("#dark").hide();
  // $("#progressBar div.bar").css("width", "0%");
}

// Increases the width of the progress bar to simulate loading
function increaseProgressBar(){
  actualProgressBarWidth += 100/progressBarSteps;
  var width = actualProgressBarWidth + "%"; 
  $("#progressBar div.bar").css("width", width);
}

// Sets how many steps have to be done to simulate loading complete
function setProgressBarSteps(steps){
  progressBarSteps = steps;
}
/* PROGRESS BAR END */


/* COLLABORATORS LIST */
// Fills collaborator list
function createCollaboratorsList(){
	resetCollaboratorsList();
	$.each(collaboratorsAnalysisResult, function(index){
		var name = (this.collaborator.name.length > 18) ? (this.collaborator.name.slice(0,16) + "..") : this.collaborator.name;
		$("#collaboratorsList").append('<li><a href="#" onclick="onClickUserInList(this);"><i class="icon-chevron-right"></i>' + name + '<img class="githubIcon" src="./img/github.png" alt="' + this.collaborator.GitHubUrl + '" onClick="onClickGitHubIcon(this.alt)"><img class="twitterIcon" src="./img/twitter.png" alt="' + this.collaborator.TwitterUrl + '" onClick="onClickTwitterIcon(this.alt)"></a></li>');		
		if(this.collaborator.TwitterUrl == undefined){
			$("img.twitterIcon")[index].style.visibility = "hidden";
		}
		if(this.collaborator.GitHubUrl == undefined){
			$("img.githubIcon")[index].style.visibility = "hidden";
		}
	});
}

// Empties collaborator list
function resetCollaboratorsList(){
	$("#collaboratorsList").html('<li id="overview" class="overviewCollaborator active"><a href="#" onClick="javascript:onClickOverview(this);">OVERVIEW</a></li>');
}

// Links collaborator Twitter page
function onClickTwitterIcon(link){
	window.open(link,'twitter');
}

// Links collaborator GitHub page
function onClickGitHubIcon(link){
	window.open(link,'github');
}
/* COLLABORATORS LIST END*/


/* ON SELECTION FROM COLLABORATOR LIST */
// Called when user clicks on overview item, shows overview plot
function onClickOverview(element){
	// Hides alerts
	$("#singleCollaboratorPlot").hide();
	$("#collaboratorAlert").hide();
	$("#noResultAlert").hide();
	if(noMoodAndProdResult == true){
		// There are no rilevant overlapping betweet Activity Bubbles and Tweet ones for all collaborators
		$("#overviewPlot").hide();
		$("#noMoodOverviewAlert").show();
	} else {
		// There is at least a data set to draw plot
		$("#noMoodOverviewAlert").hide();
		$("#overviewPlot").show();
	}
	// Sets overview as selected
	$(element.parentNode).siblings().removeClass("active");
	$(element.parentNode).addClass("active");
}

// Called when user clicks on collaborator item, shows collaborator plots
function onClickUserInList(element){
	// Hides alerts
	$("#overviewPlot").hide();
	$("#noMoodOverviewAlert").hide();
	$("#singleCollaboratorPlot").hide();
	$("#collaboratorAlert").hide();
	// Sets the user as selected
	$(element.parentNode).siblings().removeClass("active");
	$(element.parentNode).addClass("active");
	// Holds index of clicked collaborator in the array of results
	var index = $(element.parentNode).index()-1;
	actualUserInfo = collaboratorsAnalysisResult[index];
	// Empties plots
	$("#singleCollaboratorPlotGraphics").html("");
	$("#bubblesPlot").html("");	
	// Unchecks time option
	var checkedInputs = $("#bubbleOptionsTimeGranularity input:checked");
	if(checkedInputs.length != 0){
		checkedInputs[0].checked = false;
	}
	if(actualUserInfo.slots == undefined){
		// No slots for current collaborator
		$("#collaboratorAlert").show();
	} else {
		// At least one slot for current collaborator
		drawCollaboratorPlot();
		drawUserBubbles();
		$("#singleCollaboratorPlot").show();
	}
}
/* ON SELECTION FROM COLLABORATOR LIST */

/* DRAW OF PLOTS */
// Builds data used to draw overview plot
function drawOverviewPlot(){	
	// Auxiliar variales holding max and min values of productivity indices
	// var minProductivity = findMinAll(collaboratorsAnalysisResult);
	// var maxProductivity = findMaxAll(collaboratorsAnalysisResult); 
	// Holds data to draw plot
	var data = new Array();
	// Holds a set of strings. Each one is "m" if mood is undefined, 
	// "p" if productivityIndex is undefined, "mp" if both are undefined
	var undefinedData = new Array();
	// Adds an empty element at the beginning
	// (it will be linked at the header row of the table)
	undefinedData.push("first"); 
	// Holds error from moodAPI
	var errorMoodAPI = "";
	$.each(collaboratorsAnalysisResult, function(){
		var this_collaborator = this;
		if(this.slots != undefined){
			// There is at least one slot
			$.each(this.slots, function(){
				var isUndefined = "";
				var normalizedValues = {"action": 0, "calm": 0, "depression": 0, "anxiety": 0};
				var energyIndex = 0;
				var polarityIndex = 0;
				if(this.mood != undefined && this.mood.error == undefined ){
					// Mood is defined and it is not an error
					normalizedValues = normalizeMoodValues(this.mood);
					energyIndex = parseFloat(this.mood.energyIndex);
					polarityIndex = parseFloat(this.mood.polarityIndex);
				} else {
					// Mood is undefined or it is an error
					isUndefined += "m";
					if(this.mood != undefined && this.mood.error != undefined && this.mood.error.text.indexOf("daily-transaction-limit-exceeded") != -1){
						// The error is about "rate limits"
						errorMoodAPI = "daily-transaction-limit-exceeded";
					}
				}
				var normalizedProductivityIndex = 0;
				if(this.productivityIndex != undefined){
					// Normalize values accoring to graphics politics
					// normalizedProductivityIndex = normalizeProductivityIndex(this.productivityIndex, minProductivity, maxProductivity);		  	
				} else {					
					isUndefined += "p";
				} 
				// Adds computed results into data array
				if(isUndefined == ""){
					data.push({"Collaborator": this_collaborator.collaborator.name, "productivity": this.productivityIndex, "energy": energyIndex, "polarity": polarityIndex, "action": normalizedValues.action, "calm": normalizedValues.calm, "depression": normalizedValues.depression, "anxiety": normalizedValues.anxiety});
				}
				undefinedData.push(isUndefined);
			});
		}
	});
	if(errorMoodAPI == "daily-transaction-limit-exceeded" && alertLimitMoodAPIShown == false){
		// "Rate limits" error occurs
		alert("ERROR moodAPI: daily-transaction-limit-exceeded");
		alertLimitMoodAPIShown = true;
	}
	// Deletes plot and table
	$("#plotOverview").html("");
	$("#gridOverview").html("");
	if(data.length == 0){
		// For each collaborator one of two scores is undefined
		noMoodAndProdResult = true;
	} else {
		// At least one collaborator has two scores as defined
		noMoodAndProdResult = false;
		// Draws plot and table using d3 lib
		d3_drawOverviewPlot(data);	
		// Writes "undefined" in the table according to undefined values
		// and fixes 4 digits after comma in float values
		fixTableItems(undefinedData);
	}
	// Simulates click on overview item
	onClickOverview($("#overview"));
}

// /* Writes "undefined" in the table where values are really undefined */
// and fixes 4 digits after comma in float values
function fixTableItems(undefinedData){
	// Retrieve table from dom
	var rows = $("#gridOverview > div.row");
	for (var i = 0; i < rows.length; i++) {
		var rowCols = rows[i].childNodes;
		/*
		if(undefinedData[i] != "" && undefinedData[i] != "first"){
			// Elements undefined
			if(undefinedData[i].indexOf("p") != -1){
				// ProductivityIndex is undefined
				rowCols[1].innerText = "undefined";
			}
			if(undefinedData[i].indexOf("m") != -1){
				// Mood values are undefined
				for(var j = 2; j<=7; j++){
					rowCols[j].innerText = "undefined";
				}
			}
		}
		*/
		for(var j = 1; j<=7; j++){
			if(rowCols[j].innerText != "undefined"){
				// It is a number
				var number = parseFloat(rowCols[j].innerText);
				rowCols[j].innerText = number.toFixed(4);
			}
		}
	}
}

// Draw plot for a collaborator 
function drawCollaboratorPlot(){
	// Empties plots
	$("#singleCollaboratorPlotGraphics").html("");
	// Hides no result alert
	$("#noResultAlert").hide();
	// Used to set plotWidth
	var plotWidth = parseInt($($("div.span10")[0]).css("width"));
	/*
		This is the structure of two passed objects: "dataLeft" and "dataRight"
	    	{"minValue","maxValue","dataValues"}
	    where:
	      	- minValue is a number
	      	- maxValue is a number
	      	- dataValues is an array of objects of type {"date","pointValue"} 
	          	i.e. {"date": new Date("2012-01-01 04:10:20"), "pointValue": 45.9}
  	*/
  	// Holds all ids of checked parameters
  	var checkedTime = new Array();
  	$("#plotOptionsTimeGranularity input:checked").each(function(){checkedTime.push(this.id)});
	// Holds data to draw the plot  	
	var left = new Array();
	var right = new Array();
	// Auxiliar variales
	var minProductivity = findMin(actualUserInfo.slots); 
	var maxProductivity = findMax(actualUserInfo.slots); 
	// Holds dates
	var dateForTiming = new Array();
	var now = new Date();
	var oneWeekPast = new Date(now - 7 * 24 * 60 * 60 * 1000);
	var oneMonthPast = new Date(now - 31 * 24 * 60 * 60 * 1000);
	var oneYearPast = new Date(now - 365 * 24 * 60 * 60 * 1000);

	$.each(actualUserInfo.slots, function(){
		if( ($.inArray("day", checkedTime) != -1 && now.toDateString() != new Date(this.beginTime).toDateString() )	  ||
			($.inArray("week", checkedTime) != -1 && new Date(this.beginTime) <= oneWeekPast )  ||
			($.inArray("month", checkedTime) != -1 && new Date(this.beginTime) <= oneMonthPast ) ||
			($.inArray("year", checkedTime) != -1 && new Date(this.beginTime) <= oneYearPast ) 
			){
			// Nothing to do
		} else {
			dateForTiming.push({"date": new Date(this.beginTime)});
			// Left axis	
			var pointValue;	
			if(this.mood != undefined && this.mood.error == undefined){
				var normalizedValues = normalizeMoodValues(this.mood);
				left.push({"date": new Date(this.beginTime), "energy": parseFloat(this.mood.energyIndex), "polarity": parseFloat(this.mood.polarityIndex), "action": normalizedValues.action, "calm": normalizedValues.calm, "depression": normalizedValues.depression, "anxiety": normalizedValues.anxiety});
			}
			if(this.productivityIndex != undefined){
				// Right axis
				// var normalizedProductivityIndex = normalizeProductivityIndex(this.productivityIndex, minProductivity, maxProductivity);		  	
			  	if(this.bugFixingAndIntroduction == 0){
			  		right.push({"date": new Date(this.beginTime), "bug": (maxProductivity+minProductivity)/2, "productivity": this.productivityIndex});
			  	} else if(this.bugFixingAndIntroduction > 0){		  			
			  		right.push({"date": new Date(this.beginTime), "bug": maxProductivity, "productivity": this.productivityIndex});
			  	} else {
			  		right.push({"date": new Date(this.beginTime), "bug": minProductivity, "productivity": this.productivityIndex});
			  	}
			}
		}
	});	    
	/* Setting of minimun and maximum value for vertical axes */
  	// Right axis
	minValueRight = minProductivity;
  	maxValueRight = maxProductivity;  	
	// Left axis
	// Alwais setted to following values (normalized)
	minValueLeft = -1;
  	maxValueLeft = 1;  	
  	var dataLeft = {"minValue": minValueLeft, "maxValue": maxValueLeft, "dataValues": left};
  	var dataRight = {"minValue": minValueRight, "maxValue": maxValueRight, "dataValues": right};
	// Draws plot using d3 lib
	d3_drawCollaboratorPlot(plotWidth, dataLeft, dataRight, dateForTiming);
	// Sets color like a legend
	colorForLegend();
	if(dateForTiming.length < 3){
		// No lines in the plot
		$("#noResultAlert").show();
	}
}

// Normalizes productivityIndex value in interval from -1 to 1
function normalizeProductivityIndex(index, min, max){
	if(min<0 && max>=0){
		max -= min;
		index -= min;
		min = 0; 
	}
	if(max==min) 
		return 0;
	return ((Math.abs(index)-Math.abs(min))/((Math.abs(max)-Math.abs(min))/2))-1;		
}

// Colors label of inputs
function colorForLegend(){
	var lines = $("#singleCollaboratorPlotGraphics g.functionLeftyAxis path, #singleCollaboratorPlotGraphics g.functionRightyAxis path");
	$.each(lines,function(){
		var inputId = this.attributes[0].nodeValue.replace("line ","");
		var label = $("#"+inputId)[0].parentNode;
		var color = this.attributes[2].nodeValue.replace("stroke: ","").replace(";","");
		$(label).css("color", color);
	});	
}

// Find global min value of productivityIndex
function findMinAll(results){
	var min = 0;
	var first = true; 
	$.each(results,function(){
		if(this.slots != undefined && first == true){
			min = findMin(this.slots);
			first = false;
		}
		if(this.slots != undefined){
			var minSlot = findMin(this.slots);
			if(minSlot < min){
				min = minSlot;
			}
		}
	});
	return min;
}

// Find global max value of productivityIndex
function findMaxAll(results){
	var max = 0;
	var first = true; 
	$.each(results,function(){
		if(this.slots != undefined && first == true){
			max = findMax(this.slots);
			first = false;
		}
		if(this.slots != undefined){
			var maxSlot = findMax(this.slots);
			if(maxSlot > max){
				max = maxSlot;
			}
		}
	});
	return max;
}

// Find min value of productivityIndex in an array of slots
function findMin(slots){
	var min = 0;
	var first = true;
	$.each(slots,function(){
		if(this.productivityIndex != undefined && first == true){
			min = this.productivityIndex;	
			first = false;			
		}
		if(this.productivityIndex != undefined && this.productivityIndex < min){
			min = this.productivityIndex;
		}
	});
	return min;
}

// Find max value of productivityIndex in an array of slots
function findMax(slots){
	var max = 0;
	var first = true;
	$.each(slots,function(){
		if(this.productivityIndex != undefined && first == true){
			max = this.productivityIndex;	
			first = false;			
		}
		if(this.productivityIndex > max){
			max = this.productivityIndex;
		}
	});
	return max;
}

// Normalizes mood values in interval from -1 to 1
function normalizeMoodValues(mood){
	var sqrt2 = Math.sqrt(2);
	var TWOsqrt2 = 2*sqrt2;
	var energy = parseFloat(mood.energyIndex);
	var polarity = parseFloat(mood.polarityIndex);
	var action = TWOsqrt2 - pythagoras(1-polarity, 1-energy);
	var calm = TWOsqrt2 - pythagoras(1-polarity, 1+energy);
	var anxiety = TWOsqrt2 - pythagoras(1+polarity, 1-energy);
	var depression = TWOsqrt2 - pythagoras(1+polarity, 1+energy);
	return {"action": (action/sqrt2)-1, "calm": (calm/sqrt2)-1, "depression": (depression/sqrt2)-1, "anxiety": (anxiety/sqrt2)-1};
}

// Pythagoras Theorem
function pythagoras(c1,c2){
	return Math.sqrt((c1*c1) + (c2*c2));
}

// Called when user clicks on checkboxes
function onClickPlotOptions(element){
	// Finds how box is selected
	var line;
	switch(element.id){
		case "productivity":
			line = $("#singleCollaboratorPlotGraphics path.productivity")[0];
			break;
		case "bug":
			line = $("#singleCollaboratorPlotGraphics path.bug")[0];
			break;
		case "energy":
			line = $("#singleCollaboratorPlotGraphics path.energy")[0];
			break;
		case "polarity":
			line = $("#singleCollaboratorPlotGraphics path.polarity")[0];
			break;
		case "action":
			line = $("#singleCollaboratorPlotGraphics path.action")[0];
			break;
		case "calm":
			line = $("#singleCollaboratorPlotGraphics path.calm")[0];
			break;
		case "depression":
			line = $("#singleCollaboratorPlotGraphics path.depression")[0];
			break;
		case "anxiety":
			line = $("#singleCollaboratorPlotGraphics path.anxiety")[0];
			break;
	}
	if(element.checked == false)
		// Hides linked line in plot
		$(line).attr("display","none");
	else
		// Shows linked line in plot
		$(line).attr("display","block");
}

// Called when user clicks on time options (radio buttons)
function onClickPlotOptionTimeGranularity(){
	// Resets checkboxes
	var inputs = $("#singleCollaboratorPlotOptions input");
	$.each(inputs, function(){
		this.checked = "checked";
	});
	// Redraw plot
	drawCollaboratorPlot();
}
/* DRAW OF PLOTS END */


/* DRAW OF BUBBLES */
function drawUserBubbles(zoom, timeWindow){
	// Empties the plot
	$("#bubblesPlot").html("");
	// Assigns default values	
	if(zoom == undefined){
		zoom = 10000;
	}
	if(timeWindow == undefined){
		timeWindow = 1;
	}
	// Computes the number of days covered by slots
	var days = countDays();
	var plotWidth = days*zoom;
	// Computes width of bubbles according to graphics settings
	var activityBubbleRange = actualUserInfo.activityBubbles[0].getRange();
	var activityBubbleWidth = (2*(activityBubbleRange.hours*60 + activityBubbleRange.minutes))/3;
	var tweetBubbleWidth = undefined;
	if(actualUserInfo.tweetBubbles.length != 0){
		var tweetBubbleRange = actualUserInfo.tweetBubbles[0].getRange();
		tweetBubbleWidth = (2*(tweetBubbleRange.hours*60 + tweetBubbleRange.minutes))/3;
	}
	/*
		data is an array of objects of type {"height","time"}
		where:
			- height is 1 if it is an activity bubble, 2 if a tweet one
			- time is commit of tweet time 
	*/
	var data = new Array();
  	// Inserting order defines color of bubbles
	$.each(actualUserInfo.tweetBubbles, function(){
		data.push({"height": 1, "time": new Date(this.tweetTime)});		
	});
	$.each(actualUserInfo.activityBubbles, function(){
		data.push({"height": 2,"time": new Date(this.commitTime)});
	});
	d3_drawCollaboratorBubble(plotWidth, data, tweetBubbleWidth, activityBubbleWidth, timeWindow);
	$("#bubblesPlot circle")[0].cy.baseVal.valueAsString = "-1.5em";
	$($("#bubblesPlot g.legend-items text")[0]).attr("y", "-1em");
	$($("#bubblesPlot g.legend-items text")[1]).attr("y", "1.25em");
	$($("#bubblesPlot g.legend-items text")[0]).attr("x", "1.5em");
	$($("#bubblesPlot g.legend-items text")[1]).attr("x", "1.5em");
	if($($("#bubblesPlot g.legend-items circle")[0]).css("fill") == "rgba(0, 100, 255, 0.45098039215686275)"){
		// Item 0 is blue
		$($("#bubblesPlot g.legend-items text")[0]).context.textContent = "Tweet Bubbles";
		$($("#bubblesPlot g.legend-items text")[1]).context.textContent = "Activity Bubbles";
	} else {
		// Item 0 is orange
		$($("#bubblesPlot g.legend-items text")[1]).context.textContent = "Tweet Bubbles";
		$($("#bubblesPlot g.legend-items text")[0]).context.textContent = "Activity Bubbles";		
	}
}

// Returns the number of days from beginning to end of user collaboration (Math floor)
function countDays(){
	var beginTime = new Date(actualUserInfo.slots[0].beginTime);
	var endTime = new Date(actualUserInfo.slots[actualUserInfo.slots.length-1].endTime);
	var difference = endTime - beginTime;
	var res = Math.floor(difference/(24*60*60*1000));
	return (res <= 0) ? 1 : res;
}

// Called when user clicks on time options (radio buttons)
function onClickBubbleOptionTimeGranularity(element){
	var zoom;
	var timeWindow;
	var days = countDays();
	// Sets the width of the plot
	var bubblesPlotWidth = parseInt($("#bubblesPlot").css("width"))-30;
	// According to the case, sets zoom variable
	switch(element.id){
		case "all":
			zoom = bubblesPlotWidth/days;
			timeWindow = days;
			break;
		case "year":
			zoom = bubblesPlotWidth/((days>365)?365:days);
			timeWindow = (days>365)?365:days;
			break;
		case "month":
			zoom = bubblesPlotWidth/((days>31)?31:days);
			timeWindow = (days>31)?31:days;
			break;
		case "week":
			zoom = bubblesPlotWidth/((days>7)?7:days);
			timeWindow = (days>7)?7:days;
			break;
		case "day":
			zoom = bubblesPlotWidth;
			timeWindow = 1;
			break;
	}
	// Draws plot according to the zoom
	drawUserBubbles(zoom, timeWindow);
}
/* DRAW OF BUBBLES END */