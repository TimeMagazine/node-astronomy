var astronomy = require("../index");

var comet = astronomy.comets.comet("Halley (1986)");

var coordinates = astronomy.project(comet);

var csv = "x,y\n" + coordinates.map(function(d) { return d.x + "," + d.y; }).join("\n");

console.log(csv);