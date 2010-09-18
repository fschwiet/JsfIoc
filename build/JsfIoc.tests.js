// FakeJsfIoc.tests.js


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

        ioc.Register({
            name: "_foo",
            service: Foo
        });

        ioc.Register({
            name: "_bar",
            service: Bar,
            requires: ["_foo"]
        });

        sut = new FakeJsfIoc(ioc);
    });


    it("configuration parameters can be passed on Load()", function () {

        function ClassWithInitializationParameters() {
        };

        ioc.Register({
            name: "_some",
            service: ClassWithInitializationParameters,
            parameters: ["_a", "_b", "_c"]
        });

        var result = sut.Load(ClassWithInitializationParameters, 1, 2, 3);

        expect(result._a).toEqual(1);
        expect(result._b).toEqual(2);
        expect(result._c).toEqual(3);
    });

    describe("Test doubles are provided for each dependency", function () {

        it("default test double behavior is to be a stub (succeed, returning undefined)", function () {

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
                var behavior = sut.LoadTestDouble(Unregistered_service, "Run");
            }).toThrow("FakeJsfIoc could not find service: " + Unregistered_service.toString());
        });
    });

    describe("Dependencies can be loaded to customize the test (spying, stubing, etc)", function () {

        describe("Test doubles can be loaded", function () {
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

    describe("Can load mulitiple components for the test (instead of just test doubles)", function () {

        it("IncludeReal indicates services to be loaded as defined (not as test doubles)", function () {

            var result = sut.IncludeReal(["_foo"]).Load(Bar);

            spyOn(Foo.prototype, "Run");

            result._foo.Run();

            expect(Foo.prototype.Run).toHaveBeenCalled();
        });
    });

    describe("Event sources have their notify function added", function () {

        function Source() {
        };

        it("_notifyEVENTNAME() is added according to the current test double policy", function () {

            ioc.Register({
                service: Source,
                name: "_source",
                eventSource: ["Initialize"]
            });

            sut.TestDoublePolicy = FakeJsfIoc.MockBehavior;

            var result = sut.Load(Source);

            expect(function () {
                result._notifyInitialize(1, 2, 3);
            }).toThrow("Unexpected call to function Source._notifyInitialize() with 3 parameters");
        });
    });
});
// JsfIoc.tests.js

describe("JsfIoc", function () {

    function Foo() {
    };

    function Bar() {
    };

    it("Register and load a minimal service", function () {

        var sut = new JsfIoc();

        sut.Register({
            name: "_foo",
            service: Foo
        });

        var result = sut.Load("_foo");

        expect(result instanceof Foo).toBeTruthy();
    });

    it("Register and load a service with a dependency", function () {

        var sut = new JsfIoc();

        sut.Register({
            name: "_bar",
            service: Bar
        });

        sut.Register({
            name: "_foo",
            service: Foo,
            requires: ["_bar"]
        });

        var result = sut.Load("_foo");

        expect(result._bar instanceof Bar).toBeTruthy();
    });

    describe("services can have parameters to be determined later", function () {

        it("The parameters can be specified when a service is Load()d", function () {

            var parameterValue = "123abc";

            var sut = new JsfIoc();

            sut.Register({
                name: "_foo",
                service: Foo,
                parameters: ["_fooLevel"]
            });

            var result = sut.Load("_foo", parameterValue);

            expect(result._fooLevel).toEqual(parameterValue);
        });

        it("parameters can be set before Load() using Configure()", function () {

            var parameterValue = "123abc";

            var sut = new JsfIoc();

            sut.Register({
                name: "_foo",
                service: Foo,
                parameters: ["_fooLevel"]
            });

            sut.Configure("_foo", parameterValue);

            var result = sut.Load("_foo");

            expect(result._fooLevel).toEqual(parameterValue);
        });

        describe("Parameters can have validation", function () {

            function IntegerParameter(name) {
                return {
                    name: name,
                    validator: function (value) {
                        return typeof (value) == "number";
                    }
                };
            }

            var sut;

            beforeEach(function () {

                sut = new JsfIoc();

                sut.Register({
                    service: Foo,
                    name: "_foo",
                    parameters: [IntegerParameter("_parameter")]
                });
            });

            it("Configure() accepts valid parameters", function () {

                sut.Configure("_foo", 5);

                var instance = sut.Load("_foo");

                expect(instance._parameter).toEqual(5);
            });

            it("Configure() rejects invalid parameters by throwing an exception", function () {

                expect(function () {
                    sut.Configure("_foo", "five");
                }).toThrow("Invalid parameter #1 passed to _foo.");
            });

            it("Load() accepts valid parameters", function () {

                var instance = sut.Load("_foo", 65);

                expect(instance._parameter).toEqual(65);
            });

            it("Load() rejects invalid parameters by throwing an exception", function () {

                expect(function () {
                    sut.Load("_foo", "five");
                }).toThrow("Invalid parameter #1 passed to _foo.");
            });
        });
    });

    describe("Service instance lifetime", function () {
        it("A service may be registered as a singleton", function () {

            var initialValue = "abc123";

            var sut = new JsfIoc();

            sut.Register({
                name: "_foo",
                service: Foo,
                singleton: true
            });

            var result1 = sut.Load("_foo");
            var result2 = sut.Load("_foo");

            expect(result1).toBe(result2);
        });

        it("Services, by default, are not singletons", function () {

            var initialValue = "abc123";

            var sut = new JsfIoc();

            sut.Register({
                name: "_foo",
                service: Foo
            });

            var result1 = sut.Load("_foo");
            var result2 = sut.Load("_foo");

            expect(result1).not.toBe(result2);
        });
    });

    it("A service instance can be registered", function () {

        var instance = new Foo();

        var sut = new JsfIoc();

        sut.RegisterInstance("_foo", instance);

        var result = sut.Load("_foo");

        expect(result).toBe(instance);
    });

    describe("Common developer mistakes throw descriptive exceptions", function () {

        var sut;

        beforeEach(function () {

            sut = new JsfIoc();
        });

        describe("for Register()", function () {

            it("Parameter 'name' should be a string", function () {

                expect(function () {
                    sut.Register({});
                }).toThrow("Register must be called with string parameter 'name'");
            });

            it("Parameter 'service' should be a function", function () {

                expect(function () {
                    sut.Register({ name: "xyz321" });
                }).toThrow("Register must be called with function parameter 'service'");
            });
        });

        describe("invalid service references are identified", function () {

            it("for Load()", function () {

                expect(function () {
                    sut.Load("_undefinedService");
                }).toThrow("Load was called for undefined service '_undefinedService'.");
            });

            it("for Configure()", function () {
                expect(function () {
                    sut.Configure("_anotherUndefinedService");
                }).toThrow("Configure was called for undefined service '_anotherUndefinedService'.");
            });
        });
    });

    describe("Simple event dispatching", function () {

        function Source() {
        }

        function Listener() {
        };

        Listener.prototype.OnInitialize = function () { }

        var sut;

        beforeEach(function () {

            sut = new JsfIoc();

            sut.Register({
                service: Source,
                name: "_source",
                eventSource: ["Initialize"]
            });

            sut.Register({
                service: Listener,
                name: "_listener",
                eventListener: ["Initialize"]
            });
        });

        describe("The event source uses _notifyEVENTNAME() to notify listeners", function () {

            var source;

            beforeEach(function () {
                source = sut.Load("_source");
            });

            it("source has _notifyEVENTNAME() injected as a property", function () {

                expect(source._notifyInitialize).toEqual(jasmine.any(Function));
            });

            it("_notifyEVENTNAME() notifies listeners", function () {

                var source = sut.Load("_source");

                spyOn(Listener.prototype, "OnInitialize");

                source._notifyInitialize();

                expect(Listener.prototype.OnInitialize).toHaveBeenCalled();
            });

            it("_notifyEVENTNAME() can pass event parameters", function () {

                var source = sut.Load("_source");

                spyOn(Listener.prototype, "OnInitialize");

                source._notifyInitialize(1, 2, 3);

                expect(Listener.prototype.OnInitialize).toHaveBeenCalledWith(1, 2, 3);
            });
        });

        describe("Listeners can be called directly with the ioc container", function () {

            it("with parameters", function () {
                spyOn(Listener.prototype, "OnInitialize");

                sut.NotifyEvent("Initialize", [1, 2, 3]);

                expect(Listener.prototype.OnInitialize).toHaveBeenCalledWith(1, 2, 3);
            });

            it("without parameters", function () {
                spyOn(Listener.prototype, "OnInitialize");

                sut.NotifyEvent("Initialize");

                expect(Listener.prototype.OnInitialize).toHaveBeenCalled();
            });
        });
    });
});
// ParameterTypes.tests.js

describe("JQueryElementParameter", function () {

    var parameter;

    beforeEach(function () {

        parameter = JQueryElementParameter("_foo");
    });

    it("uses the input parameter as its name", function () {

        expect(parameter.name).toEqual("_foo");
    });

    it("a single jQuery collections is valid", function () {

        expect(parameter.validator($("<div></div>"))).toBeTruthy();
    });

    it("multiple jQuery elements are not invalid", function () {

        expect(parameter.validator($("<div></div><div></div>"))).not.toBeTruthy();
    });

    it("other stuff is considered invalid", function () {

        expect(parameter.validator()).not.toBeTruthy();
        expect(parameter.validator(null)).not.toBeTruthy();
        expect(parameter.validator(1)).not.toBeTruthy();
        expect(parameter.validator([1])).not.toBeTruthy();
    });

});
