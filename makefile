.PHONY: all build test install verify clean distclean

all:
# ./start.sh

build: buildDeps

test: #TODO
	:

install: buildDeps
	virtualenv env
	sudo pip3 install Flask
	# stack install purescript

verify: #TODO
	:

clean:
	-rm -rf env

distclean: clean

buildDeps:
	hash pip3 2>/dev/null || sudo apt-get install python3-pip
	# hash stack 2>/dev/null || sudo apt-get install stack
	sudo pip3 install virtualenv
