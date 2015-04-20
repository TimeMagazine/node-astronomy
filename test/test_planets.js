var astronomy = require("../index");

var argv = require('minimist')(process.argv.slice(2));

var planet = astronomy.planets.planet(argv._[0]);

//console.log(JSON.stringify(earth, null, 2));
var coordinates = astronomy.project(planet);

var csv = "x,y\n" + coordinates.map(function(d) { return d.x + "," + d.y; }).join("\n");

console.log(csv);