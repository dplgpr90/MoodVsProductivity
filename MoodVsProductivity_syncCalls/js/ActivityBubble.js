// Class ActivityBubble
function ActivityBubble () {
  
  // Members
  var range = { "hours": 1, "minutes": 30 }; // max values: 23 for hours, 59 for minutes 
  this.productivityIndex = 0;
  this.user = { "login": undefined, "name": undefined};
  this.beginTime = undefined;
  this.endTime = undefined;
  
  // Commit properties
  this.commitTime = undefined;
  this.commitUrl = undefined;
  this.commitSha = undefined; // ID (alphanumeric key) of the commit
  this.fixBugCommit = false;
  this.buggyCommit = false;

  // Commit properties about files 
  this.addedCodeFiles = 0;
  this.modifiedCodeFiles = 0;
  this.removedCodeFiles = 0;
  this.addedDocumentationFiles = 0;
  this.modifiedDocumentationFiles = 0;
  this.removedDocumentationFiles = 0;

  // Methods
  this.getRange = function () {
    return range;
  }

}