function d3_drawOverviewPlot(data){

	// quantitative color scale
	var colorPalette = d3.scale.category10();
  
	var color = function(d) { return colorPalette(d['Collaborator']); };
	
	var parcoords = d3.parcoords()("#plotOverview")
	   .data(data)
	   .color(color)
	   .alpha(0.4)
	   .render()
	   .brushable();  // enable brushing

	// create data table, row hover highlighting
	var grid = d3.divgrid();

	d3.select("#gridOverview")
		.datum(data)
		.call(grid)
		.selectAll(".row")
		.on({
		  "mouseover": function(d) { parcoords.highlight([d]) },
		  "mouseout": parcoords.unhighlight
		});

	// update data table on brush event
	parcoords.on("brush", function(d) {
		d3.select("#gridOverview")
		  .datum(d)
		  .call(grid)
		  .selectAll(".row")
		  .on({
			"mouseover": function(d) { parcoords.highlight([d]) },
			"mouseout": parcoords.unhighlight
		  });
	});
}
