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
    endX = width - 40;
    middle = height / 2;

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

    var progWidth = program.actions.length + sequenceLength(program.actions);
    nodes = [];
    drawSequenceOrIteration(program.actions, progWidth, 0, 0, []);

    for(var i = 0; i < nodes.length; i++) {
        nodes[i].draw(progWidth);
    }
}

function drawSequenceOrIteration(actions, progWidth, x, y, index) {
    if(actions.length == 0) {
        var nodeXInPixels = ((endX - startX) * (((x * 2) + 1) / ((progWidth * 2) + 2))) + startX;
        var yInPixels = (y * 1.5 * ACTION_HEIGHT) + middle;
        nodes.push(new Node(nodeXInPixels, yInPixels, index.concat([0])));
        return;
    }

    var iteration_length = 0;
    for(var i = 0; i < actions.length; i++) {
        var yChange = 0;
        var xChange = i;

        var xInPixels = (((x + 1 + xChange + iteration_length)  / (progWidth + 1)) * (endX - startX)) + startX - (ACTION_WIDTH / 2);
        var nodeXInPixels = ((endX - startX) * ((((x + xChange + iteration_length) * 2) + 1) / ((progWidth * 2) + 2))) + startX;
        var yInPixels = (y * 1.5 * ACTION_HEIGHT) + middle - (ACTION_HEIGHT / 2);

        if(actions[i].constructor == Action){
            if(index.length > 0 && i == 0) {
                nodes.push(new Node(xInPixels - 20, yInPixels + (ACTION_HEIGHT / 2), index.concat([i])));
            }
            else {
                nodes.push(new Node(nodeXInPixels, yInPixels + (ACTION_HEIGHT / 2), index.concat([i])));
            }

            actions[i].draw(xInPixels, yInPixels);
        }
        else {
            if(actions[i].control == FlowControlEnum.iteration) {
                nodes.push(new Node(nodeXInPixels, yInPixels + (ACTION_HEIGHT / 2), index.concat([i])));
                fill(0,0,0,0);
                iteration_length += sequenceLength(actions[i].actions) + actions[i].actions.length - 1;
                var iterationLengthInPixels = (((x + 1 + iteration_length)  / (progWidth + 1)) * (endX - startX)) + startX + (ACTION_WIDTH / 2);
                rect(xInPixels - 20, yInPixels - (ACTION_HEIGHT * 0.25), iterationLengthInPixels - xInPixels + 40, ACTION_HEIGHT * 1.5, 20, 20, 20, 20);
                drawSequenceOrIteration(actions[i].actions, progWidth, x + xChange, y, index.concat([i]));
            }
            else if(actions[i].control == FlowControlEnum.branch) {
                nodes.push(new Node(nodeXInPixels, yInPixels + (ACTION_HEIGHT / 2), index.concat([i])));
                iteration_length += sequenceLength(actions[i].actions) + 2;
                var finish = (((x + 1 + iteration_length)  / (progWidth + 1)) * (endX - startX)) + startX + (ACTION_WIDTH / 2);
                var height = sequenceHeight(actions[i].actions) + actions[i].actions.length;
                var heightInPixels;
                if(y == 0) {
                    heightInPixels = yInPixels - ACTION_HEIGHT * 1.5 * ((height - (height % 2)) / 2);
                }
                rect(xInPixels - 10 + ACTION_WIDTH / 2, heightInPixels, 20, ACTION_HEIGHT * 1.5 * height);
                rect(finish - 10, heightInPixels, 20, ACTION_HEIGHT * 1.5 * height);
                drawBranchOrSelection(actions[i].actions, progWidth, x + xChange, y, index.concat([i]));
            }
            else {
                nodes.push(new Node(nodeXInPixels - ACTION_WIDTH, yInPixels + (ACTION_HEIGHT / 2), index.concat([i])));
                drawSequenceOrIteration(actions[i].actions, progWidth, x + xChange, y, index.concat([i]));
            }
        }
    }

    var yInPixels = (y * 1.5 * ACTION_HEIGHT) + middle;
    if(index.length == 0) {
        var nodeXInPixels = ((endX - startX) * ((((x + actions.length + iteration_length) * 2) + 1) / ((progWidth * 2) + 2))) + startX;
        nodes.push(new Node(nodeXInPixels, yInPixels, index.concat([i])));
    }
    else {
        var nodeXInPixels = ((endX - startX) * ((((x + actions.length) * 2)) / ((progWidth * 2) + 2))) + ACTION_WIDTH;
        nodes.push(new Node(nodeXInPixels, yInPixels, index.concat([i])));
    }
}

