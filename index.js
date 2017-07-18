/*
	Given the major orbital elements, calculate the three-dimensional orbits for planets and comets
	The Jet Propulsion Labratory has a lucid explanation of approximating planetary positions here: 
	http://ssd.jpl.nasa.gov/txt/aprx_pos_planets.pdf 

	The mathematics for comet positions, which differs depending on eccentricity, is gratefully borrowed 
	from the free and open-source Orbit Viewer by Osamu Ajiki and Ron Baalke
	http://www.astroarts.com/products/orbitviewer/#LICENCE

	DATA
	Planets: http://ssd.jpl.nasa.gov/txt/p_elem_t1.txt
	Comets: http://ssd.jpl.nasa.gov/dat/ELEMENTS.COMET
*/


// convenience trig functions for degrees (Javascripts Math object is in radians)
var sin = function(a) { return Math.sin(a * Math.PI / 180); },
	cos = function(a) { return Math.cos(a * Math.PI / 180); };

module.exports = {
	sin: sin,
	cos: cos,

	// check against https://ssd.jpl.nasa.gov/tc.cgi#top
	dateToJulian: function(date) {
	    // return Math.floor((date / 86400000) - (date.getTimezoneOffset() / 1440) + 2440587.5);
	    return Math.floor((date / 86400000) + 2440587.5);
	},

	// convert to xy for a given angle theta rotating around the x axis
	// theta in degrees
	// AU is a scale -- pixels / astronomical unit
	project: function(body, theta, AU) {
		var AU = AU || 250,
			theta = typeof theta === "undefined"? 20 : theta,
			theta = Math.PI / 180 * theta, // convert to radians
			x_index = 1, // just mapping the axis to one of the three ecliptic dimensions
			y_index = 0, // just mapping the axis to one of the three ecliptic dimensions
			z_index = 2; // just mapping the axis to one of the three ecliptic dimensions

		return body.positions.map(function(d) {
			return {
				x: AU * d.position.xecl,
				y: AU * (Math.sin(theta) * d.position.yecl + Math.cos(theta) * d.position.zecl)
			}
		});
	}
}

module.exports.planets = require("./lib/planets");
module.exports.comets  = require("./lib/comets");