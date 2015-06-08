let cassowary = require("cassowary");
let estraverse = require("estraverse");
let { symbols } = require("./shared");


let getGetterCode = function(cls, name) {
    let desc = Object.getOwnPropertyDescriptor(cls.prototype, name);
    if (desc.get) {
        let code = desc.get.toString();
        return `${name} = ${code}`;
    }
    return null;
};

let getReturnNode = function(ast) {
    var result = null;
    estraverse.traverse(ast, {
        enter(node) {
            if (node.type === "ReturnStatement") {
                result = node;
            }
        }
    });
    return result;
};


let expr = function(val) {
    if (val instanceof cassowary.Expression) {
        return val;
    }
    return new cassowary.Expression(val);
};



let ops = {
    "+": "plus",
    "-": "minus",
    "*": "times",
    "/": "divide"
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
        return new cassowary.Expression(node.value);
    }
};



module.exports = {
    getGetterCode: getGetterCode,
    getReturnNode: getReturnNode,
    createExpression: createExpression
};
