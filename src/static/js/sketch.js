var canvas, startX, endX, middle;// variables for drawing
var state, selectedAction, selectedIndex, currentControlFlow, generatePML; // variables for handling input
var offsetX, offsetY, scaleX, scaleY, actionHeight, actionWidth;
var clipBoard;

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
    canvas = createCanvas(windowWidth, windowHeight - 50);
    canvas.mousePressed(mousePressedCanvas);
    canvas.mouseMoved(mouseMovedCanvas);
    canvas.id('canvas');

    startX = 40;
    endX = width - 40;
    middle = height / 2;
    offsetX = 0;
    offsetY = 0;
    scaleX = 1;
    scaleY = 1;
    actionHeight = ACTION_HEIGHT;
    actionWidth = ACTION_WIDTH;
    selectedIndex = [];
    clipBoard = [];

    program = {name: "new_process", actions: new Array()};
    nodes = new Array();

    update();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  middle = height / 2;
  update();
}

function createPML() {
    var pml_code = json_to_pml_redirect(program);
}

function drawJSON(json) {
    numActions = 0;
    $('.Action').remove();

    function addActions(acts){
      if (acts){
        for (var i = 0; i < acts.length; i++){
          if (acts[i].control == "action"){
            acts[i] = new Action(acts[i]);
            // acts[i].element.html(acts[i].name);
          } else {
            addActions(acts[i].actions);
          }

        }
      }
    }

    addActions(json.actions);
    program = json;
    update();
}

function draw() {
    background(255);
    var lastScaleX = scaleX;
    var lastScaleY = scaleY;
    keyboardInput();
    actionHeight = ACTION_HEIGHT * scaleY;
    actionWidth = ACTION_WIDTH * scaleX;

    resizeScreen();

    if(scaleX != lastScaleX || scaleY != lastScaleY) {
        update();
    }

    fill(0);
    line(startX, middle, endX, middle);
    ellipse(startX, middle, 30, 30);
    fill(255);
    ellipse(endX, middle, 30, 30);
    fill(0);
    ellipse(endX, middle, 20, 20);

    var progWidth = sequenceLength(program);

    drawActions(program, progWidth, []);

    for(var i = 0; i < names.length; i++) {
        names[i].draw();
    }

    for(var i = 0; i < nodes.length; i++) {
        nodes[i].draw();
    }
}

function update() {
    background(255);
    var progWidth = sequenceLength(program);

    resizeScreen();

    names = [new Name(program.name, startX, middle - 45, [])];
    nodes = [];
    updateActions(program, progWidth, []);
    if(program.actions.length == 0) {
        nodes.push(new Node(width / 2, height / 2, [0]));
    }
}

// check program isn't too crowded and resize if needed
function resizeScreen() {
    var progWidth = sequenceLength(program);
    var prefferedSize = progWidth * actionWidth * 1.4;

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
}

function keyboardInput() {
    var lastValueX = offsetX, lastValueY = offsetY;
    var speed = 10;
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
        if(nodes[i].y + offsetY - (actionWidth / 2) < 0 || nodes[i].y + offsetY + (actionWidth / 2) > height) {
            offScreen = true;
        }

        if(nodes[i].y + offsetY + movementY - (actionWidth / 2) > 0 && nodes[i].y + offsetY + movementY + (actionWidth / 2) < height) {
            onScreen++;
        }
    }

    if(offScreen && onScreen >= 1) {
        offsetY += movementY
    }

    // zoooooooooooom
    if(keyIsDown(107)) {
        scaleY = scaleY < 2 ? scaleY + 0.02 : 2;
        scaleX = scaleX < 2 ? scaleX + 0.02 : 2;
    }
    else if(keyIsDown(109)) {
        scaleY = scaleY > 0.3 ? scaleY - 0.02 : 0.3;
        scaleX = scaleX > 0.3 ? scaleX - 0.02 : 0.3;
    }
    else if(keyIsDown(74)) {
        scaleX = scaleX > 0.3 ? scaleX - 0.02 : 0.3;
    }
    else if(keyIsDown(76)) {
        scaleX = scaleX < 2 ? scaleX + 0.02 : 2;
    }
    else if(keyIsDown(73)) {
        scaleY = scaleY < 2 ? scaleY + 0.02 : 2;
    }
    else if(keyIsDown(75)) {
        scaleY = scaleY > 0.3 ? scaleY - 0.02 : 0.3;
    }

    resetMatrix();
    translate(offsetX, offsetY);
}

