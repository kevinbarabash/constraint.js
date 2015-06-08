require("babel/register")({
    stage: 0
});
var assert = require("assert");
var c = require('../src/constraint');
var Rect = require('../src/rect');

var assertRect = function(rect, x, y, w, h) {
    assert.equal(rect.x, x);
    assert.equal(rect.y, y);
    assert.equal(rect.w, w);
    assert.equal(rect.h, h);
};

describe("constraint", function() {
    it("should create a rect", function() {
        var rect = new Rect(50, 75, 100, 25);
        assertRect(rect, 50, 75, 100, 25);
    });

    it("should calcuate computed properties", function () {
        var rect = new Rect(50, 75, 100, 25);
        assert.equal(rect.left, 50);
        assert.equal(rect.right, 150);
        assert.equal(rect.top, 75);
        assert.equal(rect.bottom, 100);

        assert.equal(rect.center, 100); // (left + right) / 2
    });

    it("should update only modified properties", function () {
        var rect = new Rect(50, 75, 100, 25);
        rect.x = 250;
        assertRect(rect, 250, 75, 100, 25);
        rect.y = 375;
        assertRect(rect, 250, 375, 100, 25);
        rect.w = 50;
        assertRect(rect, 250, 375, 50, 25);
        rect.h = 150;
        assertRect(rect, 250, 375, 50, 150);
    });

    it("should compute properties after modifying base props", function () {
        var rect = new Rect(50, 75, 100, 25);
        rect.x = 250;
        rect.y = 375;
        rect.w = 50;
        rect.h = 150;

        assert.equal(rect.left, 250);
        assert.equal(rect.right, 300);
        assert.equal(rect.top, 375);
        assert.equal(rect.bottom, 525);

        assert.equal(rect.center, 275);
    });

    describe("two rect system", function () {
        it("should resolve correctly", function () {
            var r1 = new Rect(50, 50, 100, 25);
            var r2 = new Rect(50, 50, 75, 75);

            c.addConstraints(function (r1, r2) {
                r1.center == r2.center;
                r2.top - r1.bottom == 10;
            }, r1, r2);

            assertRect(r1, 0, 0, 100, 25);
            assertRect(r2, 12.5, 35, 75, 75);
        });

        it("should update after moving r1", function () {
            var r1 = new Rect(50, 50, 100, 25);
            var r2 = new Rect(50, 50, 75, 75);

            c.addConstraints(function (r1, r2) {
                r1.center == r2.center;
                r2.top - r1.bottom == 10;
            }, r1, r2);

            r1.x = 200;
            assertRect(r1, 200, 0, 100, 25);
            assertRect(r2, 212.5, 35, 75, 75);
        });

        it("should update after moving and resizing r1", function () {
            var r1 = new Rect(50, 50, 100, 25);
            var r2 = new Rect(50, 50, 75, 75);

            c.addConstraints(function (r1, r2) {
                r1.center == r2.center;
                r2.top - r1.bottom == 10;
            }, r1, r2);

            r1.x = 200;
            r1.w = 200;
            assertRect(r1, 200, 0, 200, 25);
            assertRect(r2, 262.5, 35, 75, 75);
        });

        it("should update after moving r1 twice", function () {
            var r1 = new Rect(50, 50, 100, 25);
            var r2 = new Rect(50, 50, 75, 75);

            c.addConstraints(function (r1, r2) {
                r1.center == r2.center;
                r2.top - r1.bottom == 10;
            }, r1, r2);

            r1.x = 200;
            r1.x = 150;
            assertRect(r1, 150, 0, 100, 25);
            assertRect(r2, 162.5, 35, 75, 75);
        });

        it("should update after resizing r1 twice", function () {
            var r1 = new Rect(50, 50, 100, 25);
            var r2 = new Rect(50, 50, 75, 75);

            c.addConstraints(function (r1, r2) {
                r1.center == r2.center;
                r2.top - r1.bottom == 10;
            }, r1, r2);

            r1.w = 200;
            r1.w = 150;
            assertRect(r1, 0, 0, 150, 25);
            assertRect(r2, 37.5, 35, 75, 75);
        });

        // TODO moar tests
    });

    describe("wrapping objects", function () {
        it("should wrap getters on the prototype", function () {
            function Foo(a, b) {
                this.a = a;
                this.b = b;
            }

            Object.defineProperty(Foo.prototype, "sum", {
                get: function() {
                    return this.a + this.b;
                }
            });

            var foo = new Foo(0, 0);
            c.wrapObject(foo, { a: "var", b: "var", sum: "getter" });

            foo.a = 5;
            foo.b = 10;
            assert.equal(foo.sum, 15);
        });

        it("should addConstraints with getters on the prototype", function () {
            function Foo(a, b) {
                this.a = a;
                this.b = b;
            }

            Object.defineProperty(Foo.prototype, "sum", {
                get: function() {
                    return this.a + this.b;
                }
            });

            var foo = new Foo(0, 0);
            c.wrapObject(foo, { a: "var", b: "var", sum: "getter" });

            c.addConstraints(function (foo) {
                foo.sum == 42;
            }, foo);

            assert.equal(foo.a + foo.b, 42);
        });

        it("should add 'var' constraints for all props by default", function () {
            var point = { x: 5, y: 10, z: 20 };
            c.wrapObject(point);

            assert.equal(point.x, 5);
            assert.equal(point.y, 10);
            assert.equal(point.z, 20);

            c.addConstraints(function (p) {
                p.x == 2 * p.y;
                p.z == 3 * p.x;
            }, point);

            point.y = 100;

            assert.equal(point.y, 100);
            assert.equal(point.x, 200);
            assert.equal(point.z, 600);
        });
    });
});
