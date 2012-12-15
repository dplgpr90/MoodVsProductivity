// Class ScoringSystem
function ScoringSystem () {
  
  // Members
  var codeFileAdded = 0.7;
  var codeFileModified = 0.5;
  var codeFileRemoved = 0.3;
  var buggyCode = -1;
  var fixBuggyCode = 1;
  var documentationFileAdded = 0.3;
  var documentationFileModified = 0.2;
  var documentationFileRemoved = -0.15;
  
  // Methods
  this.getCodeFileAddedValue = function () {
    return codeFileAdded;
  }
  
  this.getCodeFileModifiedValue = function () {
    return codeFileModified;
  }
    
  this.getCodeFileRemovedValue = function () {
    return codeFileRemoved;
  }
    
  this.getDocumentationFileAddedValue = function () {
    return documentationFileAdded;
  }
  
  this.getDocumentationFileModifiedValue = function () {
    return documentationFileModified;
  }

  this.getDocumentationFileRemovedValue = function () {
    return documentationFileRemoved;
  }
  
  this.getBuggyCodeValue = function () {
    return buggyCode;
  }
  
  this.getFixBuggyCodeValue = function () {
    return fixBuggyCode;
  }
}