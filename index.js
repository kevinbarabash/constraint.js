require('babel/register');

var CS = require('./src/constraint');
var Rect = require('./src/rect');

require('./src/by_hand');

process.exit(0);


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



var cs3 = new CS();
cs3.addConstraints(function () {
    
    var r1 = new Rect(100, 100, 100, 100);
    var r2 = new Rect(100, 100, 100, 100);
    
    r1.top = r2.bottom;
});

// TODO make the objects constraint system aware
// TODO need a set of constraints for each object and each method
// essentially, each object needs to have an ID which we can use to refer to 
// it by regardless of the name of the variable(s) that have a reference to it

cs3.solve();
printObject(cs3.variables);


