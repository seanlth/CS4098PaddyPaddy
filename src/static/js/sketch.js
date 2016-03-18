var canvas, startX, endX, middle;// variables for drawing
var program, nodes, names; // variables for storing actions in the program and nodes to add them
var state, selectedAction, selectAdd, controlIndex, currentControlFlow, generatePML; // variables for handling input
var offsetX, offsetY;

var ACTION_HEIGHT = 50;
var ACTION_WIDTH = 120;
var numActions = 0;

var StateEnum = {
    normal: 0,
    form: 1,
    controlFlow: 2
};

var FlowControlEnum = {
    iteration: "iteration",
    branch: "branch",
    selection: "selection",
    sequence: "sequence"
};

function setup() {
    state = StateEnum.normal;
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.id('canvas');
    startX = 40;
    endX = width - 40;
    middle = height / 2;
    offsetX = 0;
    offsetY = 0;
    controlIndex = [];

    program = {name: "new_process", actions: new Array()};
    nodes = new Array();

    selectAdd = createSelect();
    selectAdd.option('Select an option');
    selectAdd.option('Action');
    selectAdd.option('Branch');
    selectAdd.option('Iteration');
    selectAdd.option('Selection');
    selectAdd.changed(selectEvent);
    selectAdd.hide();

    generatePML = createButton('Generate PML');
    generatePML.position(20, 20);
    generatePML.mousePressed(createPML);
    generatePML.id('generatePML');

    // noLoop();
}

function createPML() {
    var pml_code = json_to_pml(program);
	window.open('/');
}

function selectEvent() {
    var selection = selectAdd.value();
    if(selection === 'Action'){
        addAction(selectAdd.index);
    }
    else {
        state = StateEnum.controlFlow;
        controlIndex = selectAdd.index;
        switch (selection) {
            case 'Iteration':
                currentControlFlow = FlowControlEnum.iteration;
                break;

            case 'Branch':
                currentControlFlow = FlowControlEnum.branch;
                break;

            case 'Selection':
                currentControlFlow = FlowControlEnum.selection;
                break;

            default:
        }
    }

    selectAdd.selected('Select an option');
    selectAdd.hide();
    // redraw();
}

function draw() {
    background(255);

    // check program isn't too crowded and resize if needed
    var progWidth = sequenceLength(program);
    var prefferedSize = progWidth * ACTION_WIDTH * 2;
    if(prefferedSize > endX - startX) {
        endX = prefferedSize + startX;
    }
    else if(prefferedSize < endX - startX) {
        endX = prefferedSize + startX;
    }

    if(endX < width - 40) {
        endX = width - 40;
        offsetX = 0;
        resetMatrix();
        translate(0, offsetY);
    }

    keyboardInput();

    fill(0);
    line(startX, middle, endX, middle);
    names = [new Name(program.name, startX, middle - 45, [])];
    ellipse(startX, middle, 30, 30);
    fill(255);
    ellipse(endX, middle, 30, 30);
    fill(0);
    ellipse(endX, middle, 20, 20);

    nodes = [];
    drawActions(program.actions, progWidth, []);
    if(program.actions.length == 0) {
        nodes.push(new Node(width / 2, height / 2, [0]));
    }

    for(var i = 0; i < nodes.length; i++) {
        nodes[i].draw();
    }

    for(var i = 0; i < names.length; i++) {
        names[i].draw();
    }
}

function keyboardInput() {
    var lastValueX = offsetX, lastValueY = offsetY;
    var speed = 5;
    // handle horizontal scrolling if display is wider than screen
    if(endX + startX > width) {
        if(keyIsDown(LEFT_ARROW)) {
            offsetX += speed;
        }
        else if(keyIsDown(RIGHT_ARROW)) {
            offsetX -= speed;
        }

        if(offsetX > 0) {
            offsetX = 0;
        }

        if(offsetX < width - (endX + startX)) {
            offsetX = width - (endX + startX);
        }
    }

    var movementY = 0;
    if(keyIsDown(UP_ARROW)) {
        movementY = speed;
    }
    else if(keyIsDown(DOWN_ARROW)) {
        movementY = -speed;
    }

    var offScreen = false, onScreen = 0;
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].y + offsetY - (ACTION_WIDTH / 2) < 0 || nodes[i].y + offsetY + (ACTION_WIDTH / 2) > height) {
            offScreen = true;
        }

        if(nodes[i].y + offsetY + movementY - (ACTION_WIDTH / 2) > 0 && nodes[i].y + offsetY + movementY + (ACTION_WIDTH / 2) < height) {
            onScreen++;
        }
    }

    if(offScreen && onScreen >= 1) {
        offsetY += movementY
    }

    resetMatrix();
    translate(offsetX, offsetY);
}

