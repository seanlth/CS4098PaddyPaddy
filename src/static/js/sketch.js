var startX, endX, middle, program, nodes, formDisplayed;

var TypeEnum = {
    none: 0,
    manual: 1,
    executable: 2
};

function setup() {
    formDisplayed = false;
    createCanvas(windowWidth, windowHeight);
    startX = 20;
    endX = width - 40;
    middle = height / 2;

    program = new Array();
    nodes = new Array();
    addNodes();

    textAlign(CENTER);
}

function draw() {
    background(255, 255, 255);

    fill(0);
    line(startX, middle, endX, middle);
    ellipse(startX, middle, 20, 20);
    fill(255);
    ellipse(endX, middle, 20, 20);
    fill(0);
    ellipse(endX, middle, 14, 14);

    for(var i = 0; i < program.length; i++) {
        program[i].draw();
    }

    for(var i = 0; i < nodes.length; i++) {
        nodes[i].draw();
    }
}

function addAction(x, y) {
    program.push(new Action(x, y));
    program.sort(compare);
    var diagramWidth = endX - startX;
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
    this.width = 100;
    this.height = 100;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.name = "Action " + program.length;
    this.type = TypeEnum.none;
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
        if(mouseX >= this.x && mouseX <= this.x + 20 &&
            mouseY >= this.y && mouseY <= this.y + 20) {
                this.selected = true;
                openActionEditor(this);
            }
        // if(mouseX >= this.x && mouseX <= this.x + this.width &&
        //     mouseY >= this.y && mouseY <= this.y + this.height) {
        //         this.selected = true;
        //     }
    }

    this.draw = function() {
        fill(255);
        rect(this.x, this.y, this.width, this.height);
        fill(255);
        rect(this.x, this.y, 20, 20);
        fill(0);
        text('...', this.x + 10, this.y + 10);
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


function mousePressed() {
    if (formDisplayed) return;

    for(var i = 0; i < program.length; i++) {
        program[i].press();
    }

    for(var i = 0; i < nodes.length; i++) {
        nodes[i].press();
    }
}

$(document).ready(function () {
    toggleFields();
    $("#flow").change(function () {
        toggleFields();
    });

});

function openActionEditor(action) {
    formDisplayed = true;
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
    formDisplayed = false;
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
