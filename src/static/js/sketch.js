var canvas, startX, endX, middle;// variables for drawing
var program, nodes; // variables for storing actions in the program and nodes to add them
var state, selectedAction, selectAdd, controlIndex, currentControlFlow; // variables for handling input
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
    endX = windowWidth - 40;
    middle = windowHeight / 2;
    offsetX = 0;
    offsetY = 0;

    program = {name: "new_process", actions: new Array()};
    nodes = new Array();
    // addNodes();

    selectAdd = createSelect();
    selectAdd.option('Select an option');
    selectAdd.option('Action');
    selectAdd.option('Branch');
    selectAdd.option('Iteration');
    selectAdd.option('Selection');
    selectAdd.changed(selectEvent);

    textAlign(CENTER, CENTER);

    noLoop();
}

function selectEvent() {
    var selection = selectAdd.value();
    if(selection === 'Action'){
        addAction(selectAdd.index);
        // addNodes();
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
    redraw();
}

function draw() {
    background(255);

    fill(0);
    line(startX, middle, endX, middle);
    ellipse(startX, middle, 30, 30);
    fill(255);
    ellipse(endX, middle, 30, 30);
    fill(0);
    ellipse(endX, middle, 20, 20);

    var progWidth = sequenceLength(program);
    nodes = [];
    if(program.actions.length == 0) {
        nodes.push(new Node(width / 2, height / 2, [0]));
    }
    else {
        // check program isn't too crowded and resize if needed
        var prefferedSize = progWidth * ACTION_WIDTH * 2;
        if(prefferedSize > endX - startX) {
            endX = prefferedSize + startX;
        }

        drawActions(program.actions, progWidth, []);
    }

    for(var i = 0; i < nodes.length; i++) {
        nodes[i].draw(progWidth);
    }
}

function drawActions(actions, programWidth, index) {
    var i;
    for(i = 0; i < actions.length; i++) {
        if(actions[i].constructor == Action) {
            actions[i].draw(index.concat([i]), programWidth);
        }
        else {
            var prog = program;
            var nextIndex = index.concat([i]);
            var x, y;
            [x, y] = indexToXY(nextIndex);

            for(var j = 0; j < index.length; j++) {
                prog = prog.actions[index[j]];
            }

            // if previous control flow was a branch or selection draw a line
            var lastControl = prog.control;
            if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
                drawLine(prog, x - 1, y, programWidth);
            }
            else {
                // else add leading node
                var yPixels = (y * ACTION_HEIGHT * 2) + middle;
                var nodeX = (endX - startX) * ((x * 2 + 1) / (programWidth * 2 + 2)) + startX;
                nodes.push(new Node(nodeX, yPixels, index.concat([i])));
            }

            // draw elements of this control flow
            prog = prog.actions[i];

            if(prog.control == FlowControlEnum.branch) {
                drawBranchBars(prog, x, y, nextIndex, programWidth);
            }
            if(prog.control == FlowControlEnum.selection) {
                drawSelectionDiamond(prog, x, y, nextIndex, programWidth);
            }
            if(prog.control == FlowControlEnum.iteration) {
                drawIterationLoop(prog, x, y, nextIndex, programWidth);
            }

            drawActions(actions[i].actions, programWidth, nextIndex);

            // add trailing node if there are no more actions
            if(i == actions.length - 1 && prog.control != FlowControlEnum.sequence) {
                x += sequenceLength(prog);
                nodeX = (endX - startX) * ((x * 2 + 1) / (programWidth * 2 + 2)) + startX;
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
        return length + sequence.actions.length;
    }
    // designate space for the branch and sequence visual elements
    return length + 3;
}

function sequenceHeight(sequence) {
    var height = 0;

    for(var i = 0; i < sequence.actions.length; i++) {
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
                if(index[0] == 0) {
                    if(y < 0 && j % 2 == 1) {
                        y = y - sequenceHeight(prog.actions[j]) + 1;
                    }
                    else if(y > 0 && j % 2 == 0) {
                        y = y + sequenceHeight(prog.actions[j]) - 1;
                    }
                }
                else if(y > 0) {
                    y = y + sequenceHeight(prog.actions[j]) + 1;
                }
                else {
                    y = y - sequenceHeight(prog.actions[j]) - 1;
                }
            }
            else if(prog.actions[j].constructor != Action) {
                x += sequenceLength(prog.actions[j]) - 1;
            }
        }

        if(i + 1 < index.length) {
            prog = prog.actions[index[i]];
        }
    }
    return [x, y];
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
                state = StateEnum.normal;
                if(validControlFlow(this)) {
                    ControlFlow(this.index, controlIndex);
                }
            }

            return true;
        }

        return false;
    }

    this.draw = function(progWidth) {
        if(state != StateEnum.controlFlow) {
            fill(255);
        }
        else if(compareArrays(controlIndex, this.index, this.index.length)) {
            fill(0, 120, 0);
        }
        else if(validControlFlow(this)) {
            fill(0, 255, 0);
        }
        else {
            fill(255, 0, 0);
        }

        ellipse(this.x, this.y, this.diameter, this.diameter);
        fill(0);
        text('+', this.x, this.y);
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
        var x, y;
        [x, y] = indexToXY(index);

        var prog = program;
        for(var i = 0; i < index.length - 1; i++) {
            prog = prog.actions[index[i]];
        }

        // draw the lines connecting "simultaneous" flow actions to the graph
        if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
            drawLine(prog, x - 1, y, programWidth);
        }

        var yPixels = (y * ACTION_HEIGHT * 2) + middle;
        var xPixels = (endX - startX) * ((x + 1) / (programWidth + 1)) + startX;

        // if action isn't the first action in a horixaontal control structure, add a node between this and the last action
        if(index[index.length - 1] != 0 && prog.control != FlowControlEnum.branch && prog.control != FlowControlEnum.selection) {
            var nodeX = (endX - startX) * ((x * 2 + 1) / (programWidth * 2 + 2)) + startX;
            nodes.push(new Node(nodeX, yPixels, index));
        }

        // if this is in a branch or sequence, add nodes capable of changing it to a sequence
        if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
            var nodeX = (endX - startX) * ((x * 2 + 1) / (programWidth * 2 + 2)) + startX;
            nodes.push(new Node(nodeX, yPixels, index.concat([-1]))); //-1 == start sequence with new node

            nodeX = (endX - startX) * ((x * 2 + 3) / (programWidth * 2 + 2)) + startX;
            nodes.push(new Node(nodeX, yPixels, index.concat([-2]))); //-2 == end sequence with new node
        } // if this is in an iteration, add nodes to add directly to the control flow structure
        else if(prog.control == FlowControlEnum.iteration) {
            if(index[index.length - 1] == 0) {
                nodes.push(new Node(xPixels - 20 - ACTION_WIDTH / 2, yPixels, index));
            }
            if(index[index.length - 1] == prog.actions.length - 1) {
                var nextIndex = index.slice();
                nextIndex[index.length - 1] = prog.actions.length;
                nodes.push(new Node(xPixels + 20 + ACTION_WIDTH / 2, yPixels, nextIndex));
            }
        }// else this action is in the normal process structure or sequence
        else {
            if(index[index.length - 1] == 0) {
                var nodeX = (endX - startX) * ((x * 2 + 1) / (programWidth * 2 + 2)) + startX;
                nodes.push(new Node(nodeX, yPixels, index));
            }
            if(index[index.length - 1] == prog.actions.length - 1) {
                var nodeX = (endX - startX) * ((x * 2 + 3) / (programWidth * 2 + 2)) + startX;
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
    var startXLinePixels = diagramWidth * ((x + 1) / (programWidth + 1)) + startX;
    var endLineXPixels = diagramWidth * (endLineX / (programWidth + 1)) + startX;

    var yPixels = (y * ACTION_HEIGHT * 2) + middle;
    line(startXLinePixels, yPixels, endLineXPixels, yPixels);

    return [endLineX, startXLinePixels, endLineXPixels, yPixels];
}

function drawIterationLoop(prog, x, y, index, programWidth) {
    var diagramWidth = endX - startX;
    var startXRectPixels = diagramWidth * ((x + 1) / (programWidth + 1)) + startX;
    var endLineX = sequenceLength(prog) + x;
    var endXRectPixels = diagramWidth * (endLineX / (programWidth + 1)) + startX;

    var yPixels = (y * ACTION_HEIGHT * 2) + middle;

    var seqHeight = sequenceHeight(prog);
    var rectHeight = seqHeight * ACTION_HEIGHT * 2 + 10;
    var rectPositionY;

    if(y == 0) {
        seqHeight = seqHeight / 2 % 1 == 0 ? seqHeight + 1 : seqHeight;
        rectPositionY = middle - (ACTION_HEIGHT * (seqHeight / 2) * 2) - 5;
    }
    else if(y > 0){
        rectPositionY = middle - (ACTION_HEIGHT / 2 + seqHeight * 2) - 5;
    }
    else {
        rectPositionY = middle - (y * ACTION_HEIGHT * 2) - 5;
    }

    startXRectPixels = startXRectPixels - (ACTION_WIDTH / 2) - 20;
    endXRectPixels = endXRectPixels + (ACTION_WIDTH / 2) + 20;
    fill(255, 255, 255, 0);
    rect(startXRectPixels, rectPositionY, endXRectPixels - startXRectPixels, rectHeight, 20, 20, 20, 20);
}

function drawBranchBars(prog, x, y, index, programWidth) {
    var endRectX, startXRectPixels, endRectXPixels, yPixels;
    [endRectX, startXRectPixels, endRectXPixels, yPixels] = drawLine(prog, x, y, programWidth);

    // var yPixels = (y * ACTION_HEIGHT * 2) + middle;
    var rectPositionYOne, rectPositionYTwo;

    if(y == 0) {
        var temp;
        [temp, rectPositionYOne] = indexToXY(index.concat([prog.actions.length - 1]));

        [temp, rectPositionYTwo] = indexToXY(index.concat([prog.actions.length - 2]));
    }
    else {
        var temp;
        [temp, rectPositionYOne] = indexToXY(index.concat([0]));

        [temp, rectPositionYTwo] = indexToXY(index.concat([prog.actions.length - 1]));
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
    rect(startXRectPixels - 5, rectPositionY, 10, rectHeight);
    rect(endRectXPixels - 5, rectPositionY, 10, rectHeight);

    var altIndex = index.slice();
    altIndex.push(prog.actions.length);
    nodes.push(new Node(startXRectPixels, (y * ACTION_HEIGHT * 2) + middle, altIndex));
}

function drawSelectionDiamond(prog, x, y, index, programWidth) {
    var endLineX, startXLinePixels, endLineXPixels, yPixels;
    [endLineX, startXLinePixels, endLineXPixels, yPixels] = drawLine(prog, x, y, programWidth);

    var linePositionYStart, linePositionYEnd;

    if(y == 0) {
        var temp;
        [temp, linePositionYStart] = indexToXY(index.concat([prog.actions.length - 1]));

        [temp, linePositionYEnd] = indexToXY(index.concat([prog.actions.length - 2]));
    }
    else {
        var temp;
        [temp, linePositionYStart] = indexToXY(index.concat([0]));

        [temp, linePositionYEnd] = indexToXY(index.concat([prog.actions.length - 1]));
    }

    linePositionYStart = (linePositionYStart * ACTION_HEIGHT * 2) + middle;
    linePositionYEnd = (linePositionYEnd * ACTION_HEIGHT * 2) + middle;

    line(startXLinePixels, linePositionYStart, startXLinePixels, linePositionYEnd);
    line(endLineXPixels, linePositionYStart, endLineXPixels, linePositionYEnd);

    translate(startXLinePixels, yPixels - 21);
    rotate(PI / 4);
    fill(255);
    rect(0, 0, 30, 30);
    resetMatrix();
    translate(offsetX, offsetY);

    var altIndex = index.slice();
    altIndex.push(prog.actions.length);
    nodes.push(new Node(startXLinePixels, (y * ACTION_HEIGHT * 2) + middle, altIndex));
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

function ControlFlow(firstIndex, secondIndex){
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
    for(var i = 0; i < length - 1; i++) {
        array = array[start[i]].actions;
    }

    //selected same node twice, add iteration with new Action
    if(start[length - 1] == end[length - 1]) {
        array.splice(start[length - 1], 0, {name: "New_" + currentControlFlow, control: currentControlFlow, actions: [new Action()]});
        return;
    }

    //adds an iteration to program.actions
    array.splice(start[length - 1], end[length - 1] - start[length - 1],
        {name: "New_" + currentControlFlow, control: currentControlFlow, actions: array.slice(start[length - 1], end[length - 1])});

    // addNodes();
}

function Sequence(index){
    var array = program.actions;
    for(var i = 0; i < index.length - 2; i++) {
        array = array[index[i]].actions;
    }

    var newAction = new Action();
    if(state == StateEnum.controlFlow) {
        newAction = {name: "New_" + currentControlFlow, control: currentControlFlow, actions: newAction};
    }

    var sequenceArray;
    //start with new node
    if(index[index.length - 1] == -2) {
        sequenceArray = [newAction, array[index[index.length - 2]]];
    }//end with old node
    else {
        sequenceArray = [array[index[index.length - 2]], newAction];
    }
    //adds an sequence to program.actions
    array.splice(index[index.length - 2], 1,
        {name: "New_Sequence", control: FlowControlEnum.sequence, actions: sequenceArray});
}

function mousePressed(event) {
    if (state == StateEnum.form) return;
    redraw();

    var x = event.clientX - offsetX;
    var y = event.clientY - offsetY;
    var pressed = false;

    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].press(x, y)){
            redraw();
            pressed = true;
            break;
        }
    }
	var pml_code = json_to_pml(program);
	console.log(pml_code);

    if(!pressed && event.srcElement.id == 'canvas') {
        state = StateEnum.normal;
        selectAdd.hide();
    }
}

