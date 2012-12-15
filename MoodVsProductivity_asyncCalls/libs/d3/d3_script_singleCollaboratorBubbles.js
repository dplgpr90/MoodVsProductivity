function d3_drawCollaboratorBubble(plotWidth, data, tweetBubbleWidth, activityBubbleWidth, timeWindow){

  var offset;
  
  if(tweetBubbleWidth != undefined){
    offset = (tweetBubbleWidth>activityBubbleWidth)?tweetBubbleWidth/2:activityBubbleWidth/2;
  } else {
    offset = activityBubbleWidth/2;
  }

  var margin = {top: 20, right: 100 + offset, bottom: 30, left: 40 + offset},
      width = plotWidth - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var x = d3.time.scale()
        .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var svg = d3.select("#bubblesPlot").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent(data, function(d) { return d.time; })).nice();
    y.domain([0,3]).nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Time");

    var tweetBubbleValue;
    if(tweetBubbleWidth != undefined){
      tweetBubbleValue = ((tweetBubbleWidth/timeWindow<2)?2:tweetBubbleWidth/timeWindow);
    } else {
      tweetBubbleValue = 0;
      data.push({"height": 1, "time": data[0].time});
    }
    var activityBubbleValue = ((activityBubbleWidth/timeWindow<2)?2:activityBubbleWidth/timeWindow);

   	svg.selectAll(".dot")
        .data(data)
      .enter().append("ellipse")
        .attr("class", "dot")
        .attr("rx", function(d) { return (d.height == 1)? tweetBubbleValue : activityBubbleValue; })
        .attr("ry", (60/timeWindow)<2?2:60/timeWindow)
        .attr("cx", function(d) { return x(d.time); })
        .attr("cy", function(d) { return y(d.height); })
        .attr("data-legend",function(d) { return d.height})
        .style("fill", function(d) { return (d.height == 1)? "rgba(0,100,255,0.45)" : "rgba(255,127,14,0.45)"; });	

    legend = svg.append("g")
      .attr("class","legend")
      .attr("transform","translate(50,30)")
      .style("font-size","12px")
      .style("font-weight","bold")
      .call(d3.legend)
}
