/*
	The Jet Propulsion Labratory has a lucid explanation of approximating planetary positions here: 
	http://ssd.jpl.nasa.gov/txt/aprx_pos_planets.pdf 
*/

var astronomy = require("../index");

module.exports = {};

var planets = module.exports.data = require("../data/planets.json"),
	// some extra elements from here http://pds.jpl.nasa.gov/planets/ (e.g. https://pds.jpl.nasa.gov/planets/special/earth.htm)
	planet_info = module.exports.info = require("../data/planet_info.json"),
	// add extra info for outer planets, per Step 2
	outer_planets = require("../data/outer_planets.json");

// convenience trig functions for degrees (Javascripts Math object is in radians)
var sin = function(a) { return Math.sin(a * Math.PI / 180); },
	cos = function(a) { return Math.cos(a * Math.PI / 180); };

// ORBIT CALCULATIONS
// Steps refer loosely to JPL pdf above

var planet_position = module.exports.position = function(planet_name, date) {
	var variables = ['a', 'e', 'I', 'L', 'w', 'node'];

	var julian = astronomy.dateToJulian(date), 
		T = (julian - 2451545) / 36525;

	var elements = {};

	// Step 1: Compute the values of each planet
	variables.forEach(function(v) {
		elements[v] = parseFloat(planets[planet_name][v]) + parseFloat(planets[planet_name][v + "_Cy"]) * T;
	});

	// Step 2: Compute the argument of the perihelion, w1, and the mean anomoly, M,
	// where the last three must be added to M for Jupiter through Pluto when using the formula for 3000BC to 3000AD
	// The capital Omega in the JPL document is the ascending `node`
	var w = elements.w - elements.node;
	var M = elements.L - elements.node;
	if (outer_planets[planet_name]) {
		var bcsf = outer_planets[planet_name];
		M += bcsf.b * T * T + bcsf.c * Math.cos(bcsf.f * T) + bcsf.s * Math.sin(bcsf.f * T);
	}

	// Step 3: Modulus the mean anomaly so that -180° ≤ M ≤ +180° and then obtain the eccentric anomaly, E, from the Solution of Kepler's equation
	// convert e to degrees
	var e_star = elements.e * 180 / Math.PI;
	var E = M * e_star * sin(M);
	do {
		deltaM = M - (E - e_star * sin(E));
		deltaE = deltaM / (1 - elements.e * cos(E));
		E += deltaE;
	} while (Math.abs(deltaE) > Math.pow(10, -6));

	// step 4
	var xp = elements.a * (astronomy.cos(E) - elements.e),
		yp = elements.a * Math.sqrt(1 - elements.e * elements.e) * astronomy.sin(E),
		zp = 0;

	// step 5
	var xecl = (cos(elements.w) * cos(elements.node) - sin(elements.w) * sin(elements.node) * cos(elements.I)) * xp + (-sin(elements.w) * cos(elements.node) - cos(elements.w) * sin(elements.node) * cos(elements.I)) * yp,
		yecl = (cos(elements.w) * sin(elements.node) + sin(elements.w) * cos(elements.node) * cos(elements.I)) * xp + (-sin(elements.w) * sin(elements.node) + cos(elements.w) * cos(elements.node) * cos(elements.I)) * yp,
		zecl = sin(elements.w) * sin(elements.I) * xp + cos(elements.w) * sin(elements.I) * yp;

	return {
		xp: xp,
		yp: yp,
		zp: zp,
		xecl: xecl,
		yecl: yecl,
		zecl: zecl
	}
}

function dateFromDay(year, day) {
	var date = new Date(year, 0); // initialize a date in `year-01-01`
	return new Date(date.setDate(day));
}

// main planetary object
// interval is number of days in each step
var planet = module.exports.planet = function(planet_name, interval) {
	var info = planet_info[planet_name],
		positions = [];

	// number of points to include in orbit
	var steps = Math.ceil(info.orbital_period / interval) + 1;

	// mercury looks choppy around apohelion on 3-day intervals
	// if (steps < 100) {
	// 	steps *= 2;
	// 	interval = 0.5;
	// }

	// get points for drawing orbit. Using 2015. If this will be used for years far from then, consider changing this to allow for perturbance
	for (var step = 0; step < steps; step += 1) {
		var date = dateFromDay(2017, 3 * step * interval);
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