function drawBranchOrSelection(actions, progWidth, x, y, index) {
    var nodeXInPixels = ((endX - startX) * (((x * 2) + 2) / ((progWidth * 2) + 2))) + startX;
    var yInPixels = (y * 1.5 * ACTION_HEIGHT) + middle;
    nodes.push(new Node(nodeXInPixels, yInPixels, index.concat([actions.length])));

    x++;

    var iteration_length = 0;
    for(var i = 0; i < actions.length; i++) {
        var yChange = 0;
        var xChange = 0;

        if(y == 0 && i == 0) {
            yChange = 0;
        }
        else if(y == 0) {
            yChange = i % 2 == 0 ? (i / 2) : -(i + 1) / 2;
        }
        else {
            yChange = y < 0 ? -1 : 1;
        }

        var xInPixels = (((x + 1 + xChange + iteration_length)  / (progWidth + 1)) * (endX - startX)) + startX - (ACTION_WIDTH / 2);
        var yInPixels = ((y + yChange) * 1.5 * ACTION_HEIGHT) + middle - (ACTION_HEIGHT / 2);

        if(actions[i].constructor == Action){
            nodes.push(new Node(xInPixels + ACTION_WIDTH + 50, yInPixels + (ACTION_HEIGHT / 2), index.concat([i, -1])));
            actions[i].draw(xInPixels, yInPixels);
        }
        else {
            if(actions[i].control == FlowControlEnum.branch) {
                nodes.push(new Node(nodeXInPixels, yInPixels + (ACTION_HEIGHT / 2), index.concat([i])));
                drawBranchOrSelection(actions[i].actions, progWidth, x + xChange, y, index.concat([i]));
            }
            else {
                drawSequenceOrIteration(actions[i].actions, progWidth, x + xChange, y + yChange, index.concat([i]));
            }
        }
    }
}

function sequenceLength(actions) {
    var length = 0;
    for(var i = 0; i < actions.length; i++) {
        if(actions[i].constructor != Action){
            length += sequenceLength(actions[i].actions);
            if(actions[i].control == FlowControlEnum.sequence || actions[i].control == FlowControlEnum.iteration) {
                length += actions[i].actions.length - 1;
            }
            else {
                length += 2;
            }
        }
    }

    return length;
}

function sequenceHeight(actions) {
    var height = 0;
    for(var i = 0; i < actions.length; i++) {
        if(actions[i].constructor != Action){
            height += sequenceHeight(actions[i].actions);
            if(actions[i].control == FlowControlEnum.branch || actions[i].control == FlowControlEnum.selection) {
                height += actions[i].actions.length;
            }
        }
    }
    return height;
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
        var progWidth = sequenceLength(program.actions) + program.actions.length;
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

    // this.x = ((endX - startX) * (((x * 2) + 1) / ((progWidth * 2) + 2))) + startX;
    // this.y = (y * ACTION_HEIGHT) + middle;
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.diameter = this.radius * 2;

    this.press = function(x, y) {
        var d = dist(x, y, this.x + this.radius, this.y + this.radius);
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

    var exactlyTheSame = true;
    for(var i = 0; i < iterationIndex.length && exactlyTheSame; i++) {
        exactlyTheSame = iterationIndex[i] == node.index[i];
        if(i == iterationIndex.length - 1) {
            return true;
        }
    }

    return !exactlyTheSame;
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
    this.requirements = new Array();
    this.provisions = new Array();
    this.selected = false;

    this.draw = function(x, y) {
        this.element.position(x, y);
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
    }
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

function compare(a,b) {
  if (a.x < b.x)
    return -1;
  else if (a.x > b.x)
    return 1;
  else
    return 0;
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

function add_requirements(requirements, current_indentation) {
	return "";
}

function add_provisions(provisions, current_indentation) {
	return "";
}


function add_action(action, current_indentation) {
	node = current_indentation + "action " + action.name + " { \n";
	node += current_indentation + "    " + add_requirements(action.requirements, current_indentation + "    ");
	node += current_indentation + "    " + add_provisions(action.provisions, current_indentation + "    ") + "\n"; 
	node += current_indentation + "}"
	
	return node;
}

function add_primitive(primitive, current_indentation) {
	var primitive_string = "";

	if ( primitive.hasOwnProperty('control') ) {
		primitive_string = current_indentation + primitive.control + " { \n" + add_primitives(primitive.actions, current_indentation + "    ") + "\n";
		primitive_string += current_indentation + "}";
	}
	else {
		primitive_string = add_action(primitive, current_indentation);	
	}

	return primitive_string;
}

function add_primitives(primitives, current_indentation) {
	var primitives_string = "";
		
	console.log("length" + primitives.length);
	
	for ( var i = 0; i < primitives.length; i++ ) {
		console.log("index" + i);	
		var primitive = primitives[i];
		var node = add_primitive(primitive, current_indentation);
		primitives_string += node + "\n";
	} 
	return primitives_string;
}

function json_to_pml(program) {
	var PML_code = "process " + program.name + " { \n";
	
	PML_code += add_primitives(program.actions, "    ") + "\n";
	PML_code += "}"

	return PML_code;
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
	
	var pml_code = json_to_pml(program);
	console.log(pml_code);
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
