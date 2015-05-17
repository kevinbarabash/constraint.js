import esprima from 'esprima';
import estraverse from 'estraverse';
import c from 'cassowary';



// TODO get function bodies to extract constraints
// TODO figure how to generate constraints from equality of computed properties


class ConstraintSystem {
    
    constructor() {
        this.solver = new c.SimplexSolver();
        this.variables = {};
    }
    
    addConstraints(fn) {
        var code = fn.toString();
        code = code.substring(code.indexOf('{') + 1);
        code = code.substring(0, code.length - 1);
        var ast = esprima.parse(code);

        estraverse.traverse(ast, {
            enter: node => {
                if (node.type === "AssignmentExpression") {
                    var left = this.getOrCreateLval(node.left);
                    var right = this.buildExpression(node.right);
                    this.solver.addConstraint(new c.Equation(left, right));
                }
            }
        });
    }
    
    solve() {
        this.solver.resolve();
    }
    
    suggestValues(fn) {
        var code = fn.toString();
        code = code.substring(code.indexOf('{') + 1);
        code = code.substring(0, code.length - 1);
        var ast = esprima.parse(code);

        estraverse.traverse(ast, {
            enter: node => {
                if (node.type === "AssignmentExpression") {
                    // TODO: fail if the lval doesn't exist in this.variables
                    var left = this.getOrCreateLval(node.left);
                    if (node.right.type === "Literal") {
                        this.solver.addEditVar(left);
                        this.solver.suggestValue(left, node.right.value);
                    } else {
                        throw "invalid r-value";
                    }
                }
            }
        });
    }

    getOrCreateLval(node) {
        var variables = this.variables;
        var result;

        if (node.type === "Identifier") {
            let name = node.name;
            if (name in variables) {
                result = variables[name];
            } else {
                result = new c.Variable({ name: name });
                variables[name] = result;
            }
        } else if (node.type === "MemberExpression") {
            if (node.object.type === "Identifier") {
                let name = node.object.name;
                if (!variables[name]) {
                    variables[name] = {};
                }
                var prop = node.property;
                if (prop.type === "Literal") {
                    let index = prop.value;
                    if (!variables[name][index]) {
                        variables[name][index] = new c.Variable({
                            name: `${name}[${index}]`
                        });
                    }
                    result = variables[name][index];
                } else if (prop.type === "Identifier") {
                    let propName = prop.name;
                    if (!variables[name][propName]) {
                        variables[name][propName] = new c.Variable({
                            name: `${name}[${propName}]`
                        });
                    }
                    result = variables[name][propName];
                }
            }
        }

        return result;
    }

    buildExpression(node) {
        var result = new c.Expression();
        if (node.type === "BinaryExpression") {
            var left = node.left;
            var right = node.right;

            if (left.type === "Identifier") {
                result = result.plus(this.getOrCreateLval(left));
            } else if (left.type === "Literal") {
                result = result.plus(left.value);
            } else if (left.type === "MemberExpression") {
                result = result.plus(this.getOrCreateLval(left));
            } else if (left.type === "BinaryExpression") {
                // TODO implement
            }
            
            var lookup = {
                '+': 'plus',
                '-': 'minus',
                '*': 'times',
                '/': 'divide'
            };
            
            var op = lookup[node.operator];

            if (right.type === "Identifier") {
                result = result[op](this.getOrCreateLval(right));
            } else if (right.type === "Literal") {
                result = result[op](new c.Expression(right.value));
            } else if (right.type === "BinaryExpression") {
                // TODO implement
            }
        } else if (node.type === "Literal") {
            result = new c.Expression(node.value);
        }
        return result;
    }
    
}

module.exports = ConstraintSystem;
