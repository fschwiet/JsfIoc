/// <reference path="../Intellisense.js" />

describe("GraphVizFormatting", function () {

    function Foo() {
    }

    function Bar() {
    }

    it("can format a registered instance", function () {

        var ioc = new JsfIoc();

        ioc.RegisterInstance("_foo", {});

        var sut = new GraphVizFormatting(ioc);

        var result = sut.GetBinding("_foo");

        expect(result).toEqual('_foo [ shape="record", label="_foo | (instance)" ]');
    });

    describe("can format registered services", function () {

        it("that are plain", function () {
            var ioc = new JsfIoc();

            ioc.Register({
                service: Foo,
                name: "_foo"
            });

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo" ]');
        });

        it("that have eventSource", function () {

            var ioc = new JsfIoc();

            ioc.Register({
                service: Foo,
                name: "_foo",
                eventSource: ["eject"]
            });

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo | eject \\>" ]');
        });

        it("that have many eventSources", function () {

            var ioc = new JsfIoc();

            ioc.Register({
                service: Foo,
                name: "_foo",
                eventSource: ["one", "two", "three", "four", "five"]
            });

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo | five four one three \\> | two \\>" ]');
        });

        it("that have eventListener", function () {

            var ioc = new JsfIoc();

            ioc.Register({
                service: Foo,
                name: "_foo",
                eventListener: ["eject"]
            });

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo | \\> eject" ]');
        })

        it("that have many eventListeners", function () {

            var ioc = new JsfIoc();

            ioc.Register({
                service: Foo,
                name: "_foo",
                eventListener: ["one", "two", "three", "four", "five"]
            });

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo | \\> five four one three | \\> two" ]');
        })

        it("that have dependencies", function () {

            var ioc = new JsfIoc();

            ioc.Register({
                service: Foo,
                name: "_foo",
                requires: ["_bar", "_baz"]
            });

            ioc.Register({
                service: Bar,
                name: "_bar"
            });

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo" ]; Foo -> Bar; Foo -> _baz');
        });
    });

    it("can format a registered service", function () {

        var ioc = new JsfIoc();

        ioc.Register({
            service: Foo,
            name: "_foo"
        });

        var sut = new GraphVizFormatting(ioc);

        var result = sut.GetBinding("_foo");

        expect(result).toEqual('Foo [ shape="record", label="Foo" ]');
    });
});