function drawActions(actions, programWidth, index) {
    var i;
    for(i = 0; i < actions.length; i++) {
        if(actions[i].constructor == Action) {
            actions[i].draw(index.concat([i]), programWidth);
        }
        else if(actions[i].actions.length == 0) {
            actions.splice(i, 1);
            continue;
        }
        else {
            var prog = program;
            var nextIndex = index.concat([i]);
            var pos = indexToXY(nextIndex);

            for(var j = 0; j < index.length; j++) {
                prog = prog.actions[index[j]];
            }

            // if previous control flow was a branch or selection draw a line
            var lastControl = prog.control;
            if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
                drawLine(prog, pos.x - 1, pos.y, programWidth);
            }
            else {
                // else add leading node
                var yPixels = (pos.y * ACTION_HEIGHT * 2) + middle;
                var nodeX = (endX - startX) * ((pos.x * 2 + 1) / (programWidth * 2 + 2)) + startX;
                nodes.push(new Node(nodeX, yPixels, index.concat([i])));
            }

            // draw elements of this control flow
            prog = prog.actions[i];

            if(prog.control == FlowControlEnum.branch) {
                drawBranchBars(prog, pos.x, pos.y, nextIndex, programWidth);
            }
            if(prog.control == FlowControlEnum.selection) {
                drawSelectionDiamond(prog, pos.x, pos.y, nextIndex, programWidth);
            }
            if(prog.control == FlowControlEnum.iteration) {
                drawIterationLoop(prog, pos.x, pos.y, nextIndex, programWidth);
            }

            drawActions(actions[i].actions, programWidth, nextIndex);

            // add trailing node if there are no more actions
            if(i == actions.length - 1 && prog.control != FlowControlEnum.sequence) {
                pos.x += sequenceLength(prog);
                nodeX = (endX - startX) * ((pos.x * 2 + 1) / (programWidth * 2 + 2)) + startX;
                nodes.push(new Node(nodeX, yPixels, index.concat([i + 1])));
            }
        }
    }
}

function sequenceLength(sequence) {
    var length = 0;

    for(var i = 0; i < sequence.actions.length; i++) {
        var actionLength;
        if(sequence.actions[i].constructor != Action){
            actionLength = sequenceLength(sequence.actions[i]) - 1;

            // the length all flow control structures except branch and selection depend on all actions within
            if(sequence.control != FlowControlEnum.branch && sequence.control != FlowControlEnum.selection) {
                length += actionLength;
            }
            else {// the length of a branch or selection depends only on the longest "chain"
                length = length > actionLength ? length : actionLength;
            }
        }
    }

    if(sequence.control != FlowControlEnum.branch && sequence.control != FlowControlEnum.selection) {
        if(sequence.control == FlowControlEnum.iteration) {
            return length + sequence.actions.length + 2;
        }
        return length + sequence.actions.length;
    }
    // designate space for the branch and sequence visual elements
    return length + 3;
}

function sequenceHeight(sequence, start, incrementor) {
    start = start || 0;
    incrementor = incrementor || 1;
    var height = 0;

    for(var i = 0; i < sequence.actions.length; i += incrementor) {
        if(sequence.actions[i].constructor != Action){
            height += sequenceHeight(sequence.actions[i]) - 1;
        }
    }

    if(sequence.control == FlowControlEnum.branch || sequence.control == FlowControlEnum.selection) {
        return height + sequence.actions.length;
    }

    return height + 1;
}

