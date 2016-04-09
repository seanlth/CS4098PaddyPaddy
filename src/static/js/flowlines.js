

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

function numberOfFlowLinesPerLevel(agentFlowLines) {
    var lanes = []
    for ( var i = 0; i < agentFlowLines.length; i++) {
        var found = false;
        for ( var j = 0; j < lanes.length; j++ ) {
            if ( agentFlowLines[i].y == lanes[j].y ) {
                found = true;
                lanes[j].count++;
                break;
            }
        }
        if ( found == false ) {
            lanes.push({y: agentFlowLines[i].y, count: 1});
        }
    }
    return lanes;
}

function numberOfFlowLanesOnLevel(lanes, yLevel) {
    for ( var j = 0; j < lanes.length; j++ ) {
        if ( yLevel == lanes[j].y ) {
            return lanes[j].count;
        }
    } 
}

function numberOfLevels(agentFlowLines) {
    var levels = [] // essentially how many y values swimlanes are in
    for ( var i = 0; i < agentFlowLines.length; i++) {
        var found = false;
        for ( var j = 0; j < levels.length; j++ ) {
            if ( agentFlowLines[i].y == levels[j] ) {
                found = true;
            }
        }
        if ( found == false ) {
            levels.push(agentFlowLines[i].y);
        }
    }
    return levels;
}

function getYOffset(yOffsets, yValue) {
    for (var i = 0; i < yOffsets.length; i++) {
        if ( yOffsets[i] == yValue ) {
            return i;
        }
    }
    return 0; // just because
}

function previousXWithYValue(array, yValue) {
    for (var i = 0; i < array.length; i++) {
        if ( array[i].y == yValue ) {
            return i;
        }
    }
    return -1;
}

function flatten(agentFlowLines) {
    var flattenedArray = [];
        
    for (var i = 0; i < agentFlowLines.length; i++) {
        var flowLine = agentFlowLines[i];
        
        // find a flattened flow line
        var found = false;
        for (var j = 0; j < flattenedArray.length; j++ ) {
            var flattened = flattenedArray[j];
            if ( flowLine.name == flattened.name ) {
                found = true;
                var newPositions = [];
                newPositions.push({name: "start", x: flowLine.start, y: flowLine.y});
                for (var k = 0; k < flowLine.positions.length; k++) {
                    newPositions.push({name: flowLine.positions[k].name, x: flowLine.positions[k].x, y: flowLine.y});
                }
                newPositions.push({name: "end", x: flowLine.end, y: flowLine.y});

                flattened.positions = flattened.positions.concat(newPositions);
                break;
            }
        }

        if ( found == false ) {
            var newPositions = [];
            newPositions.push({name: "start", x: flowLine.start, y: flowLine.y});
            for (var j = 0; j < flowLine.positions.length; j++) {
                newPositions.push({name: flowLine.positions[j].name, x: flowLine.positions[j].x, y: flowLine.y});
            }
            newPositions.push({name: "end", x: flowLine.end, y: flowLine.y});

            flattenedArray.push( {name: flowLine.name, positions: newPositions, colour: flowLine.colour  }  );
        }
    }
    for (var i = 0; i < flattenedArray.length; i++) {
        var array = flattenedArray[i];

        array.positions.sort(function(a, b) { return a.x - b.x; });
    }
    return flattenedArray;
}

