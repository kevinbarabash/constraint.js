let esprima = require('esprima');
let estraverse = require('estraverse');
let c = require('cassowary');


class Rect {
    constructor(x, y, w, h) {
        Object.assign(this, { x, y, w, h });
    }

    get left() {
        return this.x;
    }

    get right() {
        return this.x + this.w;
    }

    get top() {
        return this.y;
    }

    get bottom() {
        return this.y + this.h;
    }

    get center() {
        return this.x + this.w / 2;
    }

    toString() {
        return `{ x:${this.x}, y:${this.y}, w:${this.w}, h:${this.h} }`;
    }
}

// use a decorator with the descriptor
let desc = {
    x: 'var',
    y: 'var',
    w: 'fixed',
    h: 'fixed',
    left: 'comp',
    right: 'comp',
    top: 'comp',
    bottom: 'comp',
    center: 'comp'
};

let cd = Symbol();
let solver = new c.SimplexSolver();

// TODO: refactor to be a decorator that's called on the constructor?
let wrap = function(obj, desc) {
    obj[cd] = {};

    Object.keys(desc).forEach(name => {
        if (desc[name] === 'var') {
            let value = obj[name];
            obj[cd][name] = new c.Variable({value});
        } else if (desc[name] === 'fixed') {
            let value = obj[name];
            let variable = new c.Variable({value});
            // TODO: rewrite these using equation constraints
            // TODO: come up with a way to modify these constraints
            solver.addStay(variable);
            obj[cd][name] = variable;
        } else if (desc[name] === 'comp') {
            let code = getGetterCode(Rect, name);
            let ast = esprima.parse(code);
            estraverse.traverse(ast, {
                enter(node) {
                    if (node.type === "ReturnStatement") {
                        console.log(node.argument);
                        let expr = createExpression(node.argument, { this: obj });
                        obj[cd][name] = expr;
                        console.log(expr.toString());
                    }
                }
            });
        }
    });
};

let getGetterCode = function(cls, name) {
    let desc = Object.getOwnPropertyDescriptor(cls.prototype, name);
    return desc.get.toString().replace(`function`, `function ${name}`);
};

let ops = {
    "+": "plus",
    "-": "minus",
    "*": "times",
    "/": "divide"
};

var expr = function(val) {
    if (val instanceof c.Expression) {
        return val;
    }
    return new c.Expression(val);
};

let createExpression = function(node, context) {
    if (node.type === "MemberExpression") {
        let obj = node.object;
        let prop = node.property;

        if (obj.type === "ThisExpression") {
            if (prop.type === "Identifier") {
                if ("this" in context) {
                    let _this = context["this"];
                    return expr(_this[cd][prop.name]);
                } else {
                    throw "'this' not in context";
                }
            } else {
                throw "can't handle expression";
            }
        } else if (obj.type === "Identifier") {
            if (prop.type === "Identifier") {
                let objName = obj.name;
                if (objName in context) {
                    let _obj = context[objName];
                    return expr(_obj[cd][prop.name]);
                } else {
                    throw `'${objName}' not in context`;
                }
            } else {
                throw "can't handle expression";
            }
        }
        // TODO: handle computed properties, e.g. a[i+1]
    } else if (node.type === "BinaryExpression") {
        let left = createExpression(node.left, context);
        let right = createExpression(node.right, context);

        let op = ops[node.operator];
        return left[op](right);
    } else if (node.type === "Literal") {
        return new c.Expression(node.value);
    }
};

var createConstraints = function(fn, ...args) {
    var code = fn.toString().replace('function', 'function constraints');
    console.log(code);
    console.log(args);

    var ast = esprima.parse(code);
    var func = ast.body[0];
    console.log(func);
    var params = func.params.map(p => p.name);
    var pDict = {};
    for (let i = 0; i < fn.length; i++) {
        pDict[params[i]] = args[i];
    }
    console.log(pDict);
    func.body.body.forEach(s => {
        if (s.type === "ExpressionStatement") {
            let e = s.expression;
            if (e.type === "BinaryExpression") {
                let op = e.operator;
                if (op === "==") {
                    // create an equation constraint
                    let left = createExpression(e.left, pDict);
                    let right = createExpression(e.right, pDict);
                    let eqn = new c.Equation(left, right);
                    console.log(eqn.toString());
                    solver.addConstraint(eqn);
                } else if (op === ">") {
                    // create a greater-than constraint
                } else if (op === "<") {
                    // create a less-than constraint
                }
            }
        }
    });
};

// TODO: store the descriptor as part of the object?
let update = function (obj, desc) {
    Object.keys(desc).forEach(name => {
        var type = desc[name];

        if (type === 'var' || type === 'fixed') {
            obj[name] = obj[cd][name].value;
        }
    });
};

let r1 = new Rect(50, 50, 100, 25);
let r2 = new Rect(50, 50, 75, 75);

wrap(r1, desc);
wrap(r2, desc);

createConstraints(function (r1, r2) {
    r1.center == r2.center;
    r2.top - r1.bottom == 10;
}, r1, r2);

solver.resolve();

update(r1, desc);
update(r2, desc);

console.log(`r1 = ${r1.toString()}`);
console.log(`r2 = ${r2.toString()}`);

window.r1 = r1;
window.r2 = r2;
window.cd = cd;

window.Rect = Rect;

// TODO: make a method to extract these from a descriptor
var props = ['x', 'y', 'w', 'h'];

// wrap should addEditVars to the solver
props.forEach(p => {
    solver.addEditVar(r1[cd][p]);
    solver.suggestValue(r1[cd][p], r1[p]);
});

solver.suggestValue(r1[cd].x, 200);
solver.suggestValue(r1[cd].w, 200);
solver.resolve();

update(r1, desc);
update(r2, desc);
console.log(r1[cd].x.value);
console.log(r1[cd].w.value);

console.log(`r1 = ${r1.toString()}`);
console.log(`r2 = ${r2.toString()}`);