function indexToXY(index) {
    var prog = program;
    var x = 0;
    var y = 0;
    //add up the length of everything that came before
    for(var i = 0; i < index.length; i++) {
        if(prog.control != FlowControlEnum.branch && prog.control != FlowControlEnum.selection) {
            x += index[i];
            if(prog.control == FlowControlEnum.iteration) {
                x++;//move along to give space for extra node
            }
        }
        else {
            x++; // move x position past control flow visual element
            if(y == 0) {
                y = index[i] % 2 == 0 ? (index[i] / 2) : -((index[i] + 1) / 2);
            }
            else {
                y = y > 0 ? y + index[i] : y - index[i];
            }
        }

        for(var j = 0; j < index[i]; j++) {
            if(prog.actions[j].constructor != Action && (prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection)) {
                if(y < 0) {
                    var temp;
                    temp = lowestY(prog.actions[j]) - 1;
                    if(y > temp) {
                        y = temp;
                    }
                }
                else if(y > 0) {
                    var temp;
                    temp = highestY(prog.actions[j]) + 1;
                    if(y < temp) {
                        y = temp;
                    }
                }
            }
            else if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
                if(y < 0 && y >= prog.actions[j].y) {
                    y = prog.actions[j].y - 1;
                }
                else if(y > 0 && y <= prog.actions[j].y) {
                    y = prog.actions[j].y + 1;
                }
            }

            if(prog.actions[j].constructor != Action && prog.control != FlowControlEnum.branch && prog.control != FlowControlEnum.selection) {
                x += sequenceLength(prog.actions[j]) - 1;
            }
        }

        if(i + 1 < index.length) {
            prog = prog.actions[index[i]];
        }
    }
    return {"x": x, "y": y};
}

function addAction(index) {
    if(index[index.length - 1] < 0) {
        Sequence(index);
        return;
    }

    var actions = program.actions;
    for(var i = 0; i < index.length - 1; i++) {
        actions = actions[index[i]].actions;
    }

    actions.splice(index[index.length-1], 0, new Action());
}

function addNodes() {
    nodes = [];
    if(program.actions.length == 0) {
        nodes.push(new Node([0], 0));
    }
    else{
        var progWidth = sequenceLength(program);
        addNodesRec(program.actions, [], progWidth);
    }
}

function addNodesRec(actions, index, progWidth) {
    for(var i = 0; i < actions.length; i++) {
        nodes.push(new Node(index.concat([i]), progWidth));

        if(actions[i].constructor != Action) {
            addNodesRec(actions[i].actions, index.concat([i]), progWidth);
        }
    }
    nodes.push(new Node(index.concat([actions.length]), progWidth));
}

function highestY(sequence) {
    if(sequence.constructor == Action) return sequence.y;

    var maxY = Number.MIN_VALUE;
    for(var i = 0; i < sequence.actions.length; i++) {
        var y;
        if(sequence.actions[i].constructor == Action) {
            y = sequence.actions[i].y;
        }
        else {
            y = highestY(sequence.actions[i]);
        }

        if(maxY < y) {
            maxY = y;
        }
    }

    return maxY;
}

function lowestY(sequence) {
    if(sequence.constructor == Action) return sequence.y;

    var minY = Number.MAX_VALUE;
    for(var i = 0; i < sequence.actions.length; i++) {
        var y;
        if(sequence.actions[i].constructor == Action) {
            y = sequence.actions[i].y;
        }
        else {
            y = lowestY(sequence.actions[i]);
        }

        if(minY > y) {
            minY = y;
        }
    }

    return minY;
}

