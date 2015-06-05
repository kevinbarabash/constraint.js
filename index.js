require("babel-core/register")({
    stage: 0
});
var c = require('./src/constraint');
var Rect = require('./src/rect');

var r1 = new Rect(50, 50, 100, 25);
var r2 = new Rect(50, 50, 75, 75);

//wrap(r1, desc);
//wrap(r2, desc);

c.createConstraints(function (r1, r2) {
    r1.center == r2.center;
    r2.top - r1.bottom == 10;
}, r1, r2);

console.log("r1 = " + r1.toString());
console.log("r2 = " + r2.toString());

// TODO: start writing tests
r1.x = 200;
r1.w = 200;
r1.w = 150; // overrides previous value
//r2.w = 80;  // allows for setting of multiple values
//r2.x = 135; // overrides previous value from a related rectangle

console.log("r1 = " + r1.toString());
console.log("r2 = " + r2.toString());
