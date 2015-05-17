require('babel/register');

var CS = require('./src/constraint');

var printObject = function(obj, arrayName) {
    Object.keys(obj).forEach(function (key) {
        var val = obj[key];
        if (typeof val === "object" && !val.name) {
            printObject(val, key);
        } else {
            if (arrayName) {
                // TODO differentiate between objects and arrays
                console.log(arrayName + '[' + key + ']' + ' = ' + val.value);
            } else {
                console.log(key + ' = ' + val.value);
            }
        }
    });
};

var constraints = function() {
    var a, b, c, d;

    a = 5;
    b = a + 2;
    c = b + 4;
    d = c + 1;
};

var cs = new CS();
cs.addConstraints(constraints);
cs.solve();
printObject(cs.variables);

constraints = function() {
    var a = [];

    a[0] = 10;
    a[1] = a[0] + 5;
    a[2] = a[1] + 7;
    a[3] = a[2] + 11;
};

var cs1 = new CS();
cs1.addConstraints(constraints);
cs1.solve();
printObject(cs1.variables);

// TODO handle for loops by executing the for loop, but replacing the inside of
// the loop with calls to create constraints for the modified AST fragment


constraints = function(p1, p2) {
    p1.x = p2.x - 5;
    p1.y = p2.y - 5;
};

var cs2 = new CS();
cs2.addConstraints(constraints);
cs2.solve();
printObject(cs2.variables);


cs2.suggestValues(function(p1) {
    p1.y = 20; 
});
cs2.solve();
printObject(cs2.variables);

//cs2.solver.addEditVar(cs2.variables.p2.x);
//cs2.solver.suggestValue(cs2.variables.p2.x, 100);
//cs2.solver.resolve();
//printObject(cs2.variables);
//
////cs2.solver.addStay(cs2.variables.p2.x);
//cs2.solver.addEditVar(cs2.variables.p1.x);
//cs2.solver.suggestValue(cs2.variables.p1.x, 20);
//cs2.solver.resolve();
//printObject(cs2.variables);


