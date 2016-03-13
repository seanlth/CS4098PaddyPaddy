.PHONY: build test install verify clean distclean buildDeps run

all: run

build: buildDeps

test:
	env/bin/python3 src/tests.py

install: buildDeps
	git submodule init
	git submodule update
	virtualenv env
	env/bin/pip3 install Flask
	env/bin/pip3 install SQLAlchemy
	sudo apt-get install libncurses5-dev
	cd peos/pml/ && make && \
	mv check/pmlcheck ../../
	chmod u+x start.sh
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
	hash bison 2>/dev/null || sudo apt-get install bison
	hash check 2>/dev/null || sudo apt-get install check
	hash flex 2>/dev/null || sudo apt-get install flex

run:
	./start.sh