function drawFlowLines(start, end, agentFlowLines) {
   
    var array = flatten(agentFlowLines);

    var lanesPerLevel = numberOfFlowLinesPerLevel(agentFlowLines);
	var numberOfFlowLines = lanesPerLevel[0].count;

	var nodeLocations = [];
	var gap = 10;

	//var yOffset = floor(numberOfFlowLines / 2) * gap;
    var yLevels = numberOfLevels(agentFlowLines);
    var yOffsets = [];
    for (var i = 0; i < yLevels.length; i++) {
        var lanesOnLevel = numberOfFlowLanesOnLevel(lanesPerLevel, yLevels[i]);
        yOffsets.push(-floor(lanesOnLevel / 2) * gap);
    }

    var previousXPosition = [];

    for (var i = 0; i < yLevels.length; i++) {
        previousXPosition.push({name, x: -1, y: yLevels[i]});
    }

    for ( var i = 0; i < array.length; i++ ) {
        var flowLine = array[i];
        var colour = flowLine.colour;
        stroke(colour.r, colour.g, colour.b);
        strokeWeight(2);
        
        var previous = {y: -1, previousX: -1}; // previous position visited 
        // loop over each node in the line
        for (var j = 0; j < flowLine.positions.length; j++) {
            var position = flowLine.positions[j];
            var xValue = position.x;
            var yValue = position.y;
            var yOffset = yOffsets[getYOffset(yLevels, yValue)];
            
            var previousXIndex = previousXWithYValue(previousXPosition, yValue);
            var previousX = previousXPosition[previousXIndex];

            if ( previousX.x == -1 ) {
                // startingPoint on for this yValue
                previousXPosition[previousXIndex] = position; // previous position on this yLevel
                if (previous.y != -1) {
                    var yOffset = yOffsets[getYOffset(yLevels, previous.y)];
                    line(previous.x, previous.y + yOffset, xValue, previous.y + yOffset);    
                    previousXPosition[ previousXWithYValue(previousXPosition, previous.y) ].x = xValue;
                    previousXPosition[ previousXWithYValue(previousXPosition, previous.y) ].name = position.name;
                }
            }
            else {
                if ( previousX.name == "start" && previous.name == "end" ) {
                    previousXPosition[ previousXWithYValue(previousXPosition, yValue) ].x = previous.x;
                    previousXPosition[ previousXWithYValue(previousXPosition, yValue) ].name = previous.name;
                    
                    if ( position.name != "start" && position.name != "end" ) {
                        nodeLocations.push( {x: xValue, y: yValue + yOffset, colour: {r: colour.r, g: colour.g, b: colour.b}, name: position.name} );
                    }

                    line(previousX.x, yValue + yOffset, xValue, yValue + yOffset);    
                    previousXPosition[previousXIndex].x = xValue; // previous position on this yLevel
                }
                else {
                    if ( position.name != "start" && position.name != "end" ) {
                        nodeLocations.push( {x: xValue, y: yValue + yOffset, colour: {r: colour.r, g: colour.g, b: colour.b}, name: position.name} );
                    }

                    line(previousX.x, yValue + yOffset, xValue, yValue + yOffset);    
                    previousXPosition[previousXIndex] = position; // previous position on this yLevel
                }
            }
            previous = position;
        }
       
        yOffsets[getYOffset(yLevels, yValue)] = yOffset + gap;
    }
    
    /* 
	for ( var i = 0; i < array.length; i++ ) {
        var yOffset = yOffsets[getYOffset(yLevels, agentFlowLines[i].y)];
		var array = agentFlowLines[i].positions;
		var colour = agentFlowLines[i].colour;	
		var previousXPosition = agentFlowLines[i].start;
        var endXPosition = agentFlowLines[i].end;
		var y = agentFlowLines[i].y;

		var R = colour.r;
		var G = colour.g;
		var B = colour.b;

		stroke(R, G, B);
		strokeWeight(2);
		
		var position = array[0];
		line(previousXPosition, y + yOffset, position.x, y + yOffset);
		nodeLocations.push( {x: position.x, y: y + yOffset, colour: {r: R, g: G, b: B}, name: position.name} );
		previousXPosition = position.x;

		for ( var j = 1; j < array.length; j++ ) {
			var xPosition = array[j].x;
			line(previousXPosition, y + yOffset, xPosition, y + yOffset);
			nodeLocations.push( {x: xPosition, y: y + yOffset, colour: {r: R, g: G, b: B}, name: array[j].name} );
			previousXPosition = xPosition;
		}
		line(previousXPosition, y + yOffset, endXPosition, y + yOffset);
		yOffsets[getYOffset(yLevels, agentFlowLines[i].y)] = yOffsets[getYOffset(yLevels, agentFlowLines[i].y)] + gap;
	}
    */
	var c = {r: 0, g: 0, b: 0};
	drawNode(start.x, start.y, 15 + numberOfFlowLines * gap, c);
	for ( var i = 0; i < nodeLocations.length; i++ ) {
		var node = nodeLocations[i];
		textAlign(CENTER, CENTER);
		stroke(255);
		fill(0);
		text(node.name, node.x, node.y - 15);
		drawNode(node.x, node.y, 15, node.colour);
	}
	drawNode(end.x, end.y, 10 + numberOfFlowLines * gap, c);
    
	// reset drawing variables 
	fill(0);
	strokeWeight(1);
	stroke(255);
}
