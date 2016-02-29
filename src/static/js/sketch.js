var startX, endX, middle, program, nodes, state;

var StateEnum = {
    normal: 0,
    form: 1,
    iteration: 2
};

var FlowControlEnum = {
    i: "iteration",
    b: "branch",
    s: "selection"
};

function setup() {
    state = StateEnum.normal;
    createCanvas(windowWidth, windowHeight);
    startX = 40;
    endX = width - 80;
    middle = height / 2;

    program = new Array();
    nodes = new Array();
    addNodes();

    textAlign(CENTER, CENTER);
}

function draw() {
    background(255, 255, 255);

    fill(0);
    line(startX, middle, endX, middle);
    ellipse(startX, middle, 30, 30);
    fill(255);
    ellipse(endX, middle, 30, 30);
    fill(0);
    ellipse(endX, middle, 20, 20);

    drawActions(program);

    for(var i = 0; i < nodes.length; i++) {
        nodes[i].draw();
    }
}

function drawActions(actions) {
    var validI = validIterations(actions);

    for(var i = 0; i < actions.length; i++) {
        if(actions[i].constructor == Action){
            if(state != StateEnum.iteration) {
                actions[i].draw(255, 255, 255);
            }
            else {
                if(actions[i].selected) {
                    actions[i].draw(0, 120, 0);
                }
                else {
                    if(validI.validIterations.indexOf(i) >= 0) {
                        actions[i].draw(0, 255, 0);
                    }
                    else {
                        actions[i].draw(255, 0, 0);
                    }
                }
            }
        }
        else {
            drawActions(actions[i].actions);
        }
    }
}

function validIterations(actions) {
    var iterations = new Array();
    if(state != StateEnum.iteration) return iterations;

    var found = false;
    var selectedIndex = -1;

    for(var i = 0; i < actions.length; i++) {
        if(found && actions[i].constructor == Action) {
            iterations.push(i);
        }
        else if(found) {
            break;
        }
        if(actions[i].selected) {
            selectedIndex = i;
            found = true;
        }
    }

    for(var i = selectedIndex; i >= 0; i--) {
        if(actions[i].constructor == Action) {
            iterations.push(i);
        }
        else {
            break;
        }
    }

    return {selected: selectedIndex, validIterations: iterations};
}

function sequenceLength(actions) {
    //TODO
}

function addAction(x, y) {
    program.push(new Action(x, y));
    program.sort(compare);
    var diagramWidth = endX - startX;

    var length = 0;

    for(var i = 0; i < program.length; i++) {
        program[i].x = diagramWidth * ((i + 1) / (program.length + 1)) - program[i].width / 4;
    }
}

function addNodes() {
    nodes = [];
    if(program.length == 0) {
        nodes.push(new Node((startX + endX) / 2, middle));
    }
    else{
        nodes.push(new Node((startX + program[0].x) / 2, middle));
        for(var i = 1; i < program.length; i++){
            var xpos = (program[i-1].x + program[i].x) / 2 + program[i].width / 2;
            var ypos = program[i].y + program[i].height / 2;
            nodes.push(new Node(xpos, ypos));
        }
        nodes.push(new Node((endX + program[program.length-1].x) / 2, middle));
    }
}

function Node(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;

    this.press = function() {
        var d = dist(mouseX, mouseY, this.x, this.y);

        if(d < this.radius){
            addAction(this.x, this.y);
            addNodes();
        }
    }

    this.draw = function() {
        fill(255);
        ellipse(this.x, this.y, this.radius, this.radius);
        fill(0);
        text('+', this.x, this.y);
    }
}

function Action(x, y) {
    this.width = 120;
    this.height = 80;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.name = "New Action";
    this.type = "";
    this.agent = "";
    this.script = "";
    this.requirements = new Array();
    this.provisions = new Array();
    this.selected = false;

    this.move = function(x,y) {
        this.x = x - this.width / 2;
        this.y = y - this.height / 2;
    }

    this.press = function() {
        this.selected = false;

        if(mouseX >= this.x && mouseX <= this.x + 20 && mouseY >= this.y && mouseY <= this.y + 20) {
            this.selected = true;
            openActionEditor(this);
            return true;
        }

        if(dist(mouseX, mouseY, this.x + this.width / 2, this.y) <= 20) {
            this.selected = true;
            state = StateEnum.iteration;
            return true;
        }

        return false;
    }

    this.draw = function(r, g, b) {
        fill(255);
        rect(this.x, this.y, this.width, this.height);
        fill(255);
        rect(this.x, this.y, 20, 20);
        fill(0);
        text('...', this.x + 10, this.y + 10);
        text(this.name, this.x + this.width / 2, this.y + this.height / 2);
        fill(r, g, b);
        ellipse(this.x + this.width / 2, this.y, 20, 20);
        fill(0);
        text('I', this.x + this.width / 2, this.y);
        text(this.name, this.x + this.width / 2, this.y + this.height / 2);
    }
}

function compare(a,b) {
  if (a.x < b.x)
    return -1;
  else if (a.x > b.x)
    return 1;
  else
    return 0;
}

function Iterate(first, second, array){
    console.log("Iterate");
    var start, end;
    if(first < second){
        start = first;
        end = second;
    }
    else {
        start = second;
        end = first;
    }

    //adds an iteration to program
    array.splice(start, end - start + 1, {control: FlowControlEnum.i, actions: array.slice(start, end + 1)});
    console.log("here");
}

function mousePressed() {
    if (state == StateEnum.form) return;

    if(!pressActions(program)) state = StateEnum.normal;

    for(var i = 0; i < nodes.length; i++) {
        nodes[i].press();
    }
}

function pressActions(actions) {
    var pressed = false;
    var selectedIndex = -1;

    var lastStateEnum = state;
    var validIteration = validIterations(actions);

    for(var i = 0; i < actions.length && !pressed; i++) {
        if(actions[i].constructor == Action) {
            pressed = actions[i].press();
            if(lastStateEnum == StateEnum.iteration && state == StateEnum.iteration && pressed){
                if(validIteration.validIterations.indexOf(i) >= 0) {
                    state = StateEnum.normal;
                    actions[i].selected = false;
                    actions[validIteration.selected].selected = false;
                    Iterate(validIteration.selected, i, actions);
                }
            }
        }
        else {
            pressed = pressActions(actions[i].actions);
            if(selectedIndex < i) selectedIndex = -1;
        }
    }

    return pressed;
}

$(document).ready(function () {
    toggleFields();
    $("#flow").change(function () {
        toggleFields();
    });

});

function openActionEditor(action) {
    state = StateEnum.form;
    $("#actionEditor").show();
    document.getElementById('name').value = action.name;
    document.getElementById('type').value = action.type;
    document.getElementById('agent').value = action.agent;
    document.getElementById('script').value = action.script;
    document.getElementById('tool').value = action.tool;
}

function editAction() {
    for(var i = 0;  i < program.length; i++) {
        if(program[i].selected) {
            program[i].name = document.getElementById('name').value;
            program[i].type = document.getElementById('type').value;
            program[i].agent = document.getElementById('agent').value;
            program[i].script = document.getElementById('script').value;
            program[i].tool = document.getElementById('tool').value;
            program[i].selected = false;
            break;
        }
    }

    $("#actionEditor").hide();
    state = StateEnum.normal;
}

function findSelected(actions) {
    for(var = 0; i < )
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
