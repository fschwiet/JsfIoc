// license.txt
/*********************************************************************

(this is the MIT license)

Copyright (c) 2010 Frank Schwieterman

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**********************************************************************/
// Binding.tests.js
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

        expect(sut._name).toEqual("someServiceName");
    });

    it("has a fluent interface", function () {

        var sut = new BindingStart(ioc, "someServiceName");

        expect(Binding.prototype.isFluent).toEqual(true);
    });

    it("can specify a constructor", function () {

        spyOn(ioc, "RegBinding");

        var binding = new BindingStart(ioc, "someServiceName").withConstructor(Foo);

        expect(ioc.RegBinding).toHaveBeenCalledWith(binding);
        expect(binding._name).toEqual("someServiceName");
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

        expect(binding._name).toEqual("serviceName");
    });

    it("has a fluent interface", function () {

        var sut = new BindingStart(ioc, "someServiceName");

        expect(Binding.prototype.isFluent).toEqual(true);
    });

    it("can specify dependencies", function () {

        var binding = new Binding("serviceName").withDependencies(1, 2, 3);

        expect(binding._requires).toEqual([1, 2, 3]);
    });

    it("can specify parameters", function () {

        var binding = new Binding("serviceName").withParameters(1, 2, 3);

        expect(binding._parameters).toEqual([1, 2, 3]);
    });

    it("can load component as a singleton", function () {

        var binding = new Binding("serviceName").asSingleton();

        expect(binding._singleton).toEqual(true);
    });

    it("can specify events sourced from this component", function () {

        var binding = new Binding("serviceName").sendingEvents(1, 2, 3);

        expect(binding._eventSource).toEqual([1, 2, 3]);
    })

    it("can specify events received by this component", function () {

        var binding = new Binding("serviceName").receivingEvents(1, 2, 3);

        expect(binding._eventListener).toEqual([1, 2, 3]);
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
// ExtendAsFluent.tests.js

describe("ExtendAsFluent", function() {
    function Foo() {
        ExtendAsFluent.PrototypeOf(Foo);
    }

    //ExtendAsFluent(Foo, {
    Foo.prototype = {
        setValue: function (value) {
            this._value = value;
        },
        getValue: function () {
            return this._value;
        }
    };

    Foo.prototype.Global = 3;

    var foo = new Foo();

    it("functions return values are stilled returned", function () {

        var expected = "123";

        var foo = new Foo();

        foo.setValue(expected);

        expect(foo.getValue()).toEqual(expected);

    });

    it("functions with no return value become fluent", function () {

        var foo = new Foo();

        expect(foo.setValue("123")).toEqual(foo);
    });

    it("non-functions are not modified", function() {

        var foo = new Foo();

        expect(Foo.prototype.Global).toEqual(3);
    });

    it("prototype is only extended once", function() {

        var fooA = new Foo();

        var firstSetValue = fooA.setValue;

        var fooB = new Foo();

        expect(firstSetValue).toBe(fooB.setValue);
    });
});
// JsfIoc.tests.js
/// <reference path="..\Intellisense.js"/>


describe("JsfIoc", function () {

    function Foo() {
    };

    function Bar() {
    };

    it("Register and load a minimal service", function () {

        var sut = new JsfIoc();

        sut.Register("_foo").withConstructor(Foo);

        var result = sut.Load("_foo");

        expect(result instanceof Foo).toBeTruthy();
    });

    it("Register and load a service with a dependency", function () {

        var sut = new JsfIoc();

        sut.Register("_bar").withConstructor(Bar);

        sut.Register("_foo").withConstructor(Foo).withDependencies("_bar");

        var result = sut.Load("_foo");

        expect(result._bar instanceof Bar).toBeTruthy();
    });

    it("can use dependencies within constructor", function () {

        function SupremeService() { };
        SupremeService.prototype.GetAnswer = function () { return 42; }

        function DependantService() {
            this._answer = this._supremeService.GetAnswer();
        }

        var sut = new JsfIoc();

        sut.Register("_supremeService").withConstructor(SupremeService);
        sut.Register("_dependantService").withConstructor(DependantService).withDependencies("_supremeService");

        var instance = sut.Load("_dependantService");

        expect(instance._answer).toEqual(42);
    });

    describe("services can have parameters to be determined later", function () {

        it("The parameters can be specified when a service is Load()d", function () {

            var parameterValue = "123abc";

            var sut = new JsfIoc();

            sut.Register("_foo").withConstructor(Foo).withParameters("_fooLevel");

            var result = sut.Load("_foo", parameterValue);

            expect(result._fooLevel).toEqual(parameterValue);
        });

        it("parameters can be set before Load() using Configure()", function () {

            var parameterValue = "123abc";

            var sut = new JsfIoc();

            sut.Register("_foo").withConstructor(Foo).withParameters("_fooLevel");

            sut.Configure("_foo", parameterValue);

            var result = sut.Load("_foo");

            expect(result._fooLevel).toEqual(parameterValue);
        });

        describe("parameters are available when the constructor runs", function () {

            var sut;

            var recordedParameter;
            function SomeClass() {
                recordedParameter = this._param;
            }

            beforeEach(function () {

                recordedParameter = null;

                sut = new JsfIoc();
                sut.Register("_someClass").withConstructor(SomeClass).withParameters("_param");
            });

            it("sets the parameter before running the constructor", function () {
                sut.Load("_someClass", 1289);
                expect(recordedParameter).toBe(1289);
            });

            it("doesnt change the objects type", function () {
                var someInstance = sut.Load("_someClass", 1289);
                expect(typeof (someInstance)).toEqual(typeof (new SomeClass()));
                expect(someInstance.constructor).toEqual((new SomeClass()).constructor);
            });
        });

        describe("Parameters can have validation", function () {

            var sut;

            beforeEach(function () {

                sut = new JsfIoc();

                sut.Register("_foo").withConstructor(Foo).withParameters(

                    sut.Parameter("_parameter").withValidator(
                        function (value) {
                            return typeof (value) == "number";
                        }));
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

        describe("Parameters can have a default value", function () {

            var sut;
            var defaultValue;

            beforeEach(function () {

                defaultValue = "456";

                sut = new JsfIoc();

                sut.Register("_foo").withConstructor(Foo).withParameters(
                    sut.Parameter("_parameter").withDefault(defaultValue));
            });

            it("the default is available for the parameter", function () {

                var foo = sut.Load("_foo");

                expect(foo._parameter).toEqual(defaultValue);
            });

            it("the default is provded by FakeIoc", function () {

                var fakeIoc = new FakeJsfIoc(sut);

                var foo = fakeIoc.Load(Foo);

                expect(foo._parameter).toEqual(defaultValue);
            });

            it("the default is not validated (not a requirement, but a warning)", function () {
            });
        });

        describe("Parameter can have validation that the parameter is a jQuery element containing 1 DOM element", function () {

            function someJQueryElement() {
                return $("<div></div>");
            }

            var sut;

            beforeEach(function () {

                sut = new JsfIoc();

                sut.Register("_foo").withConstructor(Foo).withParameters(
                    sut.Parameter("_parameter").asSingleJQueryElement());
            });

            it("a single jQuery collections is valid", function () {

                var expected = someJQueryElement();

                var foo = sut.Load("_foo", expected);

                expect(foo._parameter).toBe(expected);
            });

            it("multiple jQuery elements fail validation", function () {

                expect(function () {

                    var foo = sut.Load("_foo", $("<div></div><div></div>"));
                }).toThrow("Invalid parameter #1 passed to _foo.");
            });

            it("other stuff is considered invalid", function () {

                var otherStuff = [null, 1, [1], {}];

                for (var i = 0; i < otherStuff.length; i++) {

                    expect(function () {

                        var foo = sut.Load("_foo", otherStuff[i]);
                    }).toThrow("Invalid parameter #1 passed to _foo.");
                }
            });

            it("a default value is undefined", function () {

                var foo = sut.Load("_foo");
                expect(foo._parameter).not.toBeDefined();
            });
        });
    });

    describe("Service instance lifetime", function () {
        it("A service may be registered as a singleton", function () {

            var initialValue = "abc123";

            var sut = new JsfIoc();

            sut.Register("_foo").withConstructor(Foo).asSingleton();

            var result1 = sut.Load("_foo");
            var result2 = sut.Load("_foo");

            expect(result1).toBe(result2);
        });

        it("Services, by default, are not singletons", function () {

            var initialValue = "abc123";

            var sut = new JsfIoc();

            sut.Register("_foo").withConstructor(Foo);

            var result1 = sut.Load("_foo");
            var result2 = sut.Load("_foo");

            expect(result1).not.toBe(result2);
        });
    });

    it("A service instance can be registered", function () {

        var instance = new Foo();

        var sut = new JsfIoc();

        sut.Register("_foo").withInstance(instance);

        var result = sut.Load("_foo");

        expect(result).toBe(instance);
    });

    describe("Common developer mistakes throw descriptive exceptions", function () {

        var sut;

        beforeEach(function () {

            sut = new JsfIoc();
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

            sut.Register("_source").withConstructor(Source).sendingEvents("Initialize");
            sut.Register("_listener").withConstructor(Listener).receivingEvents("Initialize");
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

            it("bugfix: _notifyEVENTNAME() should create unique functional scope per _notify over-ride", function () {

                sut.Register("_multisource").withConstructor(Source).sendingEvents("AnotherEvent", "Initialize", "HelloWorld");

                spyOn(Listener.prototype, "OnInitialize");

                var source = sut.Load("_multisource");

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

    describe("Trace", function () {
        it("all trace calls are passed to a JsfTrace object", function () {

            var expectedParameter1 = 123;
            var expectedParameter2 = "abc";
            var expectedReturnValue = "123abc";

            spyOn(JsfTrace.prototype, "Trace").andReturn(expectedReturnValue);

            var sut = new JsfIoc();

            expect(sut.Trace(expectedParameter1, expectedParameter2)).toEqual(expectedReturnValue);

            expect(JsfTrace.prototype.Trace).toHaveBeenCalledWith(expectedParameter1, expectedParameter2);
            expect(JsfTrace.prototype.Trace.mostRecentCall.object).toEqual(jasmine.any(JsfTrace));
        });

        it("all trace calls are passed to the same JsfTrace object", function () {

            spyOn(JsfTrace.prototype, "Trace");

            var sut = new JsfIoc();

            sut.Trace();
            sut.Trace();

            expect(JsfTrace.prototype.Trace.argsForCall[0].object).toEqual(JsfTrace.prototype.Trace.argsForCall[1].object);
        });
    });
});
// JsfTrace.tests.js
/// <reference path="..\Intellisense.js"/>


describe("JsfTrace", function () {

    var sut;

    beforeEach(function () {
        sut = new JsfIoc();
        spyOn(sut._trace, "Log");
    });

    describe("when console is not defined", function () {

        it("doesnt blow up", function () {

        });
    });

    describe("when sut._trace.Log is not defined", function () {

        it("doesnt blow up", function () {

        });
    });

    describe("when console is defined", function () {

        function Foo() {
            this._property = Foo.OriginalProperty;
        }

        Foo.OriginalProperty = 123;

        Foo.prototype.Run = function () {
        };

        Foo.prototype.Throw = function () {
            throw "Farewell"
        };

        function Bar() {
        }

        Bar.prototype.Run = function () {
            this._foo.Run();
        };

        describe("can trace service calls", function () {

            it("when the trace is requested before service registration", function () {

                sut.Trace(Foo);

                sut.Register("_foo").withConstructor(Foo);

                sut.Load("_foo").Run();

                expect(sut._trace.Log).toHaveBeenCalled();
                expect(sut._trace.Log.argsForCall[0]).toEqual(["> Foo.Run()"]);
                expect(sut._trace.Log.argsForCall[1]).toEqual(["< Foo.Run (0ms)"]);
            });

            it("when the trace is requested before service instantiation", function () {

                sut.Register("_foo").withConstructor(Foo);

                sut.Trace(Foo);

                sut.Load("_foo").Run();

                expect(sut._trace.Log).toHaveBeenCalled();
                expect(sut._trace.Log.argsForCall[0]).toEqual(["> Foo.Run()"]);
                expect(sut._trace.Log.argsForCall[1]).toEqual(["< Foo.Run (0ms)"]);
            });

            it("when the trace is requested after singleton instantiation", function () {

                sut.Register("_foo").withConstructor(Foo).asSingleton();

                var foo = sut.Load("_foo");

                sut.Trace(Foo);

                foo.Run();

                expect(sut._trace.Log).toHaveBeenCalled();
                expect(sut._trace.Log.argsForCall[0]).toEqual(["> Foo.Run()"]);
                expect(sut._trace.Log.argsForCall[1]).toEqual(["< Foo.Run (0ms)"]);
            });
        });

        it("doesn't affect non-method service members", function () {

            sut.Trace(Foo);

            sut.Register("_foo").withConstructor(Foo);

            expect(sut.Load("_foo")._property).toEqual(Foo.OriginalProperty);
        });

        it("nested calls are spaced", function () {

            sut.Trace(Foo);
            sut.Trace(Bar);

            sut.Register("_foo").withConstructor(Foo);
            sut.Register("_bar").withConstructor(Bar).withDependencies("_foo");

            sut.Load("_bar").Run();

            expect(sut._trace.Log).toHaveBeenCalled();
            expect(sut._trace.Log.argsForCall[0]).toEqual(["> Bar.Run()"]);
            expect(sut._trace.Log.argsForCall[1]).toEqual(["  > Foo.Run()"]);
            expect(sut._trace.Log.argsForCall[2]).toEqual(["  < Foo.Run (0ms)"]);
            expect(sut._trace.Log.argsForCall[3]).toEqual(["< Bar.Run (0ms)"]);
        });

        it("calls that throw an exception are traced", function () {
            sut.Trace(Foo);

            sut.Register("_foo").withConstructor(Foo);

            expect(function () {
                sut.Load("_foo").Throw();
            }).toThrow();

            expect(sut._trace.Log).toHaveBeenCalled();
            expect(sut._trace.Log.argsForCall[0]).toEqual(["> Foo.Throw()"]);
            expect(sut._trace.Log.argsForCall[1]).toEqual(["<!Foo.Throw exited on exception!"]);
        });

        it("decorated methods still work as before", function () {

            spyOn(Foo.prototype, "Run").andReturn("ABC");

            sut.Trace(Foo);

            sut.Register("_foo").withConstructor(Foo);

            var foo = sut.Load("_foo");

            var result = foo.Run(1, 2, 3);

            expect(Foo.prototype.Run).toHaveBeenCalledWith(1, 2, 3);
            expect(Foo.prototype.Run.mostRecentCall.object).toBe(foo);
            expect(result).toEqual("ABC");
        });
    });
});
// DependencyGraphing.tests.js
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
// FakeJsfIoc.tests.js
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
// GraphVizFormatting.tests.js
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
