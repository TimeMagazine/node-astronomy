// Given the major orbital elements, calculate the three-dimensional orbits for planets and comets
// The Jet Propulsion Labratory has a lucid explanation of approximating planetary positions here: 
// http://ssd.jpl.nasa.gov/txt/aprx_pos_planets.pdf 
// The mathematics for comet positions, which differs depending on eccentricity, is gratefully borrowed from the free and open-source Orbit Viewer by Osamu Ajiki and Ron Baalke
// http://www.astroarts.com/products/orbitviewer/#LICENCE

// DATA
// Planets: http://ssd.jpl.nasa.gov/txt/p_elem_t1.txt
// Comets: http://ssd.jpl.nasa.gov/dat/ELEMENTS.COMET

module.exports = {};

var planets = module.exports.planets = {},
	comets = module.exports.comets = {};

require("./planets.json").forEach(function(planet) {
	planets[planet.name] = planet;
});

require("./comets.json").forEach(function(comet) {
	// name e.g. "1P/Halley" or "C/2012 S1 (ISON)"
	comet.label = /\((.*)\)/.exec(comet.name);
	comet.label = comet.label ? comet.label[1] : comet.name.split("/")[1];
	comet.label += " (" + comet.tp.slice(0,4) + ")";

	// convert the date of perihelion to Javascript date
	//comet.closest = new Date(comet.tp.slice(0, 4), comet.tp.slice(4,6)-1, parseFloat(comet.tp.slice(6)-1));
	comet.closest = new Date(parseInt(comet.tp.slice(0, 4)), parseInt(comet.tp.slice(4,6), 10)-1, parseFloat(comet.tp.slice(6,8)), 24 * parseFloat(comet.tp.slice(8)));

	comets[comet.label] = comet;
});

// CONVENIENCE FUNCTIONS

var getJulian = module.exports.dateToFJulian = function(date) {
    return Math.floor((date / 86400000) - (date.getTimezoneOffset()/1440) + 2440587.5);
}

// convenience trig functions for degrees (Javascripts Math object is in radians)

var sin = function(a) { return Math.sin(a * Math.PI / 180); },
	cos = function(a) { return Math.cos(a * Math.PI / 180); };

// convert a body's heliocentric coordinates to J2000 coordinates (see step 5 of JPL document)
function ecliptic(data, xp, yp, zp) {
	var xecl = (cos(data.w) * cos(data.node) - sin(data.w) * sin(data.node) * cos(data.I)) * xp + (-sin(data.w) * cos(data.node) - cos(data.w) * sin(data.node) * cos(data.I)) * yp,
		yecl = (cos(data.w) * sin(data.node) + sin(data.w) * cos(data.node) * cos(data.I)) * xp + (-sin(data.w) * sin(data.node) + cos(data.w) * cos(data.node) * cos(data.I)) * yp,
		zecl = sin(data.w) * sin(data.I) * xp + cos(data.w) * sin(data.I) * yp;

	return [xecl, yecl, -zecl];
}

function dateFromDay(year, day){
	var date = new Date(year, 0); // initialize a date in `year-01-01`
	return new Date(date.setDate(day));
}


// ORBIT CALCULATIONS
// Steps refer loosely to JPL pdf
var planet_position = module.exports.planet_position = function(planet_name, date) {
	var variables = ['a', 'e', 'I', 'L', 'w', 'node'];

	var julian = getJulian(date), 
		T = (julian - 2451545) / 36525;

	var data = {};

	// Step 1
	variables.forEach(function(v) {
		data[v] = parseFloat(planets[planet_name][v]) + parseFloat(planets[planet_name + "_Cy"][v]) * T;
	});

	// Steps 2 + 3
	var E = M = oldE = data.L - (data.w + data.node);
	var e_star = data.e * 180 / Math.PI;
	do {
		oldE = E;
		E = M + e_star * sin(oldE);
		//console.log(oldE, E);
	} while (Math.abs(E - oldE) > 1/10000 * 180.0 / Math.PI);

	// step 4
	var xp = data.a * (cos(E) - data.e),
		yp = data.a * Math.sqrt(1 - data.e * data.e) * sin(E),
		zp = 0;

	return {
		ecliptic: ecliptic(data, xp, yp, zp),
		data: data
	}
}

// some extra data from here http://pds.jpl.nasa.gov/planets/

var planet_info = require("./planet_info.json"),
	one_day = 1000 * 60 * 60 * 24;


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

	// get points for drawing orbit. Using 2013. If this will be used for years far from then, consider changing this to allow for perturbance
	for (var step = 0; step < steps; step += 1) {
		var date = dateFromDay(2013, 3 * step * interval);
		positions.push({
			date: date,
			key: planet_name,
			position: planet_position(planet_name, date)
		});
	}

	return {
		key: planet_name,
		info: info,
		positions: positions
	}
}

