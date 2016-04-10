

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

function drawAgentFlowLine(prog, agent, yOffset, colour, xStart, xEnd, y) {
    var xPositions = [];
    var yPositions = [];
    var match = false;
    var lastX = xStart;

    for(var i = 0; i < prog.actions.length; i++) {
        var action = prog.actions[i];
        if(!action.control) {
            var agents = action.agent.split(/("[^"]*")|([\s,&&,==,||])+/);

            var width = actionWidth / agents.length;
            var found = false;

            for(var j = 0; j < agents.length; j++) {
                if(!agents[j]) continue;

                var a = agents[j].split(/[.]+/)[0];
                if(a == agent) {
                    match = true;
                    if(prog.control) {
                        if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
                            line(lastX, action.yPixelPosition + yOffset, xEnd, action.yPixelPosition + yOffset);
                        }
                        else {
                            line(lastX, action.yPixelPosition + yOffset, action.xPixelPosition, action.yPixelPosition + yOffset);
                            lastX = action.xPixelPosition;
                        }
                    }
                    else {
                        line(lastX, action.yPixelPosition + yOffset, action.xPixelPosition, action.yPixelPosition + yOffset);
                        lastX = action.xPixelPosition;
                    }
                    if(!found) {
                        found = true;
                        nodeLocations.push( {x: action.xPixelPosition, y: action.yPixelPosition, yOffset: yOffset, colour: {r: colour.r, g: colour.g, b: colour.b}, name: action.name} );
                    }
                    else {
                        nodeLocations.push( {x: action.xPixelPosition, y: action.yPixelPosition, yOffset: yOffset, colour: {r: colour.r, g: colour.g, b: colour.b}, name: ""} );
                    }
                }
            }
        }
        else {
            if(drawAgentFlowLine(action, agent, yOffset, colour, action.startX, action.endX, action.y)) {
                if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
                    line(lastX, action.y + yOffset, action.startX, action.y + yOffset);
                    line(action.endX, action.y + yOffset, xEnd, action.y + yOffset);
                    match = true;
                }
                else {
                    line(lastX, action.y + yOffset, action.startX, action.y + yOffset);
                    lastX = action.endX;
                }
            }
        }
    }

    if(!prog.control) {
        line(lastX, y + yOffset, xEnd, y + yOffset);
    }
    else if(match && prog.control != FlowControlEnum.branch && prog.control != FlowControlEnum.selection) {
        line(lastX, y + yOffset, xEnd, y + yOffset);
    }

    return match;
}

var nodeLocations;

function drawAgentFlowLines(start, end, agents) {
    if(!agents) return;
    // var lanesPerLevel = numberOfFlowLinesPerLevel(agentFlowLines);
	// var numberOfFlowLines = lanesPerLevel[0].count;
    nodeLocations = [];
	var gap = 10;

    for(var i = 0; i < agents.length; i++) {
        var yOffset = i % 2 == 0 ? (i / 2) * gap : ((i + 1) / 2) * -gap;
        var colour = agents[i].colour;
        stroke(colour.r, colour.g, colour.b);
        strokeWeight(2);
        drawAgentFlowLine(program, agents[i].name, yOffset, colour, startX, endX, middle);
    }

    var c = {r: 0, g: 0, b: 0};
    drawNode(start.x, start.y, 15 + agents.length * gap, c);
    for ( var i = 0; i < nodeLocations.length; i++ ) {
        var node = nodeLocations[i];
        textAlign(CENTER, CENTER);
        stroke(255);
        fill(0);
        var last = true;
        for(var j = i + 1; j < nodeLocations.length; j++) {
            if(nodeLocations[j].x == node.x && nodeLocations[j].y == node.y) {
                last = false;
            }
        }
        if(last) {
            var textY = node.yOffset >= 0 ? node.y + node.yOffset - 15 : node.y + node.yOffset + 15;
            text(node.name, node.x, textY);
        }
        drawNode(node.x, node.y + node.yOffset, 15, node.colour);
    }
    drawNode(end.x, end.y, 10 + agents.length * gap, c);

    // reset drawing variables
    fill(0);
    strokeWeight(1);
    stroke(255);
}

