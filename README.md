node-astronomy
==============

Calculate 3D orbits of planets and comets given orbital elements

This Javascript code is fronting as a Node module, but is really meant to be loaded into a browser environment using [Browserify](http://browserify.org/)

###Installation

	git clone https://github.com/TimeMagazine/node-astronomy.git
	cd node-astronomy
	npm install

###The data

The orbital info for the [planets](http://ssd.jpl.nasa.gov/txt/p_elem_t1.txt) and the [comets](http://ssd.jpl.nasa.gov/dat/ELEMENTS.COMET) come from JPL. We've already converted these fixed-width tables into JSON files found at `data/planets.json` and `data/comets.json`. If you want to rebuild these files to make sure they're current, run the followed commands:

	./update_comets_and_planets.js planets
	./update_comets_and_planets.js planets --pluto #if you want poor Pluto
	./update_comets_and_planets.js comets

This will overwrite the files from the repo with the most recent data from JPL, though for planets it does not appear to change often.

###Usage

