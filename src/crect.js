import c from 'cassowary';

var expr = function(val) {
    if (val instanceof c.Expression) {
        return val;
    }
    return new c.Expression(val);
};

var cdict = Symbol('cdict');

class CRect {
    constructor(x, y, w, h) {
        Object.assign(this, {x, y, w, h});
        this[cdict] = {};

        var keys = ['x', 'y', 'w', 'h'];
        keys.forEach(key => {
            var value = this[key];
            this[cdict][key] = new c.Variable({value});
        });

        // note: order of definition might be trick if there's
        // depdencies on other computed properties
        this[cdict].center = expr(this[cdict].x).plus(expr(this[cdict].w).divide(2));
        this[cdict].middle = expr(this[cdict].y).plus(expr(this[cdict].h).divide(2));
        this[cdict].bottom = expr(this[cdict].y).plus(this[cdict].h);
        this[cdict].right = expr(this[cdict].x).plus(this[cdict].w);
    }

    center() {
        // we can determin the entry in this[cdict] from this.member var
        return this.x + this.w / 2;
    }

    middle() {
        return this.y + this.h / 2;
    }

    bottom() {
        return this.y + this.h;
    }

    right() {
        return this.x + this.w;
    }

    toString() {
        return `{ x:${this.x}, y:${this.y}, w:${this.w}, h:${this.h} }`;
    }
}

CRect.cdict = cdict;

module.exports = CRect;
