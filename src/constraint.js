import esprima from 'esprima';
import estraverse from 'estraverse';
import c from 'cassowary';



// TODO get function bodies to extract constraints
// TODO figure how to generate constraints from equality of computed properties


var solve = function(constraints) {
    var code = constraints.toString();
    
    code = code.substring(code.indexOf('{') + 1);
    code = code.substring(0, code.length - 1);

    var solver = new c.SimplexSolver();
    var ast = esprima.parse(code);
    var variables = {};

    var getOrCreateLval = function(node) {
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
                let value = node.property.value;
                if (!variables[name][value]) {
                    variables[name][value] = new c.Variable({
                        name: `${name}[${value}]`
                    });
                }
                result = variables[name][value];
            }
        }
      
        return result;
    };

    var buildExpression = function(node) {
        var result = new c.Expression();
        if (node.type === "BinaryExpression") {
            var left = node.left;
            var right = node.right;

            if (left.type === "Identifier") {
                result = result.plus(getOrCreateLval(left));
            } else if (left.type === "Literal") {
                result = result.plus(left.value);
            } else if (left.type === "BinaryExpression") {
                // TODO implement
            }

            if (right.type === "Identifier") {
                result = result.plus(getOrCreateLval(right));
            } else if (right.type === "Literal") {
                result = result.plus(new c.Expression(right.value));
            } else if (right.type === "BinaryExpression") {
                // TODO implement
            }
        } else if (node.type === "Literal") {
            result = new c.Expression(node.value);
        }
        return result;
    };
    
    estraverse.traverse(ast, {
        enter(node, parent) {
            if (node.type === "AssignmentExpression") {
                var left = getOrCreateLval(node.left);
                var right = buildExpression(node.right);
                solver.addConstraint(new c.Equation(left, right));
            }
        }
    });

    solver.resolve();
    
    return variables;
};

module.exports = solve;
