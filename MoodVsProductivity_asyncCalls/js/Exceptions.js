function GitHubException(status, text, exceptionType){
  // Members
  var status = status;
  var text = text;
  var exceptionType = exceptionType;

  // Methods
  this.getStatus = function () {
    return status;
  }
  
  this.getText = function () {
    return text;
  }

  this.getType = function () {
    return exceptionType;
  }
}

function TwitterException(status, text, exceptionType){
  // Members
  var status = status;
  var text = text;
  var exceptionType = exceptionType;

  // Methods
  this.getStatus = function () {
    return status;
  }
  
  this.getText = function () {
    return text;
  }

  this.getType = function () {
    return exceptionType;
  }
}

function MoodAPIException(status, text, exceptionType){
  // Members
  var status = status;
  var text = text;
  var exceptionType = exceptionType;

  // Methods
  this.getStatus = function () {
    return status;
  }
  
  this.getText = function () {
    return text;
  }

  this.getType = function () {
    return exceptionType;
  }
}

function NoResultException(text){
  // Members
  var text = text;
  
  this.getText = function () {
    return text;
  }
}