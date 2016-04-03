

function drawNode(x, y, radius, agentColour) {
	strokeWeight(0);
	var r = agentColour.r;
	var g = agentColour.g;
	var b = agentColour.b;
	fill(r, g, b);
	ellipse(x, y, radius, radius);
	fill(255);
	ellipse(x, y, radius - 5, radius - 5);
	strokeWeight(2);
}

function drawFlowLines(start, end, agentFlowLines) {
    
	var numberOfFlowLines = agentFlowLines.length;

	var nodeLocations = [];
	var gap = 10;

	var yOffset = -floor(numberOfFlowLines / 2) * gap;

	for ( var i = 0; i < agentFlowLines.length; i++ ) {
		var array = agentFlowLines[i].positions;
		var colour = agentFlowLines[i].colour;	
		var previousPosition = start;
		
		var R = colour.r;
		var G = colour.g;
		var B = colour.b;
		stroke(R, G, B);
		strokeWeight(2);
		
		var position = array[0];
		line(7.5 + previousPosition.x, previousPosition.y + yOffset, position.x, position.y + yOffset);
		nodeLocations.push( {x: position.x, y: position.y + yOffset, colour: {r: R, g: G, b: G}} );
		previousPosition = position;

		for ( var j = 1; j < array.length; j++ ) {
			var position = array[j];
			line(7.5 + previousPosition.x, previousPosition.y + yOffset, position.x, position.y + yOffset);
			nodeLocations.push( {x: position.x, y: position.y + yOffset, colour: {r: R, g: G, b: B}} );
			previousPosition = position;
		}
		line(7.5 + previousPosition.x, previousPosition.y + yOffset, end.x, end.y + yOffset);
		yOffset += gap;
	}
	var c = {r: 0, g: 0, b: 0};
	drawNode(start.x, start.y, 15 + numberOfFlowLines * gap, c);
	for ( var i = 0; i < nodeLocations.length; i++ ) {
		var node = nodeLocations[i];
		drawNode(node.x, node.y, 15, node.colour);
	}
	drawNode(end.x, end.y, 10 + numberOfFlowLines * gap, c);

	// reset drawing variables 
	fill(0);
	strokeWeight(1);
	stroke(0);
}