function drawActions(sequence, programWidth, index) {
    for(var i = 0; i < sequence.actions.length; i++) {
        if(sequence.actions[i].constructor == Action) {
            // draw the lines connecting "simultaneous" flow actions to the graph
            if(i != 0 && (sequence.control == FlowControlEnum.branch || sequence.control == FlowControlEnum.selection)) {
                drawLine(sequence, sequence.actions[i].x - 1, sequence.actions[i].y, programWidth);
            }

            sequence.actions[i].draw(programWidth);
        }
        else {
            var nextIndex = index.concat([i]);
            var pos = indexToXY(nextIndex);

            // if previous control flow was a branch or selection draw a line
            var lastControl = sequence.control;
            if(sequence.control == FlowControlEnum.branch || sequence.control == FlowControlEnum.selection) {
                drawLine(sequence, pos.x - 1, pos.y, programWidth);
            }

            // draw elements of this control flow
            var prog = sequence.actions[i];

            if(prog.control == FlowControlEnum.branch) {
                drawBranchBars(prog, pos.x, pos.y, nextIndex, programWidth);
            }
            if(prog.control == FlowControlEnum.selection) {
                drawSelectionDiamond(prog, pos.x, pos.y, nextIndex, programWidth);
            }
            if(prog.control == FlowControlEnum.iteration) {
                drawIterationLoop(prog, pos.x, pos.y, nextIndex, programWidth);
            }
            if(prog.control == FlowControlEnum.sequence) {
                drawSequenceBox(prog, pos.x, pos.y, nextIndex, programWidth);
            }

            drawActions(prog, programWidth, nextIndex);
        }
    }
}