function Node(x, y, index) {
    this.index = index;

    this.x = x;
    this.y = y;
    this.radius = 10;
    this.diameter = this.radius * 2;

    this.press = function(x, y) {
        var d = dist(x, y, this.x, this.y);
        if(d < this.radius){
            if(state == StateEnum.normal) {
                // addAction(index);
                selectAdd.position(this.x + offsetX, this.y + offsetY);
                selectAdd.index = this.index;
                selectAdd.show();
            }
            else if(state == StateEnum.controlFlow) {
                if(validControlFlow(this)) {
                    ControlFlow(this.index, controlIndex);
                }
                state = StateEnum.normal;
            }

            return true;
        }

        return false;
    }

    this.draw = function() {
        var validCF = validControlFlow(this);
        if(state != StateEnum.controlFlow) {
            fill(255);
        }
        else if(compareArrays(controlIndex, this.index, this.index.length) && validCF) {
            fill(0, 120, 0);
        }
        else if(validCF) {
            fill(0, 255, 0);
        }
        else {
            fill(255, 0, 0);
        }

        ellipse(this.x, this.y, this.diameter, this.diameter);
        fill(0);
        textAlign(CENTER, CENTER);
        text('+', this.x, this.y);
    }
}

function Name(name, x, y, index) {
    this.index = index;

    this.x = x;
    this.y = y;
    this.name = name;
    this.buttonWidth = 16;

    this.press = function(x, y) {
        if(x > this.x && x < this.x + this.buttonWidth && y > this.y && y < this.y + this.buttonWidth) {
            var prog = program;
            for(var i = 0; i < this.index.length; i++) {
                prog = prog.actions[index[i]];
            }

            var control = prog.control || 'process';
            var newName = prompt('Input the new name for this ' + control, prog.name) || prog.name;
            var variableRegex = new RegExp('^[a-zA-Z_][a-zA-Z_0-9]*$');
            while(!variableRegex.test(newName)) {
                newName = prompt('\"' + newName + '\" is invalid, it must start with\
                    a letter or an underscore and contain only these and numbers.',
                    prog.name) || prog.name;
            }

            prog.name = newName;
            this.name = newName;
        }
    }

    this.draw = function() {
        fill(255);
        rect(this.x, this.y, this.buttonWidth, this.buttonWidth);
        fill(0);
        textAlign(CENTER, CENTER);
        text('...', this.x + this.buttonWidth / 2, this.y + this.buttonWidth / 2);
        textAlign(LEFT, TOP);
        text(this.name, this.x + this.buttonWidth + 3, this.y);
    }
}

function validControlFlow(node) {
    if(controlIndex.length != node.index.length) return false;

    return compareArrays(controlIndex, node.index, controlIndex.length - 1);
}

//compare 2 arrays up to length specified
function compareArrays(array1, array2, length) {
    for(var i = 0; i < length; i++) {
        if(array1[i] != array2[i]) {
            return false;
        }
    }

    return true;
}

