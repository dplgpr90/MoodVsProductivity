function d3_drawCollaboratorPlot(plotWidth, dataLeft, dataRight, dateForTiming){ 
  /*
    This is the structure of two passed objects: "dataLeft" and "dataRight"
      {"minValue","maxValue","dataValues"}
    where:
      - minValue is a number
      - maxValue is a number
      - dataValues is an array of objects of type {"date","pointValue"} 
          i.e. {"date": new Date("2012-01-01 04:10:20"), "pointValue": 45.9}
  */
  var margin = {top: 50, right: 130, bottom: 50, left: 80},
      width = plotWidth - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  // Not necessary in this case, d is already a Date object and not a string
  // var parseDate = d3.time.format("%Y%m%d%H%M%S").parse;

  var x = d3.time.scale()
      .range([0, width]);

  // Left vertical axis
  var y1 = d3.scale.linear()
      .range([height, 0]);

  // Right vertical axis
  var y2 = d3.scale.linear()
      .range([height, 0]);

  var colorLeft = d3.scale.category10();
  var colorRight = d3.scale.category10();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxisLeft = d3.svg.axis()
      .scale(y1)
      .orient("left");

  var yAxisRight = d3.svg.axis()
      .scale(y2)
      .orient("right");

  var lineLeftyAxis = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y1(d.val); });

  var lineRightyAxis = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y2(d.val); });

  var svg = d3.select("#singleCollaboratorPlotGraphics").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  /* 
    Example
      var dataLeft = new Array();
      dataLeft.push({"date": new Date("2012-01-01 04:10:20"), "pointValue": 45.9});
      dataLeft.push({"date": new Date("2112-04-02 23:52:10"), "pointValue": 25.9});
      var dataRight = new Array();
      dataRight.push({"date": new Date("2012-01-01 04:10:20"), "pointValue": 15.9});
      dataRight.push({"date": new Date("2112-04-02 23:52:10"), "pointValue": 63.9});
  */
  drawData(dataLeft, dataRight, dateForTiming);

  function drawData(dataLeftyAxis, dataRightyAxis, dateForTiming) {
    colorLeft.domain(d3.keys(dataLeftyAxis.dataValues[0]).filter(function(key) { return key !== "date"; }));
    colorRight.domain(d3.keys(dataRightyAxis.dataValues[0]).filter(function(key) { return key !== "date"; }));
    
    /* 
      Not necessary in this case, d is already a Date object and not a string
        dataLeftyAxis.dataValues.forEach(function(d) {
          d.date = parseDate(d.date);
        });

        dataRightyAxis.dataValues.forEach(function(d) {
          d.date = parseDate(d.date);
        });
    */
    var functionsLeftyAxis = colorLeft.domain().map(function(name) {
      return {
        name: name,
        values: dataLeftyAxis.dataValues.map(function(d) {
          return {date: d.date, val: +d[name]};
        })
      };
    });
    
    var functionsRightyAxis = colorRight.domain().map(function(name) {
      return {
        name: name,
        values: dataRightyAxis.dataValues.map(function(d) {
          return {date: d.date, val: +d[name]};
        })
      };
    });

    x.domain(d3.extent(dateForTiming, function(d) { return d.date; }));

    // If a domain is specified keeps it, otherwise computes values using d3
    if(dataLeftyAxis.minValue == undefined || dataLeftyAxis.maxValue == undefined){
      y1.domain([
        d3.min(functionsLeftyAxis, function(c) { return d3.min(c.values, function(v) { return v.val; }); }),
        d3.max(functionsLeftyAxis, function(c) { return d3.max(c.values, function(v) { return v.val; }); })
      ]);
    } else {
      y1.domain([
        dataLeftyAxis.minValue,
        dataLeftyAxis.maxValue
      ]);
    }
    
    if(dataRightyAxis.minValue == undefined || dataRightyAxis.maxValue == undefined){
      y2.domain([
        d3.min(functionsRightyAxis, function(c) { return d3.min(c.values, function(v) { return v.val; }); }),
        d3.max(functionsRightyAxis, function(c) { return d3.max(c.values, function(v) { return v.val; }); })
      ]);
    } else {
      y2.domain([
        dataRightyAxis.minValue,
        dataRightyAxis.maxValue
      ]);
    }

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis leftAxis")
        .call(yAxisLeft);

    svg.append("g")
        .attr("class", "y axis rightAxis")
        .attr("transform", "translate(" + width + ",0)")
        .call(yAxisRight);

    var functionLeftyAxis = svg.selectAll(".functionLeftyAxis")
        .data(functionsLeftyAxis)
      .enter().append("g")
        .attr("class", "functionLeftyAxis");
    var functionRightyAxis = svg.selectAll(".functionRightyAxis")
        .data(functionsRightyAxis)
      .enter().append("g")
        .attr("class", "functionRightyAxis");

    functionLeftyAxis.append("path")
        .attr("class", function(d) { return "line " + d.name; })
        .attr("d", function(d) { return lineLeftyAxis(d.values); })
        .style("stroke", function(d) { return colorLeft(d.name); });

    functionRightyAxis.append("path")
        .attr("class", function(d) { return "line " + d.name; })
        .attr("d", function(d) { return lineRightyAxis(d.values); })
        .style("stroke", function(d) { return colorLeft(d.name); });
        //.style("stroke", function(d) { return colorRight(d.name); });
  }
}

