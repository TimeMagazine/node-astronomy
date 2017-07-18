var fs = require('fs');
var astronomy = require("./index");

var argv = require('minimist')(process.argv.slice(2));

var planet = argv._[0];
var interval = argv._[1] || 1;

var planet = astronomy.planets.planet(planet, interval);

//console.log(JSON.stringify(earth, null, 2));

var positions = [];

planet.positions.forEach(d => { 
	positions.push({
		date: d.date,
		x: d.position.xp,
		y: d.position.yp,
		z: d.position.zp,
		xe: d.position.xecl,
		ye: d.position.yecl,
		ze: d.position.zecl
	});
});

fs.writeFileSync("./orbits/" + argv._[0] + ".json", JSON.stringify(positions, null, 2));