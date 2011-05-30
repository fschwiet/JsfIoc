/// <reference path="..\Intellisense.js"/>

function JsfIocTestExample(){
}


describe("JsfIoc", function () {

	function Foo() {
	};
	
	function Bar() {
	};
	
	var originalFoo=Foo;
	var originalBar=Bar;

	afterEach(function(){ Foo=originalFoo;Bar=originalBar;Foo.prototype.constructor=Foo;Bar.prototype.constructor=Bar});
            
 	describe("For constructor by object",function(){
	
		afterEach(function(){ Foo=originalFoo;Bar=originalBar;Foo.prototype.constructor=Foo;Bar.prototype.constructor=Bar});
			
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
	
	
	    it("Load is not longer necesary", function () {
	
	        var sut = new JsfIoc();
	
	        sut.Register("_bar").withConstructor(Bar);
	
	        Foo=sut.Register("_foo").withConstructor(Foo).withDependencies("_bar").getService();
	
	        var result = new Foo();
	
	        expect(result._bar instanceof Bar).toBeTruthy();
	    });

	    it("Load is not longer necesary, assigment is not necesary for global functions", function () {
	
	        var sut = new JsfIoc();
	
	        sut.Register("_bar").withConstructor(Bar);
	
	        sut.Register("_JsfIocTestExample").withConstructor(JsfIocTestExample).withDependencies("_bar").getService();
	
	        var result = new JsfIocTestExample();
	
	        expect(result._bar instanceof Bar).toBeTruthy();
	    });


	});
	describe("For constructor by name,scope",function(){
		
		var FooScope={};
		FooScope.Foo=function(){};
		FooScope.Bar=function(){};
		FooScope.Foo2=function(){this.dep++;};
		
		var originalFoo=FooScope.Foo;
		var originalBar=FooScope.Bar;
		
		afterEach(function(){ FooScope.Foo=originalFoo;FooScope.Bar=originalBar;FooScope.Foo.prototype.constructor=FooScope.Foo;FooScope.Bar.prototype.constructor=FooScope.Bar});
			
	    it("Register and load a minimal service as name,scope", function () {
	
	        var sut = new JsfIoc();

	        sut.Register("_foo").withScopedConstructor('Foo',FooScope);
	
	        var result = sut.Load("_foo");
	
	        expect(result instanceof FooScope.Foo).toBeTruthy();
	    });
	
	    it("Register and load a service with a dependency as name,scope", function () {
	
	        var sut = new JsfIoc();
	
	        sut.Register("_bar").withScopedConstructor('Bar',FooScope);
	
	        sut.Register("_foo").withScopedConstructor('Foo',FooScope).withDependencies("_bar");
	
	        var result = sut.Load("_foo");
	
	        expect(result._bar instanceof FooScope.Bar).toBeTruthy();
	    });
	
	
	    it("Load is not longer necesary in scoped either", function () {
	
	        var sut = new JsfIoc();
	
	        sut.Register("_bar").withConstructor(FooScope.Bar);
	
	        sut.Register("_foo").withScopedConstructor('Foo',FooScope).withDependencies("_bar").getService();
	
	        var result = new FooScope.Foo();
	
	        expect(result._bar instanceof FooScope.Bar).toBeTruthy();
	    });
	
	    it("Makes dependencies available at construction time ", function () {
	
	        var sut = new JsfIoc();
			var dep=2;
	
	        sut.Register("dep").withInstance(dep);
	
	        sut.Register("_foo2").withScopedConstructor('Foo2',FooScope).withDependencies("dep");
	
	        var result = new FooScope.Foo2();
	
	        expect(result.dep).toEqual(3);
	    });
	});

    it("Registers with different styles must be compatible", function () {

        var sut = new JsfIoc();
        var BarScope={};
        BarScope.Bar=function(){};

        sut.Register("_bar").withScopedConstructor('Bar',BarScope);

        sut.Register("_foo").withConstructor(Foo).withDependencies("_bar");

        var result = sut.Load("_foo");

        expect(result._bar instanceof BarScope.Bar).toBeTruthy();
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

            it("Configure()	 accepts valid parameters", function () {

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

    it("A function object can be registered", function () {

        var sut = new JsfIoc();

        sut.Register("_foo").withFunction(Foo);

        var result = sut.Load("_foo");
		var obj=new result();

		expect(typeof(result)).toEqual('function');
        expect(obj instanceof Foo).toBeTruthy();
    });  
    
    it("A function can be registered as name,scope", function () {

        var sut = new JsfIoc();
        var FooScope={};
        FooScope.Foo=function(){};

        sut.Register("_foo").withScopedFunction('Foo',FooScope);

        var result = sut.Load("_foo");
		var obj=new result();

		expect(typeof(result)).toEqual('function');
        expect(obj instanceof FooScope.Foo).toBeTruthy();
    });

    it("A constructor function can be registered, and constructed objects can have dependecies", function () {

        var sut = new JsfIoc();
        var FooScope={};
        FooScope.Foo=function(){};

        sut.Register("_bar").withConstructor(Bar);

        sut.Register("_foo").withScopedFunction('Foo',FooScope).withDependencies("_bar");

        var result = new (sut.Load("_foo"))();

        expect(result._bar instanceof Bar).toBeTruthy();
    });
    
    it("A constructor function don't need Load", function () {

    	var sut = new JsfIoc();
	    var FooScope={};
        FooScope.Foo=function(){};

        sut.Register("_bar").withConstructor(Bar);

        sut.Register("_foo").withScopedFunction('Foo',FooScope).withDependencies("_bar");

        var result = new FooScope.Foo();

        expect(result._bar instanceof Bar).toBeTruthy();
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
		}
		Listener.prototype.OnInitialize = function () { };
		
		function MultiSource() {
		}

 
        var sut;
        var OriginalSource=Source;
        var OriginalListener=Listener;
        var OriginalMultiSource=MultiSource;

        beforeEach(function () {

            sut = new JsfIoc();

            sut.Register("_source").withConstructor(Source).sendingEvents("Initialize");
            sut.Register("_listener").withConstructor(Listener).receivingEvents("Initialize");
        });
		
		afterEach(function(){ Source=OriginalSource;Listener=OriginalListener;Source.prototype.constructor=Source;Listener.prototype.constructor=Listener;MultiSource=OriginalMultiSource;MultiSource.prototype.constructor=MultiSource;});
        
                
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

                sut.Register("_multisource").withConstructor(MultiSource).sendingEvents("AnotherEvent", "Initialize", "HelloWorld");

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
