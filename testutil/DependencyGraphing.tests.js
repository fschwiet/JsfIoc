/// <reference path="..\Intellisense.js"/>


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

    window.GetSampleIoc = function () {
        var ioc = new JsfIoc();

        ioc.Register("Foo").withConstructor(Foo)
            .receivingEvents("Initialize", "Go", "Stop", "Record", "Rewind", "Eject", "Alt-Tab", "Tune")
            .receivingEvents("Initialize", "Go", "Stop", "Record", "Rewind", "Eject", "Alt-Tab", "Tune");
        ioc.Register("Bar").withConstructor(Bar);
        ioc.Register("Baz").withInstance(new Baz());

        ioc.Register("FooBar").withConstructor(FooBar).withDependencies("Foo", "Bar").receivingEvents("init").sendingEvents("eject");
        
        ioc.Register("BarBaz").withConstructor(BarBaz).withDependencies("Bar", "Baz");

        ioc.Register("FooBarbazBarBaz").withConstructor(FooBarbazBarBaz).withDependencies("Foo", "BarBaz", "Bar", "Baz");

        return ioc;
    }

    beforeEach(function () {

        sut = new DependencyGrapher(GetSampleIoc());
    });

    it("GetRegisteredServices", function () {

        expect(sut.GetRegisteredServices()).toEqual(["Foo", "Bar", "FooBar", "BarBaz", "FooBarbazBarBaz"]);
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

    it("GetSortValue - sort order is the order services are declared, followed by instances", function () {

        expect(sut.GetSortValue("Foo")).toEqual(0);
        expect(sut.GetSortValue("Bar")).toEqual(1);
        expect(sut.GetSortValue("FooBar")).toEqual(2);
        expect(sut.GetSortValue("BarBaz")).toEqual(3);
        expect(sut.GetSortValue("FooBarbazBarBaz")).toEqual(4);
        expect(sut.GetSortValue("Baz")).toEqual(5);
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

    it("SimpleGraph", function () {

        var expected = '\
FooBarbazBarBaz\n\
    BarBaz\n\
        Bar\n\
        Baz\n\
    Foo\n\
    Bar\n\
    Baz\n\
FooBar\n\
    Foo\n\
    Bar\n\
';

        var result = sut.SimpleGraph();

        expect(result).toEqual(expected);
    });
});