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

    it("can give friendly name", function () {

        function Foo() { }

        var sut = new Binding();
        sut.service = Foo;

        expect(sut.GetFriendlyName()).toEqual("Foo");
    });
});