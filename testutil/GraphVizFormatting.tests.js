/// <reference path="../Intellisense.js" />

describe("GraphVizFormatting", function () {

    function Foo() {
    }

    function Bar() {
    }
/*
    it("can format a registered instance", function () {

        var ioc = new JsfIoc();

        ioc.Register("_foo").withInstance({});

        var sut = new GraphVizFormatting(ioc);

        var result = sut.GetBinding("_foo");

        expect(result).toEqual('_foo [ shape="record", label="_foo | (instance)" ]');
    });

    describe("can format registered services", function () {

        it("that are plain", function () {

            var ioc = new JsfIoc();

            ioc.Register("_foo").withConstructor(Foo);

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo" ]');
        });

        it("that have eventSource", function () {

            var ioc = new JsfIoc();

            ioc.Register("_foo").withConstructor(Foo).sendingEvents("eject");

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo<br/><font point-size="8">eject</font>" ]');
        });

        */
        /*
        it("that have many eventSources", function () {

            var ioc = new JsfIoc();

            ioc.Register("_foo").withConstructor(Foo).sendingEvents("one", "two", "three", "four", "five");

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo | five four one three \\> | two \\>" ]');
        });

        it("that have eventListener", function () {

            var ioc = new JsfIoc();

            ioc.Register("_foo").withConstructor(Foo).receivingEvents("eject");
            
            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo | \\> eject" ]');
        })

        it("that have many eventListeners", function () {

            var ioc = new JsfIoc();

            ioc.Register("_foo").withConstructor(Foo).receivingEvents("one", "two", "three", "four", "five");
            
            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo | \\> five four one three | \\> two" ]');
        })

        */
        /*
        it("that have dependencies", function () {

            var ioc = new JsfIoc();

            ioc.Register("_foo").withConstructor(Foo).withDependencies("_bar", "_baz");
            ioc.Register("_bar").withConstructor(Bar);

            var sut = new GraphVizFormatting(ioc);

            var result = sut.GetBinding("_foo");

            expect(result).toEqual('Foo [ shape="record", label="Foo" ]; Foo -> Bar; Foo -> _baz');
        });
    });

    it("can format a registered service", function () {

        var ioc = new JsfIoc();

        ioc.Register("_foo").withConstructor(Foo);

        var sut = new GraphVizFormatting(ioc);

        var result = sut.GetBinding("_foo");

        expect(result).toEqual('Foo [ shape="record", label="Foo" ]');
    });
    */
});