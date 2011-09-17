/// <reference path="../Intellisense.js" />


describe("FakeJsfIoc", function () {

    function Foo() {
    };

    Foo.prototype = {
        Run: function () {
        }
    };

    function Bar() {
    };

    var ioc;
    var sut;

    beforeEach(function () {

        ioc = new JsfIoc();

        ioc.Register("_foo").withConstructor(Foo);
        ioc.Register("_bar").withConstructor(Bar).withDependencies("_foo");
        ioc.Register("_fooInstance").withInstance(new Foo());

        sut = new FakeJsfIoc(ioc);
    });

    it("services can be loaded by registered name or constructor", function () {

        var foo1 = sut.Load(Foo);
        var foo2 = sut.Load("_foo");

        expect(foo1.constructor).toEqual(Foo);
        expect(foo2.constructor).toEqual(Foo);
        expect(foo1).not.toBe(foo2);
    });

    it("services can be preloaded, then are effectively singletons", function () {
        var foo1 = sut.Preload(Foo);
        var foo2 = sut.Preload("_foo");
        var bar1 = sut.Preload(Bar);
        var bar2 = sut.Load("_bar");
        var bar3 = sut.Load("_bar");

        // preloaded services are singletons
        expect(foo1).toBe(foo2);

        // loaded services are not- a new one is returned per call to Load()
        expect(bar1).not.toBe(bar2);
        expect(bar2).not.toBe(bar1);

        // the preloaded service is available to loaded services
        expect(bar1._foo).toBe(foo1);
    });

    it("configuration parameters can be passed on Load()", function () {

        function ClassWithInitializationParameters() {
            this._aOnConstructor = this._a;
        };

        ioc.Register("_some").withConstructor(ClassWithInitializationParameters).withParameters("_a", "_b", "_c");

        var result = sut.Load(ClassWithInitializationParameters, 1, 2, 3);

        expect(result._a).toEqual(1);
        expect(result._b).toEqual(2);
        expect(result._c).toEqual(3);

        expect(result._aOnConstructor).toEqual(1);
    });

    describe("Test doubles are provided for each dependency", function () {

        it("TestDoublePolicy, which determines behavior of new test doubles, defaults to using stubs (calls succeed, returning undefined)", function () {

            expect(sut.TestDoublePolicy).toBeDefined();
            expect(sut.TestDoublePolicy).toEqual(FakeJsfIoc.StubBehavior);
        });

        it("Change TestDoublePolicy's value to change test double", function () {

            var functionTestDouble = {};

            spyOn(sut, "TestDoublePolicy").andReturn(functionTestDouble);

            var bar = sut.Load(Bar);

            expect(sut.TestDoublePolicy).toHaveBeenCalledWith("_foo", "Run");
            expect(bar._foo.Run).toBe(functionTestDouble);
        });

        it("stub behavior doesn't do anything", function () {

            var behavior = FakeJsfIoc.StubBehavior("_foo", "Run");

            expect(behavior()).not.toBeDefined();
        });

        it("mock behavior throws an exception", function () {

            var behavior = FakeJsfIoc.MockBehavior("_foo", "Run");

            expect(function () {
                behavior(1, 2, 3);
            }).toThrow("Unexpected call to _foo.Run() with 3 parameters");
        });

        it("useful error message if you specify a non-existing service", function () {

            function Unregistered_service() {
            }

            expect(function () {
                var behavior = sut.LoadTestDouble(Unregistered_service);
            }).toThrow("FakeJsfIoc could not find service: " + Unregistered_service.toString());
        });

        it("useful error message if you specify a non-existing service", function () {

            expect(function () {
                var behavior = sut.LoadTestDouble("Unregistered_service");
            }).toThrow("FakeJsfIoc could not find service: Unregistered_service");
        });
    });

    describe("Dependencies can be loaded to customize the test (spying, stubing, etc)", function () {

        describe("Test doubles can be loaded for services", function () {
            it("by the service name", function () {

                var functionTestDouble = {};

                spyOn(sut, "TestDoublePolicy").andReturn(functionTestDouble);

                var preloadedService = sut.LoadTestDouble("_foo");

                expect(sut.TestDoublePolicy).toHaveBeenCalledWith("_foo", "Run");
                expect(preloadedService.Run).toBe(functionTestDouble);
            });

            it("by the service class", function () {

                var functionTestDouble = {};

                spyOn(sut, "TestDoublePolicy").andReturn(functionTestDouble);

                var preloadedService = sut.LoadTestDouble(Foo);

                expect(sut.TestDoublePolicy).toHaveBeenCalledWith("_foo", "Run");
                expect(preloadedService.Run).toBe(functionTestDouble);
            });
        });

        describe("Test doubles can be loaded for services registered with RegisterInstance()", function () {
            it("by the service name", function () {

                var functionTestDouble = {};

                spyOn(sut, "TestDoublePolicy").andReturn(functionTestDouble);

                var preloadedService = sut.LoadTestDouble("_fooInstance");

                expect(sut.TestDoublePolicy).toHaveBeenCalledWith("_fooInstance", "Run");
                expect(preloadedService.Run).toBe(functionTestDouble);
            });
        });

        it("The test double is used to satisfy dependencies for the system under test", function () {

            var preloadedService = sut.LoadTestDouble("_foo");

            var service = sut.Load(Bar);

            expect(service._foo).toBe(preloadedService);
        });

        it("LoadTestDouble is idempotent", function () {

            var preloadedService1 = sut.LoadTestDouble("_foo");
            var preloadedService2 = sut.LoadTestDouble("_foo");

            expect(preloadedService1).toBeDefined();
            expect(preloadedService1).toBe(preloadedService2);
        });
    });

    describe("use IncludeReal load other required services directly(without test doubles)", function () {

        it("pass in an array of service names", function () {
            var result = sut.IncludeReal(["_foo"]).Load(Bar);

            spyOn(Foo.prototype, "Run");

            result._foo.Run();

            expect(Foo.prototype.Run).toHaveBeenCalled();
        });

        it("pass in a single service name", function () {
            var result = sut.IncludeReal("_foo").Load(Bar);

            spyOn(Foo.prototype, "Run");

            result._foo.Run();

            expect(Foo.prototype.Run).toHaveBeenCalled();
        });
    });

    describe("Event sources have their notify function added", function () {

        function Source() {
        };

        it("_notifyEVENTNAME() is added according to the current test double policy", function () {

            ioc.Register("_source").withConstructor(Source).sendingEvents("Initialize");

            sut.TestDoublePolicy = FakeJsfIoc.MockBehavior;

            var result = sut.Load(Source);

            expect(function () {
                result._notifyInitialize(1, 2, 3);
            }).toThrow("Unexpected call to Source._notifyInitialize() with 3 parameters");
        });
    });

    describe("Can overload any instance", function () {

        it("RegisterInstance can set a service", function () {

            var expectedFoo = { a: 1 };

            sut.RegisterInstance("_foo", expectedFoo);

            var bar = sut.Load(Bar);

            expect(bar._foo).toEqual(expectedFoo);
        });

        it("RegisterInstance fails if the service is already set", function () {

            sut.Load(Bar);

            expect(function () {
                sut.RegisterInstance("_foo", {});
            }).toThrow("Service _foo already has a test definition");
        });
    });
});