function Action() {
    this.id = numActions++;
    this.x;
    this.y;

    // Set up the element
    this.element = createDiv('New_Action');
    this.element.class('Action');
    this.element.mouseClicked(this.openActionEditor);
    this.element.id(this.id + "-action");

    // All the PML important details
    this.name = "New_Action";
    this.type = "";
    this.agent = "";
    this.script = "";
    this.tool = "";
    this.requires = "";
    this.provides = "";
    this.selected = false;

    this.draw = function(index, programWidth) {
        var pos = indexToXY(index);
        this.x = pos.x;
        this.y = pos.y;

        var prog = program;
        for(var i = 0; i < index.length - 1; i++) {
            prog = prog.actions[index[i]];
        }

        // draw the lines connecting "simultaneous" flow actions to the graph
        if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
            drawLine(prog, this.x - 1, this.y, programWidth);
        }

        var yPixels = (this.y * ACTION_HEIGHT * 2) + middle;
        var xPixels = (endX - startX) * ((this.x + 1) / (programWidth + 1)) + startX;

        // if action isn't the first action in a horixaontal control structure, add a node between this and the last action
        if(index[index.length - 1] != 0 && prog.control != FlowControlEnum.branch && prog.control != FlowControlEnum.selection) {
            var nodeX = (endX - startX) * ((this.x * 2 + 1) / (programWidth * 2 + 2)) + startX;
            nodes.push(new Node(nodeX, yPixels, index));
        }

        // if this is in a branch or sequence, add nodes capable of changing it to a sequence
        if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
            var nodeX = (endX - startX) * ((this.x * 2 + 1) / (programWidth * 2 + 2)) + startX;
            nodes.push(new Node(nodeX, yPixels, index.concat([-1]))); //-1 == start sequence with new node

            nodeX = (endX - startX) * ((this.x * 2 + 3) / (programWidth * 2 + 2)) + startX;
            nodes.push(new Node(nodeX, yPixels, index.concat([-2]))); //-2 == end sequence with new node
        } // if this is in an iteration, add nodes to add directly to the control flow structure
        else if(prog.control == FlowControlEnum.iteration) {
            if(index[index.length - 1] == 0) {
                var nodeX = (endX - startX) * ((this.x * 2 + 1) / (programWidth * 2 + 2)) + startX;
                nodes.push(new Node(nodeX, yPixels, index));
            }
            if(index[index.length - 1] == prog.actions.length - 1) {
                var nextIndex = index.slice();
                nextIndex[index.length - 1] = prog.actions.length;
                var nodeX = (endX - startX) * ((this.x * 2 + 3) / (programWidth * 2 + 2)) + startX;
                nodes.push(new Node(nodeX, yPixels, nextIndex));
            }
        }// else this action is in the normal process structure or sequence
        else {
            if(index[index.length - 1] == 0) {
                var nodeX = (endX - startX) * ((this.x * 2 + 1) / (programWidth * 2 + 2)) + startX;

                if(prog.control == FlowControlEnum.sequence) {
                    var sequenceIndex = index.slice();
                    sequenceIndex.pop();
                    names.push(new Name(prog.name, nodeX, yPixels - 15 - ACTION_HEIGHT / 2, sequenceIndex));
                }

                nodes.push(new Node(nodeX, yPixels, index));
            }
            if(index[index.length - 1] == prog.actions.length - 1) {
                var nodeX = (endX - startX) * ((this.x * 2 + 3) / (programWidth * 2 + 2)) + startX;
                var newIndex = index.slice();
                newIndex[newIndex.length - 1]++; // index point to position after the action
                nodes.push(new Node(nodeX, yPixels, newIndex));
            }
        }

        this.element.position(xPixels  - (ACTION_WIDTH / 2) + offsetX, yPixels - (ACTION_HEIGHT / 2) + offsetY);
    }
}

Action.prototype.openActionEditor = function(event) {
    if(state == StateEnum.normal || state == StateEnum.controlFlow) {
        state = StateEnum.form;

        var tag = this.id();
        var array = splitTokens(tag, '-');
        var id = array[0];
        if(!selectAction(program.actions, id)) return;

        $("#actionEditor").show();
        document.getElementById('name').value = selectedAction.name;
        document.getElementById('type').value = selectedAction.type;
        document.getElementById('agent').value = selectedAction.agent;
        document.getElementById('script').value = selectedAction.script;
        document.getElementById('tool').value = selectedAction.tool;
        document.getElementById('requires').value = selectedAction.requires;
        document.getElementById('provides').value = selectedAction.provides;
    }
}

function drawLine(prog, x, y, programWidth) {
    var endLineX = sequenceLength(prog) + x;
    var diagramWidth = endX - startX;
    var startLineXPixels = diagramWidth * ((x + 1) / (programWidth + 1)) + startX;
    var endLineXPixels = diagramWidth * (endLineX / (programWidth + 1)) + startX;

    var yPixels = (y * ACTION_HEIGHT * 2) + middle;
    line(startLineXPixels, yPixels, endLineXPixels, yPixels);

    return {"startX": startLineXPixels, "endX": endLineXPixels, "y": yPixels};
}

function drawIterationLoop(prog, x, y, index, programWidth) {
    var diagramWidth = endX - startX;
    var startXRectPixels = diagramWidth * ((x + 1) / (programWidth + 1)) + startX;
    var endLineX = sequenceLength(prog) + x;
    var endXRectPixels = diagramWidth * (endLineX / (programWidth + 1)) + startX;

    var yPixels = (y * ACTION_HEIGHT * 2) + middle;

    var yTop = lowestY(prog);
    var loopHeight = sequenceHeight(prog);
    var rectHeight = loopHeight * ACTION_HEIGHT * 2;

    rectPositionY = middle + (ACTION_HEIGHT * yTop * 2) - ACTION_HEIGHT;

    startXRectPixels = startXRectPixels;
    endXRectPixels = endXRectPixels;
    fill(255, 255, 255, 0);
    rect(startXRectPixels, rectPositionY, endXRectPixels - startXRectPixels, rectHeight, 20, 20, 20, 20);

    names.push(new Name(prog.name, startXRectPixels + 10, rectPositionY + 20, index.slice()));
}

