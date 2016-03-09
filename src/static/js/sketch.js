var canvas, startX, endX, middle, program, nodes, state, selectedAction, selectAdd, iterationIndex;

var ACTION_HEIGHT = 50;
var ACTION_WIDTH = 120;
var numActions = 0;

var StateEnum = {
    normal: 0,
    form: 1,
    iteration: 2
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
    else if(selection === 'Iteration') {
        state = StateEnum.iteration;
        iterationIndex = selectAdd.index;
    }
    else if(selection === 'Branch') {
        Branch(selectAdd.index);
    }
    else if(selection === 'Selection') {
        Selection(selectAdd.index);
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
            var nextIndex = index.concat([i]);
            var x, y;
            [x, y] = indexToXY(nextIndex);

            var prog = program;
            for(var j = 0; j < nextIndex.length; j++) {
                prog = prog.actions[nextIndex[j]];
            }

            if(prog.control == FlowControlEnum.branch) {
                drawBranchBars(prog, x, y, nextIndex, programWidth);
            }
            if(prog.control == FlowControlEnum.selection) {
                drawSelectionDiamond(prog, x, y, nextIndex, programWidth);
            }

            drawActions(actions[i].actions, programWidth, nextIndex);
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

    return height;
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
            x++;
            if(y == 0) {
                y = index[i] % 2 == 0 ? (index[i] / 2) : -((index[i] + 1) / 2);
            }
            else {
                y = y > 0 ? y + index[i] : y - index[i];
            }
        }

        for(var j = 0; j < index[i]; j++) {
            if(prog.actions[j].constructor != Action) {
                if(prog.actions[j].control != FlowControlEnum.branch && prog.actions[j].control != FlowControlEnum.selection) {
                    x += sequenceLength(prog.actions[j]) - 1;
                }
                else {
                    y += sequenceHeight(prog.actions[j]) - 1;
                }
            }
        }

        if(i + 1 < index.length) {
            prog = prog.actions[index[i]];
        }
    }
    return [x, y];
}

function addAction(index) {
    if(index[index.length - 1] == -1) {
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
                selectAdd.position(this.x, this.y);
                selectAdd.index = this.index;
                selectAdd.show();
            }
            else if(state == StateEnum.iteration) {
                state = StateEnum.normal;
                if(validIteration(this)) {
                    Iterate(this.index, iterationIndex);
                }
            }

            return true;
        }

        return false;
    }

    this.draw = function(progWidth) {
        if(state != StateEnum.iteration) {
            fill(255);
        }
        else if(!validIteration(this)) {
            fill(255, 0, 0);
        }
        else if(iterationIndex == this.index) {
            fill(120, 120, 120);
        }
        else {
            fill(0, 255, 0);
        }

        ellipse(this.x, this.y, this.diameter, this.diameter);
        fill(0);
        text('+', this.x, this.y);
    }
}

function validIteration(node) {
    if(iterationIndex.length != node.index.length) return false;
    if (iterationIndex[iterationIndex.length - 1] == node.index[node.index.length - 1]) return false;

    for(var i = 0; i < iterationIndex.length - 1; i++) {
        if(iterationIndex[i] == node.index[i]) {
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

        if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
            drawLine(prog, x - 1, y, programWidth);
        }

        var yPixels = (y * ACTION_HEIGHT * 2) + middle;
        var xPixels = (endX - startX) * ((x + 1) / (programWidth + 1)) + startX;

        if(index[index.length - 1] != 0 && prog.control != FlowControlEnum.branch && prog.control != FlowControlEnum.selection) {
            var nodeX = (endX - startX) * ((x * 2 + 1) / (programWidth * 2 + 2)) + startX;
            nodes.push(new Node(nodeX, yPixels, index));
        }

        if(prog.control == FlowControlEnum.branch || prog.control == FlowControlEnum.selection) {
            nodes.push(new Node(xPixels + ACTION_WIDTH / 2 + 40, yPixels, index.concat([-1])));
        }
        else if(prog.control == FlowControlEnum.iteration || prog.control == FlowControlEnum.sequence) {
            if(index[index.length - 1] == 0) {
                nodes.push(new Node(xPixels - 20, yPixels, index));
            }
            if(index[index.length - 1] == prog.actions.length - 1) {
                nodes.push(new Node(nodeX + ACTION_WIDTH + 20, yPixels, index));
            }
        }
        else if(index[index.length - 1] == 0) {
            var nodeX = (endX - startX) * ((x * 2 + 1) / (programWidth * 2 + 2)) + startX;
            nodes.push(new Node(nodeX - 20, yPixels, index));
        }

        this.element.position(xPixels  - ACTION_WIDTH / 2, yPixels - ACTION_HEIGHT / 2);
    }
}

