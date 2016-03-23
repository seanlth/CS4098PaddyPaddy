var editor;
var error_marker;

function pushTemp(callback){
  var content = btoa(editor.getValue()); // encode editor content

  $.ajax({
      url: '/tmp',
      data: { content: content },
      type: 'POST',
      success: callback,
      error: function(error) {
          console.log(error);
      }
  });
}

function undo_hook(){ console.log("undo pressed"); editor && editor.undo();}
function redo_hook(){ console.log("redo pressed"); editor && editor.redo();}

function parse_hook() {
  console.log("parse pressed");
  pushTemp(function(response){
    window.location.href = "/diagram?useParsed=True";
  });
}

function new_hook() {
  console.log("new pressed");
  editor && editor.setValue("");
  $.ajax("/resetCurrent");
}

function save_hook(){
  console.log("save pressed");
  pushTemp(function(response) {
    window.location.href = 'save'
  });
}

function saveAs_hook(){
  console.log("save as pressed");
  pushTemp(function(response) {
    window.location.href = 'saveAs'
  });
}
function open_hook() {
  console.log("open pressed");
  window.location.href = 'openFile';
}
function upload_hook() {
  console.log("open pressed");
  window.location.href = 'openFile';
}
function changeBindings(binding){
  var keyBindings = {
    ace: null,
    vim: "static/ace-master/lib/ace/keyboard/vim",
    emacs: "static/ace-master/lib/ace/keyboard/emacs"
  };
  editor.setKeyboardHandler(keyBindings[binding]);
}


function parse_reponse(pmlcheck_response) {
    var line_number_message = pmlcheck_response.slice(5, pmlcheck_response.length).split(":");

    return line_number_message;
}


function highlight_error(pmlcheck_response) {
    var line_number_message = parse_reponse(pmlcheck_response);
    var line_number = line_number_message[0];
    var error_message = line_number_message[1];

    var Range = require("static/ace-master/lib/ace/range").Range;
    var range = new Range(line_number-1, 0, line_number-1, 1);
    error_marker = editor.session.addMarker(range, "errorHighlight", "fullLine");

    editor.getSession().setAnnotations([{
        row: line_number-1,
        column: 0,
        text: error_message,
        type: "error" // also warning and information
    }]);

    console.log("highlighting");
}

function run_hook() {
    var program;
    require(['static/ace-master/lib/ace/ace'], function(ace){
        editor = ace.edit("editor");
        program = editor.getValue();
        document.getElementById("output").innerHTML = "Output";

        editor.session.removeMarker(error_marker);
        editor.session.clearAnnotations();

        $.ajax({
            url: '/',
            data: { program: program },
            type: 'POST',
            success: function(response) {
                document.getElementById("output").innerHTML = response;
                console.log(response);
            },
            error: function(error) {
                document.getElementById("output").innerHTML = error.responseText;
                console.log(error);
                highlight_error(error.responseText);
            }
        });
    });
}

function resizeAce(){
  var aceHeight = $(window).height() - ($('nav').height()+$('#output').outerHeight(true));
  return $('#editor').height(aceHeight);
}

$(function(){
  require(['static/ace-master/lib/ace/ace', 'static/ace-master/lib/ace/ext/language_tools'], function(ace){
      editor = ace.edit("editor");
      editor.setTheme("static/ace-master/lib/ace/theme/monokai");
      editor.getSession().setMode("static/ace-master/lib/ace/mode/pml");
      editor.setOptions({
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true
      });
      editor.resize();
  });

  $(window).resize(resizeAce);
  resizeAce();
});
