"use strict";

class Rect {
    constructor(x, y, width, height) {
        Object.assign(this, { x, y, width, height });
    }
    
    get left() {
        return this.x;
    }
    
    get right() {
        return this.x + this.width;
    }
    
    get top() {
        return this.y;
    }
    
    get bottom() {
        return this.y + this.height;
    }
}

module.exports = Rect;