function getY(sequence) {
    var prog = sequence;
    while(!prog.hasOwnProperty('y')) {
        prog = prog.actions[0];
    }

    return prog.y;
}

function drawBranchBars(prog, x, y, index, programWidth) {
    var lineDetails = drawLine(prog, x, y, programWidth);

    var rectPositionYOne, rectPositionYTwo;

    if(y == 0) {
        var temp;
        temp = indexToXY(index.concat([prog.actions.length - 1]));
        rectPositionYOne = temp.y;

        temp = indexToXY(index.concat([prog.actions.length - 2]));
        rectPositionYTwo = temp.y;
    }
    else {
        var temp;
        temp = indexToXY(index.concat([0]));
        rectPositionYOne = temp.y;

        temp = indexToXY(index.concat([prog.actions.length - 1]));
        rectPositionYTwo = temp.y;
    }

    rectPositionYOne = (rectPositionYOne * ACTION_HEIGHT * 2) + middle;
    rectPositionYTwo = (rectPositionYTwo * ACTION_HEIGHT * 2) + middle;

    var rectHeight = Math.abs(rectPositionYOne - rectPositionYTwo) + ACTION_HEIGHT + 10;
    var rectPositionY;

    if(rectPositionYOne < rectPositionYTwo) {
        rectPositionY = rectPositionYOne;
    }
    else {
        rectPositionY = rectPositionYTwo;
    }

    rectPositionY = rectPositionY - (ACTION_HEIGHT / 2) - 5;

    fill(0)
    rect(lineDetails.startX - 5, rectPositionY, 10, rectHeight);
    rect(lineDetails.endX - 5, rectPositionY, 10, rectHeight);

    var nameY;
    if(rectPositionYOne < rectPositionYTwo) {
        nameY = rectPositionYOne;
    }
    else {
        nameY = rectPositionYTwo;
    }
    names.push(new Name(prog.name, lineDetails.startX - 20, nameY - 50, index.slice()));

    var altIndex = index.slice();
    altIndex.push(prog.actions.length);
    nodes.push(new Node(lineDetails.startX, (y * ACTION_HEIGHT * 2) + middle, altIndex));
}

function drawSelectionDiamond(prog, x, y, index, programWidth) {
    var lineDetails = drawLine(prog, x, y, programWidth);

    var linePositionYStart, linePositionYEnd;

    if(y == 0) {
        var temp;
        temp = indexToXY(index.concat([prog.actions.length - 1]));
        linePositionYStart = temp.y;

        temp = indexToXY(index.concat([prog.actions.length - 2]));
        linePositionYEnd = temp.y;
    }
    else {
        var temp;
        temp = indexToXY(index.concat([0]));
        linePositionYStart = temp.y;

        temp = indexToXY(index.concat([prog.actions.length - 1]));
        linePositionYEnd = temp.y;
    }

    linePositionYStart = (linePositionYStart * ACTION_HEIGHT * 2) + middle;
    linePositionYEnd = (linePositionYEnd * ACTION_HEIGHT * 2) + middle;

    line(lineDetails.startX, linePositionYStart, lineDetails.startX, linePositionYEnd);
    line(lineDetails.endX, linePositionYStart, lineDetails.endX, linePositionYEnd);
    fill(0);
    ellipse(lineDetails.endX, lineDetails.y, 10 , 10);

    translate(lineDetails.startX, lineDetails.y - 21);
    rotate(PI / 4);
    fill(255);
    rect(0, 0, 30, 30);
    resetMatrix();
    translate(offsetX, offsetY);

    var nameY;
    if(linePositionYStart < linePositionYEnd) {
        nameY = linePositionYStart;
    }
    else {
        nameY = linePositionYEnd;
    }
    names.push(new Name(prog.name, lineDetails.startX - 20, nameY - 40, index.slice()));

    var altIndex = index.slice();
    altIndex.push(prog.actions.length);
    nodes.push(new Node(lineDetails.startX, (y * ACTION_HEIGHT * 2) + middle, altIndex));
}

