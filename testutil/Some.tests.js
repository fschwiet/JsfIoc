

describe("Some", function () {

    it("Unique.Integer", function () {

        var val1 = Unique.Integer();
        var val2 = Unique.Integer();

        expect(val1).toNotEqual(val2);
        expect(val1).toEqual(jasmine.any(Number));
        expect(val2).toEqual(jasmine.any(Number));
    });

    it("Unique.String", function () {

        var val1 = Unique.String();
        var val2 = Unique.String("Sample");

        expect(val1).toNotEqual(val2);
        expect(val1).toEqual(jasmine.any(String));
        expect(val2).toEqual(jasmine.any(String));
        expect(val2.indexOf("Sample")).not.toBeLessThan(0);
    });

    describe("Dom elements", function () {

        it("creates div by default", function () {

            expect(Some.DomElement().is("div")).toBeTruthy();
        });

        it("can create other tags", function () {

            expect(Some.DomElement("a").is("a")).toBeTruthy();
        });
    });
});


