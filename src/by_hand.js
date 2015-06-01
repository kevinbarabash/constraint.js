import c from 'cassowary';

console.log('hello, world!');

var cdict = Symbol('cdict');

var expr = function(val) {
    if (val instanceof c.Expression) {
        return val;
    }
    return new c.Expression(val);
};

class CRect {
    constructor(x, y, w, h) {
        Object.assign(this, {x, y, w, h});
        this[cdict] = {};

        var keys = ['x', 'y', 'w', 'h'];
        keys.forEach(key => {
            var value = this[key];
            var _var = new c.Variable({value});
            this[cdict][key] = _var;
        });

        // note: order of definition might be trick if there's
        // depdencies on other computed properties
        this[cdict].center = expr(this[cdict].x).plus(expr(this[cdict].w).divide(2));
        this[cdict].middle = expr(this[cdict].y).plus(expr(this[cdict].h).divide(2));
        this[cdict].bottom = expr(this[cdict].y).plus(this[cdict].h);
        this[cdict].right = expr(this[cdict].x).plus(this[cdict].w);
    }

    center() {
        // we can determin the entry in this[cdict] from this.member var
        return this.x + this.w / 2;
    }

    middle() {
        return this.y + this.h / 2;
    }

    bottom() {
        return this.y + this.h;
    }

    right() {
        return this.x + this.w;
    }
}

var r1 = {
    x: 50,
    y: 50,
    w: 100,
    h: 25
};

var r2 = {
    x: 50,
    y: 50,
    width: 75,
    height: 75
};

var solver = new c.SimplexSolver();

// set initial values
var x1 = new c.Variable({ name: 'r1.x', value: 50 });
var y1 = new c.Variable({ name: 'r1.y', value: 50 });
var w1 = new c.Variable({ name: 'r1.w', value: 100 });
var h1 = new c.Variable({ name: 'r1.h', value: 25 });

var x2 = new c.Variable({ name: 'r2.x', value: 50 });
var y2 = new c.Variable({ name: 'r2.y', value: 50 });
var w2 = new c.Variable({ name: 'r2.w', value: 75 });
var h2 = new c.Variable({ name: 'r2.h', value: 75 });

// constants
solver.addConstraint(new c.Equation(w1, 100));
solver.addConstraint(new c.Equation(h1, 25));
solver.addConstraint(new c.Equation(w2, 75));
solver.addConstraint(new c.Equation(h2, 75));

// centre lines
var cl1 = expr(x1).plus(expr(w1).divide(2));
var cl2 = expr(x2).plus(expr(w2).divide(2));
console.log(`cl1 = ${cl1.toString()}`);
console.log(`cl2 = ${cl2.toString()}`);
var eq1 = new c.Equation(cl1, cl2);
console.log(`eq1 = ${eq1.toString()}\n`);
solver.addConstraint(eq1);

// vertical gap
var top = expr(y2);
var bottom = expr(y1).plus(h1);
var gap = new c.Expression(10);
console.log(`top = ${top.toString()}`);
console.log(`bottom = ${bottom.toString()}`);
console.log(`gap = ${gap.toString()}`);
var eq2 = new c.Equation(top, expr(bottom).plus(gap));
console.log(`eq2 = ${eq2.toString()}\n`);
solver.addConstraint(eq2);

solver.resolve();

console.log(`${[x1,y1,w1,h1].map(val => val.toString())}`);
console.log(`${[x2,y2,w2,h2].map(val => val.toString())}\n`);


solver.addEditVar(x1);
solver.addEditVar(y1);
solver.suggestValue(x1, 50);
solver.suggestValue(y1, 100);
solver.resolve();

console.log(`${[x1,y1,w1,h1].map(val => val.toString())}`);
console.log(`${[x2,y2,w2,h2].map(val => val.toString())}\n`);

r1 = new CRect(250, 50, 100, 25);
r2 = new CRect(250, 50, 75, 75);
console.log(cdict.toString() + '\n');

// fix width and height
// how can we specify this
solver.addConstraint(new c.Equation(r1[cdict].w, r1.w));
solver.addConstraint(new c.Equation(r1[cdict].h, r1.h));
solver.addConstraint(new c.Equation(r2[cdict].w, r2.w));
solver.addConstraint(new c.Equation(r2[cdict].h, r2.h));

solver.addConstraint(new c.Equation(r2[cdict].y, r1[cdict].bottom.plus(gap)));
solver.addConstraint(new c.Equation(r1[cdict].center, r2[cdict].center));

solver.addEditVar(r1[cdict].x);
solver.addEditVar(r1[cdict].y);
solver.suggestValue(r1[cdict].x, 250);
solver.suggestValue(r1[cdict].y, 100);
solver.resolve();

console.log(`${['x','y','w','h'].map(key => r1[cdict][key].toString())}`);
console.log(`${['x','y','w','h'].map(key => r2[cdict][key].toString())}`);