function mouseDragged(event) {
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

    // only redraw with change
    if(lastValueX != offsetX || lastValueY != offsetY) {
        resetMatrix();
        translate(offsetX, offsetY);
        redraw();
    }
}

$(document).ready(function () {
    toggleFields();
    $("#flow").change(function () {
        toggleFields();
    });

});

function editAction() {
    var variableRegex = new RegExp('^[a-zA-Z_][a-zA-Z_0-9]*')
    var name = document.getElementById('name').value;
    if(!variableRegex.test(name)) {
        alert(  "The name " + name + " of the Action is invalid, "
              + "Action names must start with an underscore or  letter and contain"
              + " only letters, numbers and underscrores.");
        return
    }

    var agent = document.getElementById('agent').value;
    if(!variableRegex.test(agent) && agent.length != 0) {
        alert(  "The agent " + agent + " of the Action is invalid, "
              + "agents must start with an underscore or  letter and contain "
              + "only letters, numbers and underscrores.");
        return
    }

    var requires = document.getElementById('requires').value
    if(!variableRegex.test(requires) && requires.length != 0) {
        alert(  "The requirement " + requires + " of the Action is invalid, "
              + "requirements must start with an underscore or letter and contain "
              + "only letters, numbers and underscrores.");
        return
    }

    var provides = document.getElementById('provides').value;
    if(!variableRegex.test(provides) && provides.length != 0) {
        alert(  "The provision " + provides + " of the Action is invalid, "
              + "provisions must start with an underscore or  letter and contain "
              + "only letters, numbers and underscrores.");
        return
    }

    selectedAction.name = name;
    selectedAction.type = document.getElementById('type').value;
    selectedAction.agent = agent;
    selectedAction.script = document.getElementById('script').value;
    selectedAction.tool = document.getElementById('tool').value;
    selectedAction.requires = requires;
    selectedAction.provides = provides;
    selectedAction.selected = false;

    selectedAction.element.html(selectedAction.name);

    $("#actionEditor").hide();
    state = StateEnum.normal;
    redraw();
}

function toggleFields() {
    if($("#flow").val() == "action") {
        $("#actionFields").show();
        $("#otherFields").hide();
    }
    else {
        $("#actionFields").hide();
        $("#otherFields").show();
    }
}
