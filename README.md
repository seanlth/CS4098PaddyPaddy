# Web-based IDE for Process Modeling Language


## Group
* Seán Hargadon
* Jasmine Talukder
* Paddy Healy
* Patrick Hayes
* Luke Grehan


## Features
* Testable on ```0.0.0.0:8000```:
* Syntax Highlighting
* Code editor
* Keybinding Emulation
* Code Completion
* Syntax Analysis (test by running code)
* Error Highlighting (same as above, with errors)

* Email Authentification (Create login on ```0.0.0.0:8000/signUp```, using those credentials on ```0.0.0.0:8000/login``` will indicate success)

* File Save (Sign in using email and click file in editor, currently there is a bug on large files)
* File Open (Sign in using email and click open in editor)

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

Open ```0.0.0.0:8000``` in a browser for editor
Open ```0.0.0.0:8000/login``` in a browser for login page
Open ```0.0.0.0:8000/signUp``` in a browser for sign up page
