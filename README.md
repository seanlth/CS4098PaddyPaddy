# Web-based IDE for Process Modeling Language


## Group
* Seán Hargadon
* Jasmine Talukder
* Paddy Healy
* Patrick Hayes
* Luke Grehan

## Dependencies
* Python 3.0
* Flask 0.10.1
* Ubuntu 14.04
* Ace editor (https://github.com/ajaxorg/ace, included)

## Installation - from Git repository
```
git clone https://github.com/seanlth/CS4098.git
cd CS4098
make install
```
## Installation - from zip repository
```
download zip from https://github.com/seanlth/CS4098.git
edit makefile to remove lines "git submodule init" and "git submodule update" and replace with "git clone https://github.com/jnoll/peos.git"
cd CS4098
make install
```
## Starting

```
make run
```

Open ```0.0.0.0:8000``` in a browser for PML roundtrip
Open ```0.0.0.0:8000/ace``` in a browser for code editor prototype
