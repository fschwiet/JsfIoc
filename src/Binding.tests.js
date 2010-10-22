/// <reference path="Binding.js"/>


describe("Binding", function () {

    it("has some defaults", function () {

        var sut = new Binding();

        expect(sut.requires).toEqual([]);
        expect(sut.parameters).toEqual([]);
        expect(sut.singleton).toEqual(false);
        expect(sut.eventSource).toEqual([]);
        expect(sut.eventListener).toEqual([]);
    });

    describe("has a friendly name", function () {

        it("which is the constructor's name, if available", function () {

            function Foo() { }

            var sut = new Binding();
            sut.service = Foo;

            expect(sut.GetFriendlyName()).toEqual("Foo");
        });

        it("otherwise, its the service name", function () {

            function Foo() { }

            var sut = new Binding();
            sut.service = function () { };
            sut.name = "someServiceName";

            expect(sut.GetFriendlyName()).toEqual("someServiceName");
        });
    });
});