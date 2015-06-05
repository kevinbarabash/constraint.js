let esprima = require('esprima');
let estraverse = require('estraverse');
let c = require('cassowary');

let symbols = Symbol();

// TODO allow different objects to be in separate solvers
// why? partitioning may improve speed
// TODO prevent constraints between Variable/Expression in separate solvers
let solver = new c.SimplexSolver();


let wrap = function(obj, desc) {
    // guard against re-wrapping
    if (obj[symbols]) {
        return;
    }

    obj[symbols] = {};
    let sym_table = obj[symbols];

    Object.keys(desc).forEach(name => {
        sym_table[name] = Symbol(name);
        if (desc[name] === 'var') {
            let value = obj[name];
            obj[sym_table[name]] = new c.Variable({value});
        } else if (desc[name] === 'fixed') {
            let value = obj[name];
            let variable = new c.Variable({value});
            solver.addStay(variable);
            obj[sym_table[name]] = variable;
        } else if (desc[name] === 'comp') {
            let code = getGetterCode(Rect, name);
            let ast = esprima.parse(code);
            estraverse.traverse(ast, {
                enter(node) {
                    if (node.type === "ReturnStatement") {
                        obj[sym_table[name]] = createExpression(node.argument, { "this": obj });
                    }
                }
            });
        }
    });

    var props = Object.keys(desc).filter(name => {
        return desc[name] === "var" || desc[name] === "fixed";
    });

    props.forEach(name => {
        let desc = Object.getOwnPropertyDescriptor(obj, name);
        if (desc.hasOwnProperty("value")) {
            var firstCall = true;
            Object.defineProperty(obj, name, {
                get() {
                    return obj[sym_table[name]].value;
                },
                set(value) {
                    if (firstCall) {
                        firstCall = false;
                        solver.addEditVar(obj[sym_table[name]]);
                    }
                    solver.suggestValue(obj[sym_table[name]], value);
                    solver.resolve();
                }
            });
        } else {
            // TODO wrap existing getters/setters if they exist
            // I'm not sure if it even makes sense to do this
        }
    });

    return obj;
};

let ops = {
    "+": "plus",
    "-": "minus",
    "*": "times",
    "/": "divide"
};

let expr = function(val) {
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
                    let sym_table = _this[symbols];
                    return expr(_this[sym_table[prop.name]]);
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
                    let sym_table = _obj[symbols];
                    return expr(_obj[sym_table[prop.name]]);
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

let createConstraints = function(fn, ...args) {
    let code = fn.toString().replace('function', 'function constraints');
    let ast = esprima.parse(code);
    let func = ast.body[0];
    let params = func.params.map(p => p.name);
    let pDict = {};
    for (let i = 0; i < fn.length; i++) {
        pDict[params[i]] = args[i];
    }

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
                    solver.addConstraint(eqn);
                } else if (op === ">") {
                    // create a greater-than constraint
                } else if (op === "<") {
                    // create a less-than constraint
                } else if (op === ">=") {

                } else if (op === "<=") {

                }
            }
        }
    });
};

let wrapClass = function(desc) {
    return function(target) {
        var proto = target.prototype;

        // we only need one copy because this is just a lookup for the symbols
        // that we need to refernce c.Variables/c.Expressions that can be on
        // either this (c.Variables) or the prototype (c.Expressions)
        proto[symbols] = {};
        var symtable = proto[symbols];

        Object.keys(desc).forEach(name => {
            symtable[name] = Symbol(name);
        });

        var props = Object.keys(desc).filter(name => {
            return desc[name] === "var" || desc[name] === "fixed";
        });

        props.forEach(name => {
            let sym = symtable[name];
            let first_call_sym = Symbol();
            Object.defineProperty(proto, name, {
                get() {
                    return this[sym].value;
                },
                set(value) {
                    if (!this[sym]) {
                        this[sym] = new c.Variable({value});
                        if (desc[name] === "fixed") {
                            solver.addStay(this[sym]);
                        }
                    } else {
                        if (!this[first_call_sym]) {
                            this[first_call_sym] = true;  // only call it once
                            solver.addEditVar(this[sym]);
                        }
                        solver.suggestValue(this[sym], value);
                        solver.resolve();
                    }
                }
            });
        });

        var getters = Object.keys(desc).filter(name => {
            return desc[name] === "comp";
        });

        getters.forEach(name => {
            let sym = symtable[name];
            let sym_memo = Symbol();
            let code = getGetterCode(target, name);
            let ast = esprima.parse(code);
            estraverse.traverse(ast, {
                enter(node) {
                    if (node.type === "ReturnStatement") {
                        Object.defineProperty(proto, sym, {
                            get() {
                                if (!this[sym_memo]) {
                                    this[sym_memo] = createExpression(node.argument, { "this": this });
                                }
                                return this[sym_memo];
                            }
                        });
                    }
                }
            });
        });
    }
};

let getGetterCode = function(cls, name) {
    let desc = Object.getOwnPropertyDescriptor(cls.prototype, name);
    return desc.get.toString().replace(`function`, `function ${name}`);
};


module.exports = {
    wrap: wrap,
    wrapClass: wrapClass,
    createConstraints: createConstraints
};
