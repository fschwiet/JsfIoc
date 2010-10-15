
beforeEach(function(){
    this.addMatchers({
        toDeepEqual: function(expected) {
            return JSON.stringify(this.actual) == JSON.stringify(expected);
        }
    });
});


describe("dependency graphing", function () {

    function Foo() {
    }

    function Bar() {
    }

    function Baz() {
    }

    function FooBar() {
    }

    function BarBaz() {
    }

    function FooBarbazBarBaz() {
    }

    var ioc;
    var sut;

    beforeEach(function () {

        ioc = new JsfIoc();

        ioc.Register({
            name: "Foo",
            service: Foo
        });

        ioc.Register({
            name: "Bar",
            service: Bar
        });

        ioc.Register({
            name: "Baz",
            service: Baz
        });

        ioc.Register({
            name: "FooBar",
            service: FooBar,
            requires: ["Foo", "Bar"]
        });

        ioc.Register({
            name: "BarBaz",
            service: BarBaz,
            requires: ["Bar", "Baz"]
        });

        ioc.Register({
            name: "FooBarbazBarBaz",
            service: FooBarbazBarBaz,
            requires: ["Foo", "BarBaz", "Bar", "Baz"]
        });

        sut = new DependencyGrapher(ioc);
    });

    it("GetRegisteredServices", function () {

        expect(sut.GetRegisteredServices()).toEqual(["Foo", "Bar", "Baz", "FooBar", "BarBaz", "FooBarbazBarBaz"]);
    });

    describe("GetTopLevelServices", function () {
        it("return services that are not depended on", function () {

            expect(sut.GetTopLevelServices()).toEqual(["FooBar", "FooBarbazBarBaz"]);
        });
    });

    it("GetWeightOfDependencies", function () {
        expect(sut.GetWeightOfDependencies("Foo")).toEqual(1);
        expect(sut.GetWeightOfDependencies("Bar")).toEqual(1);
        expect(sut.GetWeightOfDependencies("Baz")).toEqual(1);
        expect(sut.GetWeightOfDependencies("FooBar")).toEqual(3);
        expect(sut.GetWeightOfDependencies("BarBaz")).toEqual(3);
        expect(sut.GetWeightOfDependencies("FooBarbazBarBaz")).toEqual(7);
        // Bar, Baz are counted twice for FooBarbazBarBaz just because it is asier to implement
    });

    it("GetSortValue - sort order is the order services are declared", function () {

        expect(sut.GetSortValue("Foo")).toEqual(0);
        expect(sut.GetSortValue("Bar")).toEqual(1);
        expect(sut.GetSortValue("Baz")).toEqual(2);
        expect(sut.GetSortValue("FooBar")).toEqual(3);
        expect(sut.GetSortValue("BarBaz")).toEqual(4);
        expect(sut.GetSortValue("FooBarbazBarBaz")).toEqual(5);
    });

    it("VisitDependencies", function () {

        var visitedCalls = [];

        var visitor = function () {
            visitedCalls.push($.makeArray(arguments));
        }

        sut.VisitDependencies(visitor);

        expect(visitedCalls).toDeepEqual([
            ["FooBarbazBarBaz", null, 0],
            ["BarBaz", "FooBarbazBarBaz", 1],
            ["Bar", "BarBaz", 2],
            ["Baz", "BarBaz", 2],
            ["Foo", "FooBarbazBarBaz", 1],
            ["Bar", "FooBarbazBarBaz", 1],
            ["Baz", "FooBarbazBarBaz", 1],
            ["FooBar", null, 0],
            ["Foo", "FooBar", 1],
            ["Bar", "FooBar", 1]
        ]);
    });
});