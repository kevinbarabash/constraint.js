[![Build Status](https://travis-ci.org/kevinb7/constraint.js.svg?branch=master)](https://travis-ci.org/kevinb7/constraint.js)
# constraint.js

Simplifies using [cassowary.js](https://github.com/slightlyoff/cassowary.js/)
constraint solver by wrapping existing object and class such they automatically 
create appropriate c.Variable and c.Expression instances.  Adding constraints 
between objects is also simplified by passing a function contain code describing 
the constraints to ```addConstraints```.

## Example
    var c = require("constraint");
    
    var r1 = { x: 50, y: 50, w: 100, h: 25 };
    var r2 = { x: 50, y: 50, w: 75, h: 75 };
    
    var desc = { x: "var", y: "var", w: "fixed", h: "fixed" };
    
    c.wrapObject(r1, desc);
    c.wrapObject(r2, desc);
    
    c.addConstraints(function (r1, r2) {
        r2.x + r2.h / 2 == r1.x + r1.h / 2; // align horizontally along the center
        r2.y - 10 == r1.x + r1.h;           // create a 10px vertical gap
    }, r1, r2);
        
    console.log(r1);    // 
    console.log(r2);    //

## Documentation
Descriptors specify which properties to create variables or expressions for 
within the constraint solver.  Each key should match a property on the object
or class being wrapped.
  
- "var" creates a variable which is affected by other variables
- "fixed" creates a variable which is unaffected by other variables

Both of these can only be created for simple properties, not computed properties.

- "comp" creates an expression which is affected by the variables it depends on

This can only be used with computed properties.

    var c = require("constraint");
    class Rect {
        constructor(x, y, w, h) {
            Object.assign(self, {x, y, w, h});
        }
        get right() {
            return this.x + this.w;
        }
        get bottom() {
            return this.y + this.h;
        }
    }

    Rect = c.wrapClass(Rect, { 
        x: "var", y: "var", 
        w: "fixed", h: "fixed", 
        right: "comp", bottom: "comp" 
    });
    
    var r1 = new Rect(50, 50, 100, 25);
    var r2 = new Rect(50, 50, 75, 75);
    
    c.addConstraints(function (r1, r2) {
        r2.y == r1.bottom;
        r2.x == r1.right;
    }, r1, r2);
    
    console.log(r1);    // {x:0, y:0, w:100, h:25}
    console.log(r2);    // {x:100, y:25, w:75, h:75}
    
Note that `x` and `y` are initialized to 0.  All properties marked as "var" will
default to some initial value after the constraints have been setup.  In order
to "fix" this, simply set the value on the properties you want to update.

    r1.x = 200;
    
    console.log(r1);    // {x:200, y:0, w:100, h:25}
    console.log(r2);    // {x:300, y:25, w:75, h:75}
    
When setting properties to values that conflict with each other, the last 
property to be set wins.

    r1.x = 200;
    r2.x = 200;
        
    console.log(r1);    // {x:100, y:0, w:100, h:25}
    console.log(r2);    // {x:200, y:25, w:75, h:75}

Notes about `addConstraints`: argument order matters.  The function being 
passed in is parsed and the the names of the arguments are and their order is
extracted from that function.  The last two arguments to `addConstraints` 
must be in the same order.

    c.addConstraints(function (r1, r2) {
        r2.y == r1.bottom;
        r2.x == r1.right;
    }, r1, r2); // GOOD
    
    c.addConstraints(function (r1, r2) {
        r2.y == r1.bottom;
        r2.x == r1.right;
    }, r2, r1); // BAD - r1 and r2 have been swapped
    
The second call to `addConstraints` is equivalent to:

    c.addConstraints(function (r1, r2) {
        r1.y == r2.bottom;
        r1.x == r2.right;
    }, r1, r2);
    
There's also a handy decorator syntax that you can use if you're using a browser
or transpiler that supports it.

    var desc = { 
        x: "var", y: "var", 
        w: "fixed", h: "fixed", 
        right: "comp", bottom: "comp" 
    };
    
    @c.decorateClass(desc)
    class Rect {
        constructor(x, y, w, h) {
            Object.assign(self, {x, y, w, h});
        }
        get right() {
            return this.x + this.w;
        }
        get bottom() {
            return this.y + this.h;
        }
    }

The system supports all of the same linear constraints as cassowary.js.  This
includes: `>`, `<`, `>=`, `<=`, `==`.  Here's an example using the `>` operator.

    c.addConstraints(function (r1, r2) {
        r2.x > r1.x + r1.w;     // r2 is always to the left of r1
    }, r1, r2);
    
Expressions can include linear operators, constants, and properties on objects
that have been wrapped by constraint.js.  

## Limitations

The system cannot wrap variables that aren't objects.  If there variables that
you would like to create constraints for, create an object containing the 
variables as properties, wrap that object, and create constraints.

    var x = 5;
    var y = 10;
    
    var obj = c.wrapObject({x, y});
    
    c.addConstraints(function(obj) {
        obj.y = 2 * obj.x;
    });
    
    console.log(obj);                   // { x:0, y: 0 }
    console.log(`x = ${x}, y = ${y}`);  // x = 5, y = 10
    
    obj.x = 50;
    
    console.log(obj);                   // { x:50, y:100 }

## Future Work

[ ] moar tests
[ ] comparison operators listed above
[ ] decorators for methods (which should replace the need for the descriptor)
[ ] support more expressions within `addConstraint`
  [ ] array indexing
  [ ] looping constructs
[ ] improve error handling
[ ] get current constraints
  [ ] all
  [ ] for a particular property (on an object)
[ ] remove constraints
