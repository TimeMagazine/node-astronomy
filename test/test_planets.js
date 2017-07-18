var fs = require('fs');
var astronomy = require("../index");

var argv = require('minimist')(process.argv.slice(2));

var planet = argv._[0];
var interval = argv._[1] || 1;

var planet = astronomy.planets.planet(planet, interval);

//console.log(JSON.stringify(earth, null, 2));
var coordinates = planet.positions;

coordinates = astronomy.project(planet, 90, 149597870.7);

console.log(coordinates[0]);

var csv = "x,y\n" + coordinates.map(function(d) { return d.x + "," + d.y; }).join("\n");

fs.writeFileSync(argv._[0] + ".csv", csv);