var comet_position = module.exports.comet_position = function(comet_name, date) {
	var variables = ['q', 'e', 'I', 'w', 'node'],
		TOLERANCE = 1 / 100000000000,
		MAXAPPROX = 180;
		GAUSS  = 0.01720209895;
		nCount = MAXAPPROX;

	var data = {};
	variables.forEach(function(v) {
		data[v] = parseFloat(comets[comet_name][v]);
	});
	data.epoch = parseInt(comets[comet_name].epoch, 10);
	data.closest = comets[comet_name].closest;

	// ported directly from Orbit Viewer Java code
	function CometStatusNearPara() {
		if (data.q == 0) {
			console.log(comet_name, "ERROR");
			return false;
		}
		data.a = Math.sqrt((1.0 + 9.0 * data.e) / 10.0);
		data.b = 5.0 * (1 - data.e) / (1.0 + 9.0 * data.e);
		var fA1, fB1, fX1, fA0, fB0, fX0, fN;
		fA1 = fB1 = fX1 = 1.0;
		var nCount1 = MAXAPPROX;
		do {
			fA0 = fA1;
			fB0 = fB1;
			fN = fB0 * data.a * GAUSS * (getJulian(date) - getJulian(data.closest)) / (Math.sqrt(2.0) * data.q * Math.sqrt(data.q));
			var nCount2 = MAXAPPROX;
			do {
				fX0 = fX1;
				var fTmp = fX0 * fX0;
				fX1 = (fTmp * fX0 * 2.0 / 3.0 + fN) / (1.0 + fTmp);
			} while (Math.abs(fX1 - fX0) > TOLERANCE && --nCount2 > 0);
			if (nCount2 == 0) {
				console.log(comet_name, "ERROR");
				return false;
			}
			fA1 = data.b * fX1 * fX1;
			fB1 = (-3.809524e-03 * fA1 - 0.017142857) * fA1 * fA1 + 1.0;
		} while (Math.abs(fA1 - fA0) > TOLERANCE && --nCount1 > 0);
		if (nCount1 == 0) {
			console.log(comet_name, "ERROR");
			return false;
		}
		var fC1 = ((0.12495238 * fA1 + 0.21714286) * fA1 + 0.4) * fA1 + 1.0;
		var fD1 = ((0.00571429 * fA1 + 0.2       ) * fA1 - 1.0) * fA1 + 1.0;
		var fTanV2 = Math.sqrt(5.0 * (1.0 + data.e) / (1.0 + 9.0 * data.e)) * fC1 * fX1;
		var x = data.q * fD1 * (1.0 - fTanV2 * fTanV2);
		var y = 2.0 * data.q * fD1 * fTanV2;
		//console.log(x, y);
		return {
			ecliptic: ecliptic(data, x, y, 0),
			data: data
		}
	}


	function CometStatusPara() {
		var N = GAUSS * (getJulian(date) - getJulian(data.closest)) / (Math.sqrt(2.0) * data.q * Math.sqrt(data.q)),
			TanV2 = N,
			OldTanV2,
			Tan2V2;

		do {
			OldTanV2 = TanV2;
			Tan2V2 = TanV2 * TanV2;
			TanV2 = (Tan2V2 * TanV2 * 2.0 / 3.0 + N) / (1.0 + Tan2V2);
		} while (Math.abs(TanV2 - OldTanV2) > TOLERANCE && --nCount > 0);

		if (nCount == 0) {
			console.log(comet_name, "ERROR");
			return false;
		}
		Tan2V2 = TanV2 * TanV2;
		var x = data.q * (1.0 - Tan2V2),
			y = 2.0 * data.q * TanV2;

		return {
			ecliptic: ecliptic(data, x, y, 0),
			data: data
		}
	}

	function CometStatusEllip() {
		data.a = data.q / (1 - data.e); // AU
		data.P = Math.pow(data.a, 1.5) * 365.2568984; // days
		data.t = getJulian(date) - getJulian(data.closest);

		var M = 360 * data.t / data.p;


		var M = GAUSS * data.t / (Math.sqrt(data.a) * data.a),
			E1 = M + data.e * Math.sin(M);

		if (data.e < 0.6) {
			var E2;
			do {
				E2 = E1;
				E1 = M + data.e * Math.sin(E2);
			} while (Math.abs(E1 - E2) > TOLERANCE && --nCount > 0);
		} else {
			var Dv;
			do {
				var Dv1 = (M + data.e * Math.sin(E1) - E1),
					Dv2 = (1.0 - data.e * Math.cos(E1));
				if (Math.abs(Dv1) < TOLERANCE || Math.abs(Dv2) < TOLERANCE) {
					break;
				}
				Dv = Dv1 / Dv2;
				E1 += Dv;
			} while (Math.abs(Dv) > TOLERANCE && --nCount > 0);
		}
		if (nCount == 0) {
			console.log(comet_name, "ERROR");
			return false;
		}

		var x = data.a * (Math.cos(E1) - data.e),
			y = data.a * Math.sqrt(1.0 - data.e * data.e) * Math.sin(E1);

		return {
			ecliptic: ecliptic(data, x, y, 0),
			data: data
		}
	}

	if (data.e < 0.98) {
		return CometStatusEllip();
	} else if (data.e == 1) {
		return CometStatusPara();			
	} else if (Math.abs(data.e - 1.0) <= 0.2) {
		return CometStatusNearPara();
	} else {
		return CometStatusPara();
	}
}

function stepFunction(x) {
	return Math.pow(x/4, 3);
}

// main comet object
var comet = module.exports.comet = function(comet_name) {
	var positions = [];

	var steps = Math.round(100 * Math.pow(parseFloat(comets[comet_name].e), 2));

	// see if we hit problems
	var failure = false;

	var previous = null,
		angle = null;

	for (var step = 0; step < steps; step += 1) {
		var steps_from_center = steps/2 - step,
			days_from_center = stepFunction(steps_from_center);

		var date = new Date(comets[comet_name].closest - days_from_center * one_day);

		positions.push({
			date: date,
			position: comet_position(comet_name, date)
		});
	}

	return {
		key: comet_name,
		comet_id: comet_name.replace("(", "").replace(")", "").replace(/ /g, "_"),
		closest: comets[comet_name].closest,
		positions: positions
	}
}




