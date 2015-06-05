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

            c.createConstraints(function (r1, r2) {
                r1.center == r2.center;
                r2.top - r1.bottom == 10;
            }, r1, r2);

            assertRect(r1, 0, 0, 100, 25);
            assertRect(r2, 12.5, 35, 75, 75);
        });

        it("should update after moving r1", function () {
            var r1 = new Rect(50, 50, 100, 25);
            var r2 = new Rect(50, 50, 75, 75);

            c.createConstraints(function (r1, r2) {
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

            c.createConstraints(function (r1, r2) {
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

            c.createConstraints(function (r1, r2) {
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

            c.createConstraints(function (r1, r2) {
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
});
