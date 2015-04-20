var astronomy = require("../index");

module.exports = {};

var comets = module.exports.comets = {};

require("../data/comets.json").forEach(function(comet) {
	// name e.g. "1P/Halley" or "C/2012 S1 (ISON)"
	comet.label = comet.name.split("/")[1];
	comet.label += " (" + String(comet.Tp).slice(0,4) + ")";

	// need to parse this as a date
	comet.Tp = String(comet.Tp);

	// convert the date of perihelion to Javascript date
	comet.closest = new Date(parseInt(comet.Tp.slice(0, 4)), parseInt(comet.Tp.slice(4,6), 10)-1, parseFloat(comet.Tp.slice(6,8)), 24 * parseFloat(comet.Tp.slice(8)));

	comets[comet.label] = comet;
});

var comet_position = module.exports.comet_position = function(comet_name, date) {
	var variables = ['q', 'e', 'I', 'w', 'node'],
		TOLERANCE = 1 / 100000000000,
		MAXAPPROX = 180;
		GAUSS  = 0.01720209895;
		nCount = MAXAPPROX;

	var elements = {};
	variables.forEach(function(v) {
		elements[v] = parseFloat(comets[comet_name][v]);
	});
	elements.epoch = parseInt(comets[comet_name].epoch, 10);
	elements.closest = comets[comet_name].closest;

	// ported directly from Orbit Viewer Java code
	function CometStatusNearPara() {
		if (elements.q == 0) {
			console.log(comet_name, "ERROR");
			return false;
		}
		elements.a = Math.sqrt((1.0 + 9.0 * elements.e) / 10.0);
		elements.b = 5.0 * (1 - elements.e) / (1.0 + 9.0 * elements.e);
		var fA1, fB1, fX1, fA0, fB0, fX0, fN;
		fA1 = fB1 = fX1 = 1.0;
		var nCount1 = MAXAPPROX;
		do {
			fA0 = fA1;
			fB0 = fB1;
			fN = fB0 * elements.a * GAUSS * (astronomy.dateToJulian(date) - astronomy.dateToJulian(elements.closest)) / (Math.sqrt(2.0) * elements.q * Math.sqrt(elements.q));
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
			fA1 = elements.b * fX1 * fX1;
			fB1 = (-3.809524e-03 * fA1 - 0.017142857) * fA1 * fA1 + 1.0;
		} while (Math.abs(fA1 - fA0) > TOLERANCE && --nCount1 > 0);
		if (nCount1 == 0) {
			console.log(comet_name, "ERROR");
			return false;
		}
		var fC1 = ((0.12495238 * fA1 + 0.21714286) * fA1 + 0.4) * fA1 + 1.0;
		var fD1 = ((0.00571429 * fA1 + 0.2       ) * fA1 - 1.0) * fA1 + 1.0;
		var fTanV2 = Math.sqrt(5.0 * (1.0 + elements.e) / (1.0 + 9.0 * elements.e)) * fC1 * fX1;
		var x = elements.q * fD1 * (1.0 - fTanV2 * fTanV2);
		var y = 2.0 * elements.q * fD1 * fTanV2;
		
		//console.log(x, y);
		return {
			ecliptic: astronomy.ecliptic(elements, x, y, 0)
		}
	}

	function CometStatusPara() {
		var N = GAUSS * (astronomy.dateToJulian(date) - astronomy.dateToJulian(elements.closest)) / (Math.sqrt(2.0) * elements.q * Math.sqrt(elements.q)),
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
		var x = elements.q * (1.0 - Tan2V2),
			y = 2.0 * elements.q * TanV2;
		
		//console.log(x, y);

		return {
			ecliptic: astronomy.ecliptic(elements, x, y, 0)
		}
	}

	function CometStatusEllip() {
		elements.a = elements.q / (1 - elements.e); // AU
		elements.P = Math.pow(elements.a, 1.5) * 365.2568984; // days
		elements.t = astronomy.dateToJulian(date) - astronomy.dateToJulian(elements.closest);

		var M = 360 * elements.t / elements.p;


		var M = GAUSS * elements.t / (Math.sqrt(elements.a) * elements.a),
			E1 = M + elements.e * Math.sin(M);

		if (elements.e < 0.6) {
			var E2;
			do {
				E2 = E1;
				E1 = M + elements.e * Math.sin(E2);
			} while (Math.abs(E1 - E2) > TOLERANCE && --nCount > 0);
		} else {
			var Dv;
			do {
				var Dv1 = (M + elements.e * Math.sin(E1) - E1),
					Dv2 = (1.0 - elements.e * Math.cos(E1));
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

		var x = elements.a * (Math.cos(E1) - elements.e),
			y = elements.a * Math.sqrt(1.0 - elements.e * elements.e) * Math.sin(E1);

		//console.log(elements, x, y);

		return {
			ecliptic: astronomy.ecliptic(elements, x, y, 0)
		}
	}

	if (elements.e < 0.98) {
		return CometStatusEllip();
	} else if (elements.e == 1) {
		return CometStatusPara();			
	} else if (Math.abs(elements.e - 1.0) <= 0.2) {
		return CometStatusNearPara();
	} else {
		return CometStatusPara();
	}
}

function stepFunction(x) {
	return Math.pow(x/4, 3);
}

var one_day = 24 * 60 * 60 * 1000;
// main comet object
var comet = module.exports.comet = function(comet_name) {
	var positions = [];

	var steps = Math.round(100 * Math.pow(comets[comet_name].e, 2));

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

