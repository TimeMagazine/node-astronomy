// http://ssd.jpl.nasa.gov/txt/aprx_pos_planets.pdf 

var astronomy = require("../index");

module.exports = {};

var planets = module.exports.data = require("../data/planets.json"),
	// some extra elements from here http://pds.jpl.nasa.gov/planets/
	planet_info 	= module.exports.info = require("../data/planet_info.json");

// ORBIT CALCULATIONS
// Steps refer loosely to JPL pdf
// http://ssd.jpl.nasa.gov/txt/aprx_pos_planets.pdf 

var planet_position = module.exports.position = function(planet_name, date) {
	var variables = ['a', 'e', 'I', 'L', 'w', 'node'];

	var julian = astronomy.dateToJulian(date), 
		T = (julian - 2451545) / 36525;

	var elements = {};

	// Step 1
	variables.forEach(function(v) {
		elements[v] = parseFloat(planets[planet_name][v]) + parseFloat(planets[planet_name + "_Cy"][v]) * T;
	});

	// Steps 2 + 3
	var E = M = oldE = elements.L - (elements.w + elements.node);
	var e_star = elements.e * 180 / Math.PI;
	do {
		oldE = E;
		E = M + e_star * astronomy.sin(oldE);
		//console.log(oldE, E);
	} while (Math.abs(E - oldE) > 1/10000 * 180.0 / Math.PI);

	// step 4
	var xp = elements.a * (astronomy.cos(E) - elements.e),
		yp = elements.a * Math.sqrt(1 - elements.e * elements.e) * astronomy.sin(E),
		zp = 0;

	return {
		ecliptic: astronomy.ecliptic(elements, xp, yp, zp)
	}
}

function dateFromDay(year, day) {
	var date = new Date(year, 0); // initialize a date in `year-01-01`
	return new Date(date.setDate(day));
}

// main planetary object
var planet = module.exports.planet = function(planet_name) {
	var info = planet_info[planet_name],
		positions = [];

	// number of points to include in orbit
	var steps = Math.ceil(info.orbital_period / 3) + 1,
		interval = 1;

	// mercury looks choppy around apohelion on 3-day intervals
	if (steps < 100) {
		steps *= 2;
		interval = 0.5;
	}

	// get points for drawing orbit. Using 2015. If this will be used for years far from then, consider changing this to allow for perturbance
	for (var step = 0; step < steps; step += 1) {
		var date = dateFromDay(2015, 3 * step * interval);
		positions.push({
			date: date,
			position: planet_position(planet_name, date)
		});
	}

	return {
		key: planet_name,
		info: info,
		positions: positions
	}
}