function updateActions(sequence, programWidth, index) {
    for(var i = 0; i < sequence.actions.length; i++) {
        if(sequence.actions[i].constructor == Action) {
            sequence.actions[i].update(index.concat([i]), programWidth);
        }
        else if(sequence.actions[i].actions.length == 0) {
            sequence.actions.splice(i, 1);
            update();
            return;
        }
        else {
            var nextIndex = index.concat([i]);
            var pos = indexToXY(nextIndex);


            var lastControl = sequence.control;

            var yPixels = (pos.y * actionHeight * 2) + middle;
            if(sequence.actions[i].control) {
                var nodeX = (endX - startX) * ((pos.x * 2 + 1) / (programWidth * 2 + 2)) + startX;
                if(sequence.control == FlowControlEnum.branch || sequence.control == FlowControlEnum.selection) {
                    nodes.push(new Node(nodeX, yPixels, index.concat([i, -1])));
                }
                else {
                    nodes.push(new Node(nodeX, yPixels, index.concat([i])));
                }
            }

            if(sequence.actions[i].control == FlowControlEnum.branch || sequence.actions[i].control == FlowControlEnum.selection) {
                var nodeX = (endX - startX) * ((pos.x * 2 + 2) / (programWidth * 2 + 2)) + startX;
                nodes.push(new Node(nodeX, yPixels, index.concat([i, sequence.actions[i].actions.length])));
            }

            updateActions(sequence.actions[i], programWidth, nextIndex);

            // previous updateActions() call may have removed sequence.actions[i], if it hasn't, add a name tag
            if(sequence.actions[i]) {
                var nameX, nameY;
                if(sequence.actions[i].control == FlowControlEnum.iteration || sequence.actions[i].control == FlowControlEnum.sequence) {
                    nameX = (endX - startX) * ((pos.x * 2 + 2) / (programWidth * 2 + 2)) + startX;
                    nameY = middle + (lowestY(sequence.actions[i]) * actionHeight * 2) - actionHeight * 0.7;
                }
                else {
                    nameX = (endX - startX) * ((pos.x * 2 + 2) / (programWidth * 2 + 2)) + startX;
                    var lowest = getY(sequence.actions[i].actions[0]);

                    for(var j = 1; j < sequence.actions[i].actions.length; j++) {
                        var thisY = getY(sequence.actions[i].actions[j])
                        if(lowest > thisY) {
                            lowest = thisY;
                        }
                    }

                    nameY = middle + (lowest * actionHeight * 2) - actionHeight * 0.75;
                }

                names.push(new Name(sequence.actions[i].name, nameX, nameY, nextIndex.slice()));
            }

            // add trailing node if there are no more actions
            if(i == sequence.actions.length - 1) {
                pos.x += sequenceLength(sequence.actions[i]);
                var nodeX = (endX - startX) * ((pos.x * 2 + 1) / (programWidth * 2 + 2)) + startX;
                if(sequence.control == FlowControlEnum.branch || sequence.control == FlowControlEnum.selection) {
                    nodes.push(new Node(nodeX, yPixels, index.concat([i, -2])));
                }
                else {
                    nodes.push(new Node(nodeX, yPixels, index.concat([i + 1])));
                }
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
        if(sequence.control == FlowControlEnum.iteration || sequence.control == FlowControlEnum.sequence) {
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
    var height = 0, maxHeight = 0;

    for(var i = 0; i < sequence.actions.length; i += incrementor) {
        if(sequence.actions[i].constructor != Action){
            height = sequenceHeight(sequence.actions[i]) - 1;
            if(maxHeight < height) {
                maxHeight = height;
            }
        }
    }

    if(sequence.control == FlowControlEnum.branch || sequence.control == FlowControlEnum.selection) {
        return maxHeight + sequence.actions.length;
    }

    return maxHeight + 1;
}

function indexToXY(index) {
    var prog = program;
    var x = 0;
    var y = 0;
    //add up the length of everything that came before
    for(var i = 0; i < index.length; i++) {
        if(prog.control != FlowControlEnum.branch && prog.control != FlowControlEnum.selection) {
            x += index[i];
            if(prog.control == FlowControlEnum.iteration || prog.control == FlowControlEnum.sequence) {
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

        if(actions[i].control != FlowControlEnum.action) {
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

    this.radius = 12;
    this.diameter = this.radius * 2;
    this.highlighted = false;

    var angle = clipBoard.length == 0 ? 360 / 5 : 360 / 6;
    this.positionAction = pointOnCircle(this.x, this.y, this.diameter, -90);
    this.positionIterate = pointOnCircle(this.x, this.y, this.diameter, -90 + angle * 1);
    this.positionBranch = pointOnCircle(this.x, this.y, this.diameter, -90 + angle * 2);
    this.positionSelect = pointOnCircle(this.x, this.y, this.diameter, -90 + angle * 3);
    this.positionSequence = pointOnCircle(this.x, this.y, this.diameter, -90 + angle * 4);
    this.positionPaste = pointOnCircle(this.x, this.y, this.diameter, -90 + angle * 5);

    this.press = function(x, y) {
        if(state != StateEnum.normal) {
            var d = dist(x, y, this.x, this.y);
            if(d < this.radius){
                if(state == StateEnum.controlFlow) {
                    if(validControlFlow(this)) {
                        ControlFlow(this.index, selectedIndex);
                    }
                    state = StateEnum.normal;
                    update();
                }

                return true;
            }

            return false;
        }

        var d = dist(x, y, this.positionAction.x, this.positionAction.y);
        if(d < this.radius) {
            addAction(this.index);
            update();
            return true;
        }

        d = dist(x, y, this.positionBranch.x, this.positionBranch.y);
        if(d < this.radius) {
            state = StateEnum.controlFlow;
            selectedIndex = this.index;
            currentControlFlow = FlowControlEnum.branch;
            return true;
        }

        d = dist(x, y, this.positionIterate.x, this.positionIterate.y);
        if(d < this.radius) {
            state = StateEnum.controlFlow;
            selectedIndex = this.index;
            currentControlFlow = FlowControlEnum.iteration;
            return true;
        }

        d = dist(x, y, this.positionSelect.x, this.positionSelect.y);
        if(d < this.radius) {
            state = StateEnum.controlFlow;
            selectedIndex = this.index;
            currentControlFlow = FlowControlEnum.selection;
            return true;
        }

        d = dist(x, y, this.positionSequence.x, this.positionSequence.y);
        if(d < this.radius) {
            state = StateEnum.controlFlow;
            selectedIndex = this.index;
            currentControlFlow = FlowControlEnum.sequence;
            return true;
        }

        if(clipBoard.length > 0) {
            d = dist(x, y, this.positionPaste.x, this.positionPaste.y);
            if(d < this.radius) {
                var prog = program;
                var offset = this.index[this.index.length - 1] >= 0 ? 1 : 2;

                for(var i = 0; i < this.index.length - offset; i++) {
                    prog = prog.actions[this.index[i]];
                }

                if(offset == 1) {
                    prog.actions.splice(this.index[this.index.length - 1], 0, clipBoard.pop());
                }//create a sequence because its pasting into a branch/selection single position
                else {
                    var action = prog.actions.splice(this.index[this.index.length - 2], 1);
                    if(this.index[this.index.length - 1] == -1) {
                        prog.actions.splice(this.index[this.index.length - 2], 0,
                            {name: 'New_Sequence', control: FlowControlEnum.sequence, actions: [clipBoard.pop()].concat(action)});
                    }
                    else {
                        prog.actions.splice(this.index[this.index.length - 2], 0,
                            {name: 'New_Sequence', control: FlowControlEnum.sequence, actions: action.concat([clipBoard.pop()])});
                    }
                }

                update();
                return true;
            }
        }

        return false;
    }

    this.mouseOver = function(x, y) {
        var d = dist(x, y, this.x, this.y);
        if(this.highlighted && state == StateEnum.normal) d = d / 3;
        this.highlighted = (d < this.radius);
        return this.highlighted;
    }

    this.draw = function() {
        if(state != StateEnum.controlFlow && this.highlighted) {
            fill(255);
            ellipse(this.positionAction.x, this.positionAction.y, this.diameter, this.diameter);
            ellipse(this.positionIterate.x, this.positionIterate.y, this.diameter, this.diameter);
            ellipse(this.positionBranch.x, this.positionBranch.y, this.diameter, this.diameter);
            ellipse(this.positionSelect.x, this.positionSelect.y, this.diameter, this.diameter);
            ellipse(this.positionSequence.x, this.positionSequence.y, this.diameter, this.diameter);

            textAlign(CENTER, CENTER);
            fill(0);
            text('A', this.positionAction.x, this.positionAction.y);
            text('I', this.positionIterate.x, this.positionIterate.y);
            text('B', this.positionBranch.x, this.positionBranch.y);
            text('Sel', this.positionSelect.x, this.positionSelect.y);
            text('Seq', this.positionSequence.x, this.positionSequence.y);

            if(clipBoard.length > 0) {
                fill(255);
                ellipse(this.positionPaste.x, this.positionPaste.y, this.diameter, this.diameter);
                fill(0);
                text('P', this.positionPaste.x, this.positionPaste.y);
            }
        }
        else {
            var validCF = validControlFlow(this);
            if(state != StateEnum.controlFlow) {
                fill(255);
            }
            else if(compareArrays(selectedIndex, this.index, this.index.length) && validCF) {
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
}

function pointOnCircle(x, y, radius, angle) {
    var theta = angle * PI / 180.0;
    return {'x': x + (radius * Math.cos(theta)),
            'y': y + (radius * Math.sin(theta))}
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

            if(prog.control) {
                state = StateEnum.form;
                selectedAction = prog;
                selectedIndex = this.index;

                $("#flowEditor").show();

                document.getElementById('flowName').value = prog.name;
                document.getElementById('flowType').value = prog.control;

                return true;
            }
            else {
                var newName = prompt('Input the new name for this process', prog.name) || prog.name;
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
    }

    this.mouseOver = function(x, y) {
        return (x > this.x && x < this.x + this.buttonWidth && y > this.y && y < this.y + this.buttonWidth);
    }

    this.draw = function() {
        fill(255);
        rect(this.x, this.y, this.buttonWidth, this.buttonWidth);
        fill(0);
        textAlign(CENTER, CENTER);
        text('...', this.x + this.buttonWidth / 2, this.y + this.buttonWidth / 2);
        textAlign(LEFT, TOP);
        if(this.name) {
            if(this.name.length < 22 * scaleX) {
                text(this.name, this.x + this.buttonWidth + 3, this.y);
            }
            else {
                text(this.name.substring(0, 19 * scaleX) + '...', this.x + this.buttonWidth + 3, this.y);
            }
        }
    }
}

function validControlFlow(node) {
    if(selectedIndex.length != node.index.length) return false;

    return compareArrays(selectedIndex, node.index, selectedIndex.length - 1);
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

function Action(action) {
    this.id = numActions++;
    this.x;
    this.y;

    // All the PML important details
    if(action) {
        this.name     = action.name     || "New_Action";
        this.type     = action.type     || "";
        this.agent    = action.agent    || "";
        this.script   = action.script   || "";
        this.tool     = action.tool     || "";
        this.requires = action.requires || "";
        this.provides = action.provides || "";
        this.selected = action.selected || false;
    }
    else {
        this.name     = "New_Action";
        this.type     = "";
        this.agent    = "";
        this.script   = "";
        this.tool     = "";
        this.requires = "";
        this.provides = "";
        this.selected = false;
    }


    this.press = function(programWidth, x, y) {
        var yPos = (this.y * actionHeight * 2) + middle - (actionHeight / 2);
        var xPos = (endX - startX) * ((this.x + 1) / (programWidth + 1)) + startX - (actionWidth / 2);

        if(x > xPos && x <= xPos +  actionWidth &&  y > yPos && y < yPos + actionHeight) {
            state = StateEnum.form;
            selectedAction = this;

            $("#actionEditor").show();

            document.getElementById('name').value = this.name;
            document.getElementById('type').value = this.type;
            document.getElementById('agent').value = this.agent;
            document.getElementById('script').value = this.script;
            document.getElementById('tool').value = this.tool;
            document.getElementById('requires').value = this.requires;
            document.getElementById('provides').value = this.provides;

            return true;
        }
        return false;
    }

    this.mouseOver = function(programWidth, x, y) {
        var yPos = (this.y * actionHeight * 2) + middle - (actionHeight / 2);
        var xPos = (endX - startX) * ((this.x + 1) / (programWidth + 1)) + startX - (actionWidth / 2);

        return (x > xPos && x <= xPos +  actionWidth &&  y > yPos && y < yPos + actionHeight);
    }

    this.update = function(index, programWidth) {
        var pos = indexToXY(index);
        this.x = pos.x;
        this.y = pos.y;

        var prog = program;
        for(var i = 0; i < index.length - 1; i++) {
            prog = prog.actions[index[i]];
        }

        var yPixels = (this.y * actionHeight * 2) + middle;
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

                nodes.push(new Node(nodeX, yPixels, index));
            }
            if(index[index.length - 1] == prog.actions.length - 1) {
                var nodeX = (endX - startX) * ((this.x * 2 + 3) / (programWidth * 2 + 2)) + startX;
                var newIndex = index.slice();
                newIndex[newIndex.length - 1]++; // index point to position after the action
                nodes.push(new Node(nodeX, yPixels, newIndex));
            }
        }
    }

    this.draw = function(programWidth) {
        var yPixels = (this.y * actionHeight * 2) + middle;
        var xPixels = (endX - startX) * ((this.x + 1) / (programWidth + 1)) + startX;

        fill(255);
        rect(xPixels - (actionWidth / 2), yPixels - (actionHeight / 2), actionWidth, actionHeight);
        fill(0);
        textAlign(CENTER, CENTER);
        if(this.name.length <= 17 * scaleX) {
            text(this.name, xPixels, yPixels);
        }
        else {
            text(this.name.substring(0, 14 * scaleX) + '...', xPixels, yPixels);
        }
    }
}

function drawLine(prog, x, y, programWidth) {
    var endLineX = sequenceLength(prog) + x;
    var diagramWidth = endX - startX;
    var startLineXPixels = diagramWidth * ((x + 1) / (programWidth + 1)) + startX;
    var endLineXPixels = diagramWidth * (endLineX / (programWidth + 1)) + startX;

    var yPixels = (y * actionHeight * 2) + middle;
    line(startLineXPixels, yPixels, endLineXPixels, yPixels);

    return {"startX": startLineXPixels, "endX": endLineXPixels, "y": yPixels};
}

function drawIterationLoop(prog, x, y, index, programWidth) {
    var diagramWidth = endX - startX;
    var startXRectPixels = diagramWidth * ((x + 1) / (programWidth + 1)) + startX;
    var endLineX = sequenceLength(prog) + x;
    var endXRectPixels = diagramWidth * (endLineX / (programWidth + 1)) + startX;

    var yPixels = (y * actionHeight * 2) + middle;

    var yTop = lowestY(prog);
    var loopHeight = sequenceHeight(prog);
    var rectHeight = (loopHeight - 1) * actionHeight * 2 + actionHeight * 1.4;

    rectPositionY = middle + (actionHeight * yTop * 2) - actionHeight * 0.7;
    var offset = nestedBoxes(prog) * 5;

    startXRectPixels = startXRectPixels;
    endXRectPixels = endXRectPixels;
    fill(255, 255, 255, 0);
    rect(startXRectPixels, rectPositionY - offset, endXRectPixels - startXRectPixels, rectHeight + offset * 2, 20, 20, 20, 20);
}

function drawSequenceBox(prog, x, y, index, programWidth) {
    var diagramWidth = endX - startX;
    var startXRectPixels = diagramWidth * ((x + 1) / (programWidth + 1)) + startX;
    var endLineX = sequenceLength(prog) + x;
    var endXRectPixels = diagramWidth * (endLineX / (programWidth + 1)) + startX;

    var yPixels = (y * actionHeight * 2) + middle;

    var yTop = lowestY(prog);
    var loopHeight = sequenceHeight(prog);
    var rectHeight = (loopHeight - 1) * actionHeight * 2 + actionHeight * 1.4;

    rectPositionY = middle + (actionHeight * yTop * 2) - actionHeight * 0.7;
    var offset = nestedBoxes(prog) * 5;

    startXRectPixels = startXRectPixels;
    endXRectPixels = endXRectPixels;
    fill(255, 255, 255, 0);
    rect(startXRectPixels, rectPositionY - offset, endXRectPixels - startXRectPixels, rectHeight + offset * 2);
}

function nestedBoxes(prog) {
    if(prog.constructor == Action) return 0;

    var temp, max = 0;
    for(var i = 0; i < prog.actions.length; i++) {
        temp = 0;
        if(prog.actions[i].constructor != Action) {
            temp = nestedBoxes(prog.actions[i]);
            if(prog.actions[i].control == FlowControlEnum.iteration || prog.actions[i].control == FlowControlEnum.sequence) {
                temp = temp + 1;
            }
        }

        if(max < temp) {
            max = temp;
        }
    }

    return max;
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

    rectPositionYOne = (rectPositionYOne * actionHeight * 2) + middle;
    rectPositionYTwo = (rectPositionYTwo * actionHeight * 2) + middle;

    var rectHeight = Math.abs(rectPositionYOne - rectPositionYTwo) + actionHeight + 10;
    var rectPositionY;

    if(rectPositionYOne < rectPositionYTwo) {
        rectPositionY = rectPositionYOne;
    }
    else {
        rectPositionY = rectPositionYTwo;
    }

    rectPositionY = rectPositionY - (actionHeight / 2) - 5;

    fill(0)
    rect(lineDetails.startX - 5, rectPositionY, 10, rectHeight);
    rect(lineDetails.endX - 5, rectPositionY, 10, rectHeight);
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

    linePositionYStart = (linePositionYStart * actionHeight * 2) + middle;
    linePositionYEnd = (linePositionYEnd * actionHeight * 2) + middle;

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
}

function selectAction(actions, id){
    for(var i = 0; i < actions.length; i++) {
        if(actions[i].control == FlowControlEnum.action) {
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
        // if the new action is to be in a branch/selection, surround it in a sequence
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
            array.splice(index[index.length - 2], 1,
                {name: 'New_' + currentControlFlow, control: currentControlFlow, actions: [array[index[index.length - 2]]]});
            return;
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
    if(index[index.length - 1] == -1) {
        sequenceArray = [newAction, array[index[index.length - 2]]];
    }//end with old node
    else {
        sequenceArray = [array[index[index.length - 2]], newAction];
    }

    //adds a sequence to program.actions
    array.splice(index[index.length - 2], 1,
        {name: 'New_Sequence', control: FlowControlEnum.sequence, actions: sequenceArray});
}

function mousePressedCanvas(event) {
    $('#actionEditor').hide();
    $('#flowEditor').hide();
    $('#outputPanel').hide();

    var x = mouseX - offsetX;
    var y = mouseY - offsetY;
    var programwidth = sequenceLength(program);
    var pressed = false;

    for(var i = 0; i < nodes.length && !pressed; i++) {
        pressed = nodes[i].press(x, y);
    }

    for(var i = 0; i < names.length && !pressed; i++) {
        pressed = names[i].press(x, y);
    }

    if(!pressed) {
        pressed = pressActions(program.actions, programwidth, x, y);
    }

    if(!pressed) {
        state = StateEnum.normal;
    }
}

function pressActions(actions, programwidth, x, y) {
    for(var i = 0; i < actions.length; i++) {
        if(actions[i].constructor == Action) {
            if(actions[i].press(programwidth, x, y)) return true;
        }
        else {
            if(pressActions(actions[i].actions, programwidth, x, y)) return true;
        }
    }
}

function mouseMovedCanvas(event) {
    if (state == StateEnum.form) return;

    var x = mouseX - offsetX;
    var y = mouseY - offsetY;
    var programwidth = sequenceLength(program);
    var mousedOver = mouseOverActions(program.actions, programwidth, x, y);

    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].mouseOver(x, y)){
            mousedOver = true;
            break;
        }
    }

    for(var i = 0; i < names.length; i++) {
        if(names[i].mouseOver(x, y)){
            mousedOver = true;
            break;
        }
    }

    if(mousedOver) {
        cursor(HAND);
    }
    else {
        cursor(ARROW);
    }
}

function mouseOverActions(actions, programwidth, x, y) {
    for(var i = 0; i < actions.length; i++) {
        if(actions[i].constructor == Action) {
            if(actions[i].mouseOver(programwidth, x, y)) return true;
        }
        else {
            if(mouseOverActions(actions[i].actions, programwidth, x, y)) return true;
        }
    }
}

function mouseDragged(event) {
    if(state == StateEnum.form) return;

    var lastValueX = offsetX, lastValueY = offsetY;
    // handle horizontal scrolling if display is wider than screen
    if(endX + startX > width) {
        if(event.movementX) {
            offsetX += event.movementX;
        }
        else if(event.mozMovementX) {
            offsetX += event.mozMovementX;
        }

        if(offsetX > 0) {
            offsetX = 0;
        }

        if(offsetX < width - (endX + startX)) {
            offsetX = width - (endX + startX);
        }
    }

    var movementY = 0;
    if(event.movementY) {
        movementY = event.movementY;
    }
    else if(event.mozMovementY) {
        movementY = event.mozMovementY;
    }
    var offScreen = false, onScreen = 0;
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].y + offsetY - (actionWidth / 2) < 0 || nodes[i].y + offsetY + (actionWidth / 2) > height) {
            offScreen = true;
        }

        if(nodes[i].y + offsetY +movementY - (actionWidth / 2) > 0 && nodes[i].y + offsetY +movementY + (actionWidth / 2) < height) {
            onScreen++;
        }
    }

    if(offScreen && onScreen >= 1) {
        offsetY +=movementY;
    }

    // only redraw with change
    if(lastValueX != offsetX || lastValueY != offsetY) {
        resetMatrix();
        translate(offsetX, offsetY);
    }
}

function editAction() {

	// variable regex stuff here
    var variableRegex = new RegExp('^ *([a-zA-Z_][a-zA-Z_0-9]*) *$')
    var name = document.getElementById('name').value;
    if (!variableRegex.test(name)) {
        alert(  "The name " + name + " of the Action is invalid, "
              + "Action names must start with an underscore or letter and contain"
              + " only letters, numbers and underscrores.");
        return
    }

    var predicateRegex = new RegExp('^ *((([a-zA-Z_.0-9]+|\"[^\"]*\")( *([|][|]|&&) *([a-zA-Z_.0-9]+|\"[^\"]*\"))*))| * *$');

	// agent regex stuff here
    var agent = document.getElementById('agent').value;
    if ( !predicateRegex.test(agent) && agent.length != 0) {
        alert(  "The agent " + agent + " of the Action is invalid, "
              + "agents must be be strings or start with an underscore or letter and contain "
              + "only letters, numbers and underscrores.");
        return
    }
	var agentResult = predicateRegex.exec(agent);
	if  ( agentResult[1] == null || agent.length == 0 ) {
		agent = "";
	}
	else {
		agent = agentResult[1];
	}

	// tool regex stuff here
	var toolRegex = new RegExp('^ *([^\"]*) *$');
    var tool = document.getElementById('tool').value;

	if ( !toolRegex.test(tool) && tool.length != 0) {
        alert(  "The tool " + tool + " of the Action is invalid, "
              + "the tool must not contain \" characters.");
        return
    }
	var toolResult = toolRegex.exec(tool);
	if ( toolResult[1] == null || toolResult.length == 0 ) {
		tool = "";
	}
	else {
		tool = toolResult[1];
	}

	// requires regex stuff here
    var requires = document.getElementById('requires').value
	if(!predicateRegex.test(requires) && requires.length != 0) {
        alert(  "The requirement \"" + requires + "\" of the Action is invalid, "
              + "requirements must start with an underscore or letter and contain "
              + "only letters, numbers and underscrores.");
        return
    }
	var requiresResult = predicateRegex.exec(requires);
	if ( requiresResult[1] == null || requiresResult.length == 0 ) {
		requires = "";
	}
	else {
		requires = requiresResult[1];
	}

	// provides regex stuff here
    var provides = document.getElementById('provides').value;
    if(!predicateRegex.test(provides) && provides.length != 0) {
        alert(  "The provision \"" + provides + "\" of the Action is invalid, "
              + "provisions must start with an underscore or  letter and contain "
              + "only letters, numbers and underscrores.");
        return
    }
	var providesResult = predicateRegex.exec(provides);
	if ( providesResult[1] == null || providesResult.legnth == 0 ) {
		provides = "";
	}
	else {
		provides = providesResult[1];
	}


    selectedAction.name = variableRegex.exec(name)[1];
    selectedAction.type = document.getElementById('type').value;
    selectedAction.agent = agent
    selectedAction.script = document.getElementById('script').value;
    selectedAction.tool = tool;
    selectedAction.requires = requires;
    selectedAction.provides = provides;
    selectedAction.selected = false;

    $("#actionEditor").hide();
    state = StateEnum.normal;
    update();
}

// deletes an action with matching id from program prog
function deleteAction(prog, id) {
    for(var i = 0; i < prog.actions.length; i++) {
        if(prog.actions[i].constructor == Action) {
            if(prog.actions[i].id == id) {
                prog.actions.splice(i, 1);
                update();
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
    update();
}

function cutAction() {
    editAction();
    clipBoard.push(selectedAction);

    deleteAction(program, selectedAction.id);

    $('#actionEditor').hide();
    state = StateEnum.normal;
    update();
}

function editSequence() {
    var name = document.getElementById('flowName').value;
    var variableRegex = new RegExp('^[a-zA-Z_][a-zA-Z_0-9]*$');
    if(!variableRegex.test(name)) {
        alert('\"' + name + '\" is invalid, it must start with\
                a letter or an underscore and contain only these and numbers.');
                return;
    }

    selectedAction.name = name;
    selectedAction.control = document.getElementById('flowType').value;
    $('#flowEditor').hide();
    state = StateEnum.normal;

    update();
}

function deleteSequence() {
    var prog = program;
    for(var i = 0; i < selectedIndex.length - 1; i++) {
        prog = prog.actions[selectedIndex[i]];
    }

    prog.actions.splice(selectedIndex[selectedIndex.length - 1], 1)
}

function removeSequence() {
    if(!confirm("Are you sure you wish to delete  this control flow?")) return;

    deleteSequence();
    update();

    $('#flowEditor').hide();
    state = StateEnum.normal;
}

function cutSequence() {
    editSequence();
    clipBoard.push(selectedAction);
    deleteSequence();
    update();

    $('#flowEditor').hide();
    state = StateEnum.normal;
}

function cancel() {
    $('#actionEditor').hide();
    $('#flowEditor').hide();
    state = StateEnum.normal;
}
