// Class ResultSlot
function ResultSlot () {  
  // Members
  this.mood = undefined;
  this.productivityIndex = undefined;
  this.beginTime = undefined;
  this.endTime = undefined;
  this.isAverageMood = false;
  this.isAverageProductivityIndex = false;
  /* 
	The following value is 0 when there is the same number of bug fixings and introductions, 
	1 when there are more bug fixings than introductions, 
	-1 otherwise 
  */
  this.bugFixingAndIntroduction = 0; 
}