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


    it("can pass initialization parameters", function () {

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

    describe("provides test doubles for each dependency", function () {

        it("default test double behavior is to be a stub (succeed, returning undefined)", function () {

            expect(sut.TestDoublePolicy).toBeDefined();
            expect(sut.TestDoublePolicy).toEqual(FakeJsfIoc.StubBehavior);
        });

        it("you can change the test double behavior", function () {

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

    describe("Can preload dependencies, allowing them to be initialized for the test", function () {

        describe("Dependencies can be preloaded.", function () {
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

        it("The preloaded dependency is used initializing the service we want to test", function () {

            var preloadedService = sut.LoadTestDouble("_foo");

            var service = sut.Load(Bar);

            expect(service._foo).toBe(preloadedService);
        });

        it("Preload is idempotent", function () {

            var preloadedService1 = sut.LoadTestDouble("_foo");
            var preloadedService2 = sut.LoadTestDouble("_foo");

            expect(preloadedService1).toBeDefined();
            expect(preloadedService1).toBe(preloadedService2);
        });
    });

    describe("Fake message broker behavior", function () {

        function Source() {
        };

        it("if a service is an event source, the _notify<EventName> member is a mock", function () {

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

    describe("services can have configuration parameters they receive on startup", function () {

        it("Register and load a service with an initialization parameter", function () {

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

        it("Services can have their configuration values set before they are loaded", function () {

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

        describe("service parameters can have validation", function () {

            function IntegerParameter(name) {
                return {
                    name: name,
                    validator: function (value) {
                        return typeof(value) == "number";
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

            it("Configure() rejects invalid parameters", function () {

                expect(function () {
                    sut.Configure("_foo", "five");
                }).toThrow("Invalid parameter passed to _foo.");
            });

            it("Load() accepts valid parameters", function () {

                var instance = sut.Load("_foo", 65);

                expect(instance._parameter).toEqual(65);
            });

            it("Load() rejects invalid parameters", function () {

                expect(function () {
                    sut.Load("_foo", "five");
                }).toThrow("Invalid parameter passed to _foo.");
            });
        });
    });

    it("Register and load a singleton", function () {

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

    it("Services are not singletons by default", function () {

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

    it("Register and load an instance", function () {

        var instance = new Foo();

        var sut = new JsfIoc();

        sut.RegisterInstance("_foo", instance);

        var result = sut.Load("_foo");

        expect(result).toBe(instance);
    });

    describe("Descriptive exceptions for common failures", function () {

        var sut;

        beforeEach(function () {

            sut = new JsfIoc();
        });

        describe("check parameters Register()", function () {

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

        describe("check parameters that name an existing service", function () {

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

    describe("Message broker behavior", function () {
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

        it("source has member _notify<EventName> added", function () {

            var source = sut.Load("_source");

            expect(source._notifyInitialize).toEqual(jasmine.any(Function));
        });

        it("function _notify<EventName> calls listeners", function () {

            var source = sut.Load("_source");

            spyOn(Listener.prototype, "OnInitialize");

            source._notifyInitialize();

            expect(Listener.prototype.OnInitialize).toHaveBeenCalled();
        });

        it("function _notify<EventName> passes parameters to listeners", function () {

            var source = sut.Load("_source");

            spyOn(Listener.prototype, "OnInitialize");

            source._notifyInitialize(1, 2, 3);

            expect(Listener.prototype.OnInitialize).toHaveBeenCalledWith(1, 2, 3);
        });

        describe("listeners can be called directly with the ioc container", function () {

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
