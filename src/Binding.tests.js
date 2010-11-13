/// <reference path="..\Intellisense.js"/>


describe("BindingStart", function () {

    function Foo() {
    }

    var ioc;

    beforeEach(function () {
        ioc = new JsfIoc();
    });

    it("takes a service identifier as input", function () {

        var sut = new BindingStart(ioc, "someServiceName");

        expect(sut.name).toEqual("someServiceName");
    });

    it("has a fluent interface", function () {

        var sut = new BindingStart(ioc, "someServiceName");

        expect(Binding.prototype.isFluent).toEqual(true);
    });

    it("can specify a constructor", function () {

        spyOn(ioc, "RegBinding");

        var binding = new BindingStart(ioc, "someServiceName").withConstructor(Foo);

        expect(ioc.RegBinding).toHaveBeenCalledWith(binding);
        expect(binding.name).toEqual("someServiceName");
        expect(binding.service).toEqual(Foo);
    });

    it("can specify an instance", function () {

        spyOn(ioc, "RegisterInstance");

        var instance = new Foo();

        new BindingStart(ioc, "someServiceName").withInstance(instance);

        expect(ioc.RegisterInstance).toHaveBeenCalledWith("someServiceName", instance);
    });
});


describe("Binding", function () {

    function Foo() {
    }

    it("takes the service name on construction", function () {

        var binding = new Binding("serviceName");

        expect(binding.name).toEqual("serviceName");
    });

    it("has a fluent interface", function () {

        var sut = new BindingStart(ioc, "someServiceName");

        expect(Binding.prototype.isFluent).toEqual(true);
    });

    it("can specify dependencies", function () {

        var binding = new Binding("serviceName").withDependencies(1, 2, 3);

        expect(binding.requires).toEqual([1, 2, 3]);
    });

    it("can specify parameters", function () {

        var binding = new Binding("serviceName").withParameters(1, 2, 3);

        expect(binding.parameters).toEqual([1, 2, 3]);
    });

    it("can load component as a singleton", function () {

        var binding = new Binding("serviceName").asSingleton();

        expect(binding.singleton).toEqual(true);
    });

    it("can specify events sourced from this component", function () {

        var binding = new Binding("serviceName").sendingEvents(1, 2, 3);

        expect(binding.eventSource).toEqual([1, 2, 3]);
    })

    it("can specify events received by this component", function () {

        var binding = new Binding("serviceName").receivingEvents(1, 2, 3);

        expect(binding.eventListener).toEqual([1, 2, 3]);
    })

    describe("has a friendly name", function () {

        it("which is the constructor's name, if available", function () {

            var sut = new Binding("someServiceName");
            sut.service = Foo;

            expect(sut.GetFriendlyName()).toEqual("Foo");
        });

        it("otherwise, its the service name", function () {

            function Foo() { }

            var sut = new Binding("someServiceName");
            sut.service = function () { };

            expect(sut.GetFriendlyName()).toEqual("someServiceName");
        });
    });
});
