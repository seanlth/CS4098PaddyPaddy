function save_generated_pml(pml, callback){
    var content = btoa(pml); // encode editor content
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

function add_requirements(requirements, current_indentation) {
    if ( requirements != "" ) {
	    var requirements_string = current_indentation + "requires { \n";
        requirements_string += current_indentation + "    " + requirements + "\n";
        requirements_string += current_indentation + "}";
    
        return requirements_string;
    }
    return "";
}

function add_provisions(provides, current_indentation) {
    if ( provides != "" ) {
	    var provides_string = current_indentation + "provides { \n";
        provides_string += current_indentation + "    " + provides + "\n";
        provides_string += current_indentation + "}";

        return provides_string;
    } 
    return "";
}

// builds the action string
function add_action(action, current_indentation) {
	node = current_indentation + "action " + action.name + " { \n";
	node += add_requirements(action.requires, current_indentation + "    ") + "\n";
	node += add_provisions(action.provides, current_indentation + "    ") + "\n"; 
	node += current_indentation + "}";
	
	return node;
}

// returns a single primative
function add_primitive(primitive, current_indentation) {
	var primitive_string = "";
    
    // a control structure
	if ( primitive.hasOwnProperty('control') ) {
		primitive_string = current_indentation + primitive.control + " { \n";
		primative_string += add_primitives(primitive.actions, current_indentation + "    ") + "\n";
		primitive_string += current_indentation + "}";
	}
	else { // an action
		primitive_string = add_action(primitive, current_indentation);	
	}

	return primitive_string;
}

// adds branches, actions, iterations, sequences
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
    
    var content = btoa(PML_code) // encode content
    save_generated_pml(content, function(response) {  } );     

	return PML_code;
}
