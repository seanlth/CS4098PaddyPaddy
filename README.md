# Web-based IDE for Process Modeling Language


## Group
* Seán Hargadon
* Jasmine Talukder
* Paddy Healy
* Patrick Hayes
* Luke Grehan


## Features
* On ```0.0.0.0:8000```
  * Syntax Highlighting
  * Code editor
  * Keybinding Emulation
  * Code Completion
  * Syntax Analysis
  * Error Highlighting
  * File Save (must be logged in)
  * File Upload(must be logged in)
  * File Open (must be logged in)
* On ```0.0.0.0:8000/login``` and ```0.0.0.0:8000/signup```
  * Email Authentification
* On ```0.0.0.0:8000/diagram```
  * Boxes and Arrows
  * Scripts
  * Resouces (simple)
  * Agents (simple)
  * PML Generation

##Testing Instructions:
1. For many of the features available on ```0.0.0.0:8000``` testing can be donw without signing in, Syntax highlighting  
   and code completion are automaticically available with the latter being activated by pressing Tab or Enter while the  
   popup is displayed. Keybinding emulation is selectable by using the Binding drop-down at the top of the page.  
   File save, upload and open are all available under the File drop-down and you may be prompted to sign in if you have  
   not done so.

2. Email authentication may be tested on either of pages listed /signup to create an account and /login to access it later.  
   There are also links to /login on the main editor page.

3. Boxes and arrows can be tested on ```0.0.0.0:8000```. Clicking on a (+) node allows you to add an action, branch,  
   selection or iteration. For any of these except iteration, you have the option of clicking a bright green node,  
   folding all the actions in between into the control structure or choosing the dark green node you already clicked  
   on, creaating a control structure with one new node. Red (+) nodes are invalid selections. You can change the names  
   of these control structures with the [...] displayed beside the name which will create a prompt. The various parameters  
   of an action can be altered using a form displayed when you click on one. The generate PML button will open a new  
   tab/window with the editor open to PML generated based on your graph.

## Dependencies
* Ubuntu 14.04

## Included/Installed Requirements
* Python 3.0
* Flask 0.10.1
* Ace editor (https://github.com/ajaxorg/ace)

## Installation
```
git clone https://github.com/seanlth/CS4098.git
cd CS4098
make install
```
## Starting

```
make run
```

* Open ```0.0.0.0:8000``` in a browser for editor
* Open ```0.0.0.0:8000/login``` in a browser for login page
* Open ```0.0.0.0:8000/signUp``` in a browser for sign up page
* Open ```0.0.0.0:8000/diagram``` in a browser for the in-progress diagram page
