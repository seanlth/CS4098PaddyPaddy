.PHONY: build test install verify clean distclean buildDeps run

all: run

build: buildDeps

test: env
	env/bin/python3 src/tests.py

install: buildDeps
	git submodule init
	git submodule update
	virtualenv -p /usr/bin/python3 env
	env/bin/pip3 install Flask
	env/bin/pip3 install Flask-SQLAlchemy
	env/bin/pip3 install Flask-OAuth
	env/bin/pip3 install rauth
	sudo apt-get install libncurses5-dev
	cd peos/pml/ && make && \
	mv check/pmlcheck ../../
	chmod u+x start.sh
	mkdir -p userFiles

verify:
	[ -e pmlcheck ]
	[ -e env/bin/pip3 ]
	[ -e env/bin/python3 ]

clean:
	-rm -rf env
	-rm -rf userFiles

distclean: clean

buildDeps:
	hash pip3 2>/dev/null || sudo apt-get install python3-pip
	hash virtualenv 2>/dev/null || sudo pip3 install virtualenv
	hash bison 2>/dev/null || sudo apt-get install bison
	hash flex 2>/dev/null || sudo apt-get install flex
	[ -e /usr/include/check.h ] || sudo apt-get install check

env: install

run:
	./start.sh
