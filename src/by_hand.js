import c from 'cassowary';
import CRect from './crect';

var cdict = CRect.cdict;
var solver = new c.SimplexSolver();

var r1 = new CRect(250, 50, 100, 25);
var r2 = new CRect(250, 50, 75, 75);

r1.color = 'blue';
r2.color = 'green';

// fix width and height
// how can we specify this
solver.addConstraint(new c.Equation(r1[cdict].w, r1.w));
solver.addConstraint(new c.Equation(r1[cdict].h, r1.h));
solver.addConstraint(new c.Equation(r2[cdict].w, r2.w));
solver.addConstraint(new c.Equation(r2[cdict].h, r2.h));

var gap = new c.Expression(10);

solver.addConstraint(new c.Equation(r2[cdict].y, r1[cdict].bottom.plus(gap)));
solver.addConstraint(new c.Equation(r1[cdict].center, r2[cdict].center));

var update = function() {
    [r1, r2].forEach(r => {
        ['x', 'y', 'w', 'h'].forEach(key => {
            r[key] = r[cdict][key].value;
        });
    });
};

//console.log(`${['x','y','w','h'].map(key => r1[cdict][key].toString())}`);
//console.log(`${['x','y','w','h'].map(key => r2[cdict][key].toString())}`);

//console.log(r1.toString());
//console.log(r2.toString());

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');

var draw = function() {
    ctx.clearRect(0, 0, 1200, 700);

    ctx.fillStyle = r1.color;
    ctx.fillRect(r1.x, r1.y, r1.w, r1.h);

    ctx.fillStyle = r2.color;
    ctx.fillRect(r2.x, r2.y, r2.w, r2.h);

    ctx.strokeStyle = 'black';
    // TODO: draw fraction line
};

document.addEventListener('mousedown', function (e) {
    solver.addEditVar(r1[cdict].x);
    solver.addEditVar(r1[cdict].y);
    solver.beginEdit();
});

document.addEventListener('mousemove', function(e) {
    if (e.which) {
        var x = e.pageX;
        var y = e.pageY;

        solver.suggestValue(r1[cdict].x, x);
        solver.suggestValue(r1[cdict].y, y);
        solver.resolve();

        update();
        draw();
    }
});

document.addEventListener('mouseup', function (e) {
    solver.endEdit();
});
