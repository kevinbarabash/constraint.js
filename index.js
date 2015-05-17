require('babel/register');

var solve = require('./src/constraint');

var printObject = function(obj, arrayName) {
    Object.keys(obj).forEach(function (key) {
        var val = obj[key];
        if (typeof val === "object" && !val.name) {
            printObject(val, key);
        } else {
            if (arrayName) {
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

var variables = solve(constraints);
printObject(variables);

constraints = function () {
    var a = [];

    a[0] = 10;
    a[1] = a[0] + 5;
    a[2] = a[1] + 7;
    a[3] = a[2] + 11;
};

variables = solve(constraints);
printObject(variables);

// TODO handle for loops by executing the for loop, but replacing the inside of
// the loop with calls to create constraints for the modified AST fragment


