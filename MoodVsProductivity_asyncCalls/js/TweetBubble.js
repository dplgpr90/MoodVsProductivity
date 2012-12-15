// Class TweetBubble
function TweetBubble () {
  
  // Members
  var range = { "hours": 1, "minutes": 0 }; // max values: 23 for hours, 59 for minutes
  this.mood = undefined;
  this.user = { "login": undefined, "name": undefined};
  this.tweetTime = undefined;
  this.beginTime = undefined;
  this.endTime = undefined;
  this.tweetText = undefined;

  // Methods
  this.getRange = function () {
    return range;
  }

}