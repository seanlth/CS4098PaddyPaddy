/*
TODO:
- better error messages
*/

function predicate_to_string(pred){
  var res = "";
  if (pred !== ""){
    for (var i in pred){
      var rel_op = pred[i];

      if (rel_op.hasOwnProperty('conj_op')){
        res += " " + rel_op['conj_op'] + " ";
      }

      var lhs = rel_op['lhs'];
      res += lhs['core'];
      if (lhs.hasOwnProperty('postDot')){
        res += "." + lhs['postDot'];
      }

      if (rel_op.hasOwnProperty('rhs')){
        var rhs = rel_op['rhs'];
        res += " " + rel_op['op'] + " ";
        res += rhs['core'];
        if (rhs.hasOwnProperty('postDot')){
          res += "." + rhs['postDot'];
        }
      }
    }
  }

  return res;
}

function openPredicateEditor(pred, finished){
  var predEd = $('#predicateEditor');

  predEd.show(0, function(){
    setPredicate(pred);
    $('#current_pred').html(predicate_to_string(pred));
  });

  var finishedButton = $('#finished');
  finishedButton.off('click');
  finishedButton.on('click', function(e){
    e.preventDefault();
    var current = getCurrent();
    if (current.length>0){
      predEd.hide();
      finished(current);
    }
  });
}


function updateCurrent(){
  var curr = getCurrent();
  $('#current_pred').html(predicate_to_string(curr));
}

function setPredicate(pred){
  var base = $('#base_conjunct')
  base.find('.base').val("");
  base.find('.postDot').remove();
  base.find('.postOp').remove();
  $('.hasDot').removeClass('hasDot');

  var selector = base.children('.comparison');
  selector.css('visibility', 'hidden');
  selector.siblings('.addOp').css('visibility', 'visible');

  $('#form').empty();

  for(var i in pred){
    var elem;
    var conj = pred[i];

    if(i == 0){
      elem = base;
    } else {
      elem = mkConjunct();
      elem.find('.operator').val(conj.conj_op);
      $('#form').append(elem);
    }

    // set lhs
    elem.children('.base').val(conj.lhs.core);
    if (conj.lhs.hasOwnProperty('postDot')){
      onAddDotClick( elem.children('.addDot') );

      elem.find('.postDotBase').val(conj.lhs.postDot);
    }

    // set rhs
    if(conj.hasOwnProperty('rhs')){
      onAddOpClick( elem.children('.addOp') );

      // set op
      elem.find('.postOpBase').val(conj.rhs.core);
      elem.find('.comparison').val(conj.op);

      if (conj.rhs.hasOwnProperty('postDot')){
        onAddDotClick(elem.find('.postOp .addDot'));
        elem.find('.postOp .postDotBase').val(conj.rhs.postDot);
      }
    }
  }
}

function isValidVal(v){
  var baseReg = /^(([a-zA-Z_][a-zA-Z_0-9]*)|(\".*\")|(\'.*\')|[0-9]+)$/;
  var keywordReg = /(script)|(process)|(select(ion)?)|(sequence)|(iteration)|(branch)|(action)|(manual)|(executable)|(requires)|(provides)|(tool)|(agent)/;
  return baseReg.test(v) && !keywordReg.test(v)
}

function getCurrent(){
  var success = true;

  function getConjunct(base){
    base.children('input').removeClass('invalid');
    var conj = {};

    var lhs = {};

    var base_inp = base.children('.base');
    var val = base_inp.val();
    if (isValidVal(val)){
      lhs.core = base_inp.val();
    } else {
      alert("base fail");
      base_inp.addClass('invalid');
      success = false;
    }

    var base_inp_postDot = base_inp.siblings('.postDot').eq(0);
    if (base_inp_postDot.length > 0){
      val = base_inp_postDot.children().val();
      if (isValidVal(val)){
        lhs.postDot = val;
      } else {
        alert("pdot fail");
        base_inp_postDot.children().addClass('invalid');
        success = false;
      }
    }

    conj.lhs = lhs;

    var postOp = base.children('.postOp');
    if (postOp.length > 0){
      var rhs = {};
      val = postOp.children().val();
      if (isValidVal(val)){
        conj.op = postOp.siblings('.comparison').val();
        rhs.core = val;
      } else {
        alert("postOp fail");
        postOp.children().addClass('invalid');
        success = false;
      }

      var postOp_postDot = postOp.children('.postDot');
      if (postOp_postDot.length > 0){
        val = postOp_postDot.children().val();
        if (isValidVal(val)){
          rhs.postDot = val;
        } else {
          alert("pdot_pop fail");
          postOp_postDot.children().addClass('invalid');
          success = false;
        }
      }

      conj.rhs = rhs;
    }

    return conj;
  }

  var res = [ getConjunct( $('#base_conjunct') ) ];

  $('.conjunct').each(function() {
    var op = $(this).children('.operator').val();
    var conj = getConjunct($(this));
    conj['conj_op'] = op;
    res.push(conj);
  });

  if (res == [] || !success) res = [];
  return res;
}

function onAddDotClick(button){
  var conjunct = button.parent();
  var hasDot = conjunct.hasClass('hasDot');
  conjunct.toggleClass('hasDot');

  if (hasDot) {
    button.siblings('.postDot').remove();
  } else {
    button.after( $('<span class="postDot"><input type="text" class="postDotBase"/></span>') );
  }
}

function onAddOpClick(button){
  var postOp = $('<span class="postOp">');
  var inp = $('<input type="text" class="postOpBase"/>');

  var addDot = $('<button class="addDot">+.</button>');
  addDot.on("click", function(e) {
    e.preventDefault();
    onAddDotClick(addDot);
  });

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
  addDot.on("click", function(e) {
    e.preventDefault();
    onAddDotClick(addDot);
  });

  var addOp = $('<button class="addOp">+op</button>');
  addOp.on("click", function(e) {
    e.preventDefault();
    onAddOpClick(addOp);
  });

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
  close.on("click", function(e) {
    e.preventDefault();
    base.remove();
  });

  base.append([ op
              , $('<input type="text" class="base"/>')
              , addDot
              , comp
              , addOp
              , close
              ]);
  return base;
}

function editAgent(){
  openPredicateEditor(selectedAction.agent, function(curr){
    $('#agent').html(predicate_to_string(curr));
    selectedAction.agent = curr;
  });
}

function editRequires(){
  openPredicateEditor(selectedAction.requires, function(curr){
    $('#requires').html(predicate_to_string(curr));
    selectedAction.requires = curr;
  });
}

function editProvides(){
  openPredicateEditor(selectedAction.provides, function(curr){
    $('#provides').html(predicate_to_string(curr));
    selectedAction.provides = curr;
  });
}

function exitPredicateEditor(){
  $('#predicateEditor').hide();
}


$(function() {
  $('#adder').on("click", function(e) {
    e.preventDefault();
    var conj = mkConjunct();
    $('#form').append(conj);
  });

  $('#base_addDot').on("click", function(e){
    e.preventDefault();
    onAddDotClick($(this));
  });

  $('#base_addOp').on("click",  function(e){
    e.preventDefault();
    onAddOpClick($(this));
  });

  $('#base_operator').on("change", function(){ onOpChange($(this)); });
  $('.comparison').css('visibility', 'hidden');
  // var updateTimer = setInterval(updateCurrent, 5000);
});
