let esprima = require('esprima');
let estraverse = require('estraverse');
let cassowary = require('cassowary');

let { symbols } = require("./shared");
let { createExpression, getGetterCode, getReturnNode } = require('./helpers');

let solver = new cassowary.SimplexSolver();

/**
 * Wrap an object so that it can be used by addConstraint.
 *
 * desc is a descriptor which provides a list of properties to wrap and
 * describes how they should be treated:
 *   - "var" regular property, no restrictions
 *   - "fixed" regular property, cannot be modified by changes to other props
 *   - "getter" a property with at a getter method
 *
 * @param {Object} obj
 * @param {Object} desc
 * @returns {Object}
 */
let wrapObject = function(obj, desc) {
    // guard against re-wrapping
    if (obj[symbols]) {
        console.warn("object is already wrapped");
        return obj;
    }

    // if no desc is specified assume all props are 'var' type props
    if (desc === undefined) {
        desc = {};
        Object.keys(obj).forEach(name => {
            desc[name] = "var";
        });
        return wrapObject(obj, desc);
    }

    obj[symbols] = {};
    let sym_table = obj[symbols];

    Object.keys(desc).forEach(name => {
        sym_table[name] = Symbol(name);
        if (desc[name] === 'var') {
            let value = obj[name];
            obj[sym_table[name]] = new cassowary.Variable({value});
        } else if (desc[name] === 'fixed') {
            let value = obj[name];
            let variable = new cassowary.Variable({value});
            solver.addStay(variable);
            obj[sym_table[name]] = variable;
        } else if (desc[name] === 'getter') {
            let code = getGetterCode(obj.constructor, name);
            let ast = esprima.parse(code);
            let node = getReturnNode(ast);

            if (node === null) {
                throw new Error("getter doesn't return a value");
            }

            let context = { "this": obj };
            obj[sym_table[name]] = createExpression(node.argument, context);
        }
    });

    // Iterate over all properties that aren't getters/setters and create
    // getters/setters for them, only on this object.  The getters/setters
    // proxy the value of cassowary.Variable object that was created for
    // the property.
    Object.keys(desc).filter(name => {
        return (desc[name] === "var" || desc[name] === "fixed") &&
            Object.getOwnPropertyDescriptor(obj, name).hasOwnProperty("value");
    }).forEach(name => {
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
    });

    return obj;
};

/**
 * Wrap a class so that its instances can be used by addConstraint.
 *
 * @param {class} target
 * @param {Object} desc
 */
let wrapClass = function(target, desc) {
    var proto = target.prototype;

    // we only need one copy because this is just a lookup for the symbols
    // that we need to refernce c.Variables/c.Expressions that can be on
    // either this (c.Variables) or the prototype (c.Expressions)
    proto[symbols] = {};
    var symtable = proto[symbols];

    Object.keys(desc).forEach(name => {
        symtable[name] = Symbol(name);
    });

    Object.keys(desc).forEach(name => {
        let sym = symtable[name];

        if (desc[name] === "var" || desc[name] === "fixed") {
            let first_call_sym = Symbol();
            Object.defineProperty(proto, name, {
                get() {
                    return this[sym].value;
                },
                set(value) {
                    if (!this[sym]) {
                        this[sym] = new cassowary.Variable({value});
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
        } else if (desc[name] === "getter") {
            let sym_memo = Symbol();
            let code = getGetterCode(target, name);
            let ast = esprima.parse(code);
            var node = getReturnNode(ast);

            if (node === null) {
                throw new Error("getter doesn't return a value");
            }

            Object.defineProperty(proto, sym, {
                get() {
                    if (!this[sym_memo]) {
                        let context = { "this": this };
                        this[sym_memo] = createExpression(node.argument, context);
                    }
                    return this[sym_memo];
                }
            });
        }
    });
};

/**
 * Wrap a class so that its instances can be used by addConstraint using the
 * ES7 decorator syntax.
 *
 * @param {Object} desc
 * @returns {Function}
 */
let decorateClass = function(desc) {
    return function(target) {
        wrapClass(target, desc);
    };
};

/**
 * TODO: complete docs
 *
 * @param fn
 * @param args
 */
let addConstraints = function(fn, ...args) {
    let code = fn.toString().replace('function', 'function constraints');
    let ast = esprima.parse(code);
    let func = ast.body[0];
    let params = func.params.map(p => p.name);
    let pDict = {};

    if (fn.length !== args.length) {
        throw new Error("addConstraints: number of params do not match");
    }

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
                    let eqn = new cassowary.Equation(left, right);
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

module.exports = {
    wrapClass: wrapClass,
    wrapObject: wrapObject,
    decorateClass: decorateClass,
    addConstraints: addConstraints,
    solver: solver
};
