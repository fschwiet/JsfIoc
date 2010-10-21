/// <reference path="../lib/jasmine-0.11.1/jasmine.js" />
/// <reference path="../Intellisense.js" />

describe("GraphVizFormatting", function () {

    function Foo() {
    }

    it("can format a registered instance", function () {

        var ioc = new JsfIoc();

        ioc.RegisterInstance("_foo", {});

        var sut = new GraphVizFormatting(ioc);

        var result = sut.GetBinding("_foo");

        expect(result).toEqual('_foo [ shape="record"; label="_foo | (instance)" ]');
    });

    it("can format a registered service", function () {

        var ioc = new JsfIoc();

        ioc.Register({
            service: Foo,
            name: "_foo"
        });

        var sut = new GraphVizFormatting(ioc);

        var result = sut.GetBinding("_foo");

        expect(result).toEqual('_foo [ shape="record"; label="Foo" ]');
    });

});