function selectAction(actions, id){
    for(var i = 0; i < actions.length; i++) {
        if(actions[i].constructor == Action) {
            if(actions[i].id == id) {
                selectedAction = actions[i];
                return true;
            }
        }
        else {
            if(selectAction(actions[i].actions, id)) return true;
        }
    }

    return false;
}

function ControlFlow(firstIndex, secondIndex) {
    if(firstIndex[firstIndex.length - 1] < 0 || secondIndex[secondIndex.length - 1] < 0) {
        if(firstIndex[firstIndex.length - 1] == secondIndex[secondIndex.length - 1]) {
            Sequence(firstIndex);
            return;
        }
        else {
            Sequence(firstIndex, true);
            return;
        }
    }
    var start, end, length;
    if(firstIndex.length < secondIndex.length){
        length = firstIndex.length;
    }
    else {
        length = secondIndex.length;
    }

    if(firstIndex[length - 1] < secondIndex[length - 1]) {
        start = firstIndex;
        end = secondIndex;
    }
    else {
        start = secondIndex;
        end = firstIndex;
    }

    var array = program.actions;
    var prog = program;
    for(var i = 0; i < length - 1; i++) {
        array = array[start[i]].actions;
        prog = prog.actions[start[i]];
    }

    //selected same node twice, add iteration with new Action
    if(start[length - 1] == end[length - 1]) {
        var blankControlFlow =  {name: 'New_' + currentControlFlow, control: currentControlFlow, actions: [new Action()]};
        // if the new action is to be in a branch/selection, surre=ound it in a sequence
        if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
            array.splice(start[length - 1], 0,
                {name: "New_Sequence", control: FlowControlEnum.sequence, actions: [blankControlFlow]});
            return;
        }

        array.splice(start[length - 1], 0, blankControlFlow);
        return;
    }

    //adds a control flow to program
    array.splice(start[length - 1], end[length - 1] - start[length - 1],
        {name: "New_" + currentControlFlow, control: currentControlFlow, actions: array.slice(start[length - 1], end[length - 1])});
}

function Sequence(index, replace){
    replace = replace || false;
    var array = program.actions;
    for(var i = 0; i < index.length - 2; i++) {
        array = array[index[i]].actions;
    }

    var newAction;
    if(state == StateEnum.controlFlow) {
        if(replace) {
            newAction = {name: 'New_' + currentControlFlow, control: currentControlFlow, actions: [array[index[index.length - 2]]]};
        }
        else {
            newAction = {name: 'New_' + currentControlFlow, control: currentControlFlow, actions: [new Action()]};
        }
    }
    else {
        newAction = new Action();
    }

    var sequenceArray;
    //start with new node
    if(replace) {
        sequenceArray = [newAction];
    }
    else if(index[index.length - 1] == -1) {
        sequenceArray = [newAction, array[index[index.length - 2]]];
    }//end with old node
    else {
        sequenceArray = [array[index[index.length - 2]], newAction];
    }

    //adds a sequence to program.actions
    array.splice(index[index.length - 2], 1,
        {name: 'New_Sequence', control: FlowControlEnum.sequence, actions: sequenceArray});
}

function mousePressed(event) {
    if (state == StateEnum.form) return;

    var x = event.clientX - offsetX;
    var y = event.clientY - offsetY;
    var pressed = false;

    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].press(x, y)){
            // redraw();
            pressed = true;
            break;
        }
    }

    for(var i = 0; i < names.length; i++) {
        if(names[i].press(x, y)){
            // redraw();
            pressed = true;
            break;
        }
    }

    if(!pressed && event.movementX == 0 && event.movementY == 0) {
        if(event.srcElement) {
            if(event.srcElement.id == 'canvas') {
                state = StateEnum.normal;
                selectAdd.hide();
            }
        }
        else if(event.target){
            if(event.target.id == 'canvas') {
                state = StateEnum.normal;
                selectAdd.hide();
            }
        }
    }
    // redraw();
}