Action.prototype.openActionEditor = function(event) {
    if(state == StateEnum.normal || state == StateEnum.iteration) {
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
    var endLineX = sequenceLength(prog) - 1 + x;
    var diagramWidth = endX - startX;
    var startXLinePixels = diagramWidth * ((x + 1) / (programWidth + 1)) + startX;
    var endLineXPixels = diagramWidth * ((endLineX + 1) / (programWidth + 1)) + startX;

    var yPixels = (y * ACTION_HEIGHT * 2) + middle;
    line(startXLinePixels, yPixels, endLineXPixels, yPixels);

    return [endLineX, startXLinePixels, endLineXPixels, yPixels];
}

function drawBranchBars(prog, x, y, index, programWidth) {
    var endRectX, startXRectPixels, endRectXPixels;
    [endRectX, startXRectPixels, endRectXPixels] = drawLine(prog, x, y, programWidth);

    var yPixels = (y * ACTION_HEIGHT * 2) + middle;
    line(startXRectPixels, yPixels, endRectXPixels, yPixels);

    var seqHeight = sequenceHeight(prog);
    var rectHeight = seqHeight * ACTION_HEIGHT * 2 + 6;
    var rectPositionY;

    if(y == 0) {
        seqHeight = seqHeight / 2 % 1 == 0 ? seqHeight + 1 : seqHeight;
        rectPositionY = middle - (ACTION_HEIGHT * (seqHeight / 2) * 2);
    }
    else if(y > 0){
        rectPositionY = middle - (ACTION_HEIGHT / 2 + seqHeight * 2);
    }
    else {
        rectPositionY = middle - (y * ACTION_HEIGHT * 2);
    }

    rect(startXRectPixels - 5, rectPositionY, 10, rectHeight);
    rect(endRectXPixels - 5, rectPositionY, 10, rectHeight);

    var altIndex = index.slice();
    altIndex.push(prog.actions.length);
    nodes.push(new Node(startXRectPixels, (y * ACTION_HEIGHT * 2) + middle, altIndex));
}

function drawSelectionDiamond(prog, x, y, index, programWidth) {
    var endLineX, startXLinePixels, endLineXPixels, yPixels;
    [endLineX, startXLinePixels, endLineXPixels, yPixels] = drawLine(prog, x, y, programWidth);

    var seqHeight = sequenceHeight(prog);
    var lineHeight = (seqHeight - 1) * ACTION_HEIGHT * 2;
    var linePositionY;

    if(y == 0) {
        seqHeight = seqHeight / 2 % 1 == 0 ? seqHeight : seqHeight - 1;
        linePositionY = middle - (ACTION_HEIGHT * seqHeight);
    }
    else if(y > 0){
        linePositionY = middle - (ACTION_HEIGHT * y * seqHeight);
    }
    else {
        linePositionY = middle - (ACTION_HEIGHT * y * seqHeight);
    }

    line(startXLinePixels, linePositionY, startXLinePixels, linePositionY + lineHeight);
    line(endLineXPixels, linePositionY, endLineXPixels, linePositionY + lineHeight);

    translate(startXLinePixels, yPixels - 21);
    rotate(PI / 4);
    fill(255);
    rect(0, 0, 30, 30);
    resetMatrix();

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

function Iterate(firstIndex, secondIndex){
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

    //adds an iteration to program.actions
    array.splice(start[length - 1], end[length - 1] - start[length - 1],
        {name: "New_Iteration", control: FlowControlEnum.iteration, actions: array.slice(start[length - 1], end[length - 1])});

    // addNodes();
}

function Sequence(index){
    var array = program.actions;
    for(var i = 0; i < index.length - 2; i++) {
        array = array[index[i]].actions;
    }

    var sequenceArray = [array[index[index.length - 2]], new Action()];
    //adds an sequence to program.actions
    array.splice(index[index.length - 2], 1,
        {name: "New_Sequence", control: FlowControlEnum.sequence, actions: sequenceArray});

    // addNodes();
}

function Branch(index){
    var array = program.actions;
    for(var i = 0; i < index.length - 1; i++) {
        array = array[index[i]].actions;
    }
    //adds an branch to program.actions
    array.splice(index[index.length - 1], 0,
        {name: "New_Branch", control: FlowControlEnum.branch, actions: [new Action()]});

    // addNodes();
}

function Selection(index){
    var array = program.actions;
    for(var i = 0; i < index.length - 1; i++) {
        array = array[index[i]].actions;
    }
    //adds an branch to program.actions
    array.splice(index[index.length - 1], 0,
        {name: "New_Seletion", control: FlowControlEnum.selection, actions: [new Action()]});

    // addNodes();
}

function mousePressed(event) {
    if (state == StateEnum.form) return;
    redraw();

    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].press(event.clientX, event.clientY)){
            redraw();
            break;
        }
    }
}

$(document).ready(function () {
    toggleFields();
    $("#flow").change(function () {
        toggleFields();
    });

});

function editAction() {
    selectedAction.name = document.getElementById('name').value;
    selectedAction.type = document.getElementById('type').value;
    selectedAction.agent = document.getElementById('agent').value;
    selectedAction.script = document.getElementById('script').value;
    selectedAction.tool = document.getElementById('tool').value;
    selectedAction.requires = document.getElementById('requires').value;
    selectedAction.provides = document.getElementById('provides').value;
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