function drawResourceFlowLine(prog, resource, yOffset, colour, xStart, xEnd, y) {
    var xPositions = [];
    var yPositions = [];
    var match = false;
    var lastX = xStart;

    for(var i = 0; i < prog.actions.length; i++) {
        var action = prog.actions[i];
        if(!action.control) {
            var resources = action.requires.split(/("[^"]*")|([\s,&&,==,||])+/).concat(action.provides.split(/("[^"]*")|([\s,&&,==,||])+/));
            

            var width = actionWidth / resources.length;
            var found = false;

            for(var j = 0; j < resources.length; j++) {
                if(!resources[j]) continue;

                var a = resources[j].split(/[.]+/)[0];
                if(a == resource) {
                    match = true;
                    if(prog.control) {
                        if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
                            line(lastX, action.yPixelPosition + yOffset, xEnd, action.yPixelPosition + yOffset);
                        }
                        else {
                            line(lastX, action.yPixelPosition + yOffset, action.xPixelPosition, action.yPixelPosition + yOffset);
                            lastX = action.xPixelPosition;
                        }
                    }
                    else {
                        line(lastX, action.yPixelPosition + yOffset, action.xPixelPosition, action.yPixelPosition + yOffset);
                        lastX = action.xPixelPosition;
                    }
                    if(!found) {
                        found = true;
                        nodeLocations.push( {x: action.xPixelPosition, y: action.yPixelPosition, yOffset: yOffset, colour: {r: colour.r, g: colour.g, b: colour.b}, name: action.name} );
                    }
                    else {
                        nodeLocations.push( {x: action.xPixelPosition, y: action.yPixelPosition, yOffset: yOffset, colour: {r: colour.r, g: colour.g, b: colour.b}, name: ""} );
                    }
                }
            }
        }
        else {
            if(drawResourceFlowLine(action, resource, yOffset, colour, action.startX, action.endX, action.y)) {
                if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
                    line(lastX, action.y + yOffset, action.startX, action.y + yOffset);
                    line(action.endX, action.y + yOffset, xEnd, action.y + yOffset);
                    match = true;
                }
                else {
                    line(lastX, action.y + yOffset, action.startX, action.y + yOffset);
                    lastX = action.endX;
                }
            }
        }
    }

    if(!prog.control) {
        line(lastX, y + yOffset, xEnd, y + yOffset);
    }
    else if(match && prog.control != FlowControlEnum.branch && prog.control != FlowControlEnum.selection) {
        line(lastX, y + yOffset, xEnd, y + yOffset);
    }

    return match;
}

function drawResourceFlowLines(start, end, resources) {
    if(!resources) return;
    // var lanesPerLevel = numberOfFlowLinesPerLevel(agentFlowLines);
	// var numberOfFlowLines = lanesPerLevel[0].count;
    nodeLocations = [];
	var gap = 10;

    for(var i = 0; i < resources.length; i++) {
        var yOffset = i % 2 == 0 ? (i / 2) * gap : ((i + 1) / 2) * -gap;
        var colour = resources[i].colour;
        stroke(colour.r, colour.g, colour.b);
        strokeWeight(2);
        drawResourceFlowLine(program, resources[i].name, yOffset, colour, start.x, endX, middle);
    }

    var c = {r: 0, g: 0, b: 0};
    drawNode(start.x, start.y, 15 + resources.length * gap, c);
    for ( var i = 0; i < nodeLocations.length; i++ ) {
        var node = nodeLocations[i];
        textAlign(CENTER, CENTER);
        stroke(255);
        fill(0);
        var last = true;
        for(var j = i + 1; j < nodeLocations.length; j++) {
            if(nodeLocations[j].x == node.x && nodeLocations[j].y == node.y) {
                last = false;
            }
        }
        if(last) {
            var textY = node.yOffset >= 0 ? node.y + node.yOffset - 15 : node.y + node.yOffset + 15;
            text(node.name, node.x, textY);
        }
        drawNode(node.x, node.y + node.yOffset, 15, node.colour);
    }
    drawNode(end.x, end.y, 10 + resources.length * gap, c);

    // reset drawing variables
    fill(0);
    strokeWeight(1);
    stroke(255);
}