function mouseDragged(event) {
    if(event.srcElement) {
        if(event.srcElement.id != 'canvas') {
            return;
        }
    }
    else if(event.target){
        if(event.target.id != 'canvas') {
            return;
        }
    }

    var lastValueX = offsetX, lastValueY = offsetY;
    // handle horizontal scrolling if display is wider than screen
    if(endX + startX > width) {
        offsetX += event.movementX;

        if(offsetX > 0) {
            offsetX = 0;
        }

        if(offsetX < width - (endX + startX)) {
            offsetX = width - (endX + startX);
        }
    }

    var offScreen = false, onScreen = 0;
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].y + offsetY - (ACTION_WIDTH / 2) < 0 || nodes[i].y + offsetY + (ACTION_WIDTH / 2) > height) {
            offScreen = true;
        }

        if(nodes[i].y + offsetY + event.movementY - (ACTION_WIDTH / 2) > 0 && nodes[i].y + offsetY + event.movementY + (ACTION_WIDTH / 2) < height) {
            onScreen++;
        }
    }

    if(offScreen && onScreen >= 1) {
        offsetY += event.movementY;
    }

    // only redraw with change
    if(lastValueX != offsetX || lastValueY != offsetY) {
        resetMatrix();
        translate(offsetX, offsetY);
        // redraw();
    }
}

function editAction() {
    var variableRegex = new RegExp('^[a-zA-Z_][a-zA-Z_0-9]*$')
    var name = document.getElementById('name').value;
    if (!variableRegex.test(name)) {
        alert(  "The name " + name + " of the Action is invalid, "
              + "Action names must start with an underscore or letter and contain"
              + " only letters, numbers and underscrores.");
        return
    }

    var specRegex = new RegExp("^[a-zA-Z_][a-zA-Z_0-9]*|\"[^\"]*\"$")
    var predicateRegex = new RegExp('^([a-zA-Z_.]+ *(\|\||\&\&)? *)*[a-zA-Z_.]+$');

    var agent = document.getElementById('agent').value;
    if ( !specRegex.test(agent) && agent.length != 0) {
        alert(  "The agent " + agent + " of the Action is invalid, "
              + "agents must be be strings or start with an underscore or letter and contain "
              + "only letters, numbers and underscrores.");
        return
    }

    var tool = document.getElementById('tool').value;

    var requires = document.getElementById('requires').value
    if(!predicateRegex.test(requires) && requires.length != 0) {
        alert(  "The requirement \"" + requires + "\" of the Action is invalid, "
              + "requirements must start with an underscore or letter and contain "
              + "only letters, numbers and underscrores.");
        return
    }

    var provides = document.getElementById('provides').value;
    if(!predicateRegex.test(provides) && provides.length != 0) {
        alert(  "The provision \"" + provides + "\" of the Action is invalid, "
              + "provisions must start with an underscore or  letter and contain "
              + "only letters, numbers and underscrores.");
        return
    }

    selectedAction.name = name;
    selectedAction.type = document.getElementById('type').value;
    selectedAction.agent = agent;
    selectedAction.script = document.getElementById('script').value;
    selectedAction.tool = tool;
    selectedAction.requires = requires;
    selectedAction.provides = provides;
    selectedAction.selected = false;

    selectedAction.element.html(selectedAction.name);

    $("#actionEditor").hide();
    state = StateEnum.normal;
    // redraw();
}


// deletes an action with matching id from program prog
function deleteAction(prog, id) {
    for(var i = 0; i < prog.actions.length; i++) {
        if(prog.actions[i].constructor == Action) {
            if(prog.actions[i].id == id) {
                prog.actions[i].element.remove()
                prog.actions.splice(i, 1);
                return true;
            }
        }
        else {
            if(deleteAction(prog.actions[i], id)) return true;
        }
    }
    return false;
}


function removeAction() {
    if(!confirm("Are you sure you wish to delete this action?")) return;

    deleteAction(program, selectedAction.id);

    $("#actionEditor").hide();
    state = StateEnum.normal;
    // redraw();
}
