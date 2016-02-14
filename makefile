.PHONY: build test install verify clean distclean buildDeps run

all: run

build: buildDeps

test: #TODO
	:

install: buildDeps
	virtualenv env
	env/bin/pip3 install Flask
	sudo apt-get install bison
	sudo apt-get install check
	sudo apt-get install flex
	sudo apt-get install libncurses5-dev
	git clone https://github.com/jnoll/peos.git
	cd peos/pml/
	make
	mv check/pmlcheck ../../../
	# stack install purescript

verify: #TODO
	:

clean:
	-rm -rf env

distclean: clean

buildDeps:
	hash pip3 2>/dev/null || sudo apt-get install python3-pip
	# hash stack 2>/dev/null || sudo apt-get install stack
	hash virtualenv 2>/dev/null || sudo pip3 install virtualenv

run:
	./start.sh
