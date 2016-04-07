/*
TODO:
- finished func
- resize fields
- better error messages
- refactor
*/

$(function() {
  $('#finished').on("click", function() {
    updateCurrent();
  });

  function updateCurrent(){
    var curr = getCurrent();
    $('#current_pred').html(curr);
  }

  function getCurrent(){
    var res = ""
    var success = true;

    function isValidVal(v){
      return /^([a-zA-Z_][a-zA-Z_0-9]*)|(\".*\")|(\'.*\')|[0-9]+$/.test(v);
    }

    function getConjunct(base){
      base.children('input').removeClass('invalid');

      var base_inp = base.children('.base');
      var val = base_inp.val();
      if (isValidVal(val)){
        res += base_inp.val();
      } else {
        alert("base fail");
        base_inp.addClass('invalid');
        success = false;
      }

      var base_inp_postDot = base_inp.siblings('.postDot').eq(0);
      if (base_inp_postDot.length > 0){
        val = base_inp_postDot.children().val();
        if (isValidVal(val)){
          res += "." + val
        } else {
          alert("pdot fail");
          base_inp_postDot.children().addClass('invalid');
          success = false;
        }
      }

      var postOp = base.children('.postOp');
      if (postOp.length > 0){
        val = postOp.children().val();
        if (isValidVal(val)){
          res += " == " + val;
        } else {
          alert("postOp fail");
          postOp.children().addClass('invalid');
          success = false;
        }
      }

      var postOp_postDot = postOp.children('.postDot');
      if (postOp_postDot.length > 0){
        val = postOp_postDot.children().val();
        if (isValidVal(val)){
          res += "." + val;
        } else {
          alert("pdot_pop fail");
          postOp_postDot.children().addClass('invalid');
          success = false;
        }
      }
    }

    getConjunct( $('#base_conjunct') );

    $('.conjunct').each(function() {
      var conj = $(this);
      res += " " + conj.children('.operator').val() + " "
      getConjunct(conj);
    });

    if (res == "" || !success) res = "&lt;None&gt;";
    return res;
  }

  function onAddDotClick(button){
    var conjunct = button.parent();
    var hasDot = conjunct.hasClass('hasDot');
    conjunct.toggleClass('hasDot');

    if (hasDot) {
      button.siblings('.postDot').remove();
    } else {
      button.after( $('<span class="postDot"><input class="postDotBase"/></span>') );
    }
  }

  function onAddOpClick(button){
    var postOp = $('<span class="postOp">');
    var inp = $('<input class="postOpBase"/>');

    var addDot = $('<button class="addDot">+.</button>');
    addDot.on("click", function() { onAddDotClick(addDot); });

    postOp.append([inp, addDot]);
    button.after(postOp);
    button.css('visibility', 'hidden');

    var selector = button.siblings('.comparison');
    selector.css('visibility', 'visible');
    selector.val("==");

  }

  function onOpChange(selector){
    if (selector.val() == "None"){
      selector.siblings('.postOp').remove();
      selector.css('visibility', 'hidden');
      selector.siblings('.addOp').css('visibility', 'visible');
    }
  }

  function mkConjunct(){
    var base = $('<div class="conjunct">');

    var op = $('<select class="operator"><option>&&</option><option>||</option></select>');
    op.val("&&");

    var addDot = $('<button class="addDot">+.</button>');
    addDot.on("click", function() { onAddDotClick(addDot); });

    var addOp = $('<button class="addOp">+op</button>');
    addOp.on("click", function() { onAddOpClick(addOp); });

    var comp = $('<select class="comparison">\
                          <option>None</option>\
                          <option>==</option>\
                          <option>!=</option>\
                          <option>&lt;</option>\
                          <option>&gt;</option>\
                          <option>&gt;=</option>\
                          <option>&lt;=</option>\
                        </select>');
    comp.on("change", function(){ onOpChange(comp); });
    comp.val("==");
    comp.css('visibility', 'hidden');

    var close = $('<button class="close">X</button>');
    close.on("click", function() { base.remove(); });

    base.append([ op
                , $('<input class="base"/>')
                , addDot
                , comp
                , addOp
                , close
                ]);
    return base;
  }

  $('#adder').on("click", function() {
    var conj = mkConjunct();
    $('#form').append(conj);
  });

  $('#base_addDot').on("click", function(){ onAddDotClick($(this)); });
  $('#base_addOp').on("click",  function(){ onAddOpClick($(this)); });
  $('#base_operator').on("change", function(){ onOpChange($(this)); });
  $('.comparison').css('visibility', 'hidden');
  //var updateTimer = setInterval(updateCurrent, 2000);
});
