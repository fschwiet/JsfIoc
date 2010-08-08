

describe("JsfIocTestDouble", function() {

    function Foo() {
    };
    
    Foo.prototype = {
        Run : function() {
        }
    };
    
    function Bar() {
    };

    var ioc;
    var sut;

    beforeEach(function() {
    
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
        
        sut = new JsfIocTestDouble(ioc);
    });


    it("can pass initialization parameters", function() {
        
        function ClassWithInitializationParameters() {
        };
      
        ioc.Register({
            name: "_some",
            service: ClassWithInitializationParameters,
            parameters: ["_a", "_b", "_c"]
        });
        
        var result = sut.Load("_some", 1, 2, 3);
        
        expect(result._a).toEqual(1);
        expect(result._b).toEqual(2);
        expect(result._c).toEqual(3);
    });

    describe("provides test doubles for each dependency", function() {
                
        it("default test double behavior is to be a stub (succeed, returning undefined)", function() {
            
            expect(sut.TestDoublePolicy).toBeDefined();
            expect(sut.TestDoublePolicy).toEqual(JsfIocTestDouble.StubBehavior);
        });
        
        it("you can change the test double behavior", function() {
        
            var functionTestDouble = {};
        
            spyOn(sut, "TestDoublePolicy").andReturn(functionTestDouble);
            
            var bar = sut.Load("_bar");
            
            expect(sut.TestDoublePolicy).toHaveBeenCalledWith("_foo", "Run");
            expect(bar._foo.Run).toBe(functionTestDouble);
        });
        
        it("stub test behavior doesn't do anything", function() {
        
            var behavior = JsfIocTestDouble.StubBehavior("_foo", "Run");
            
            expect(behavior()).not.toBeDefined();
        });
        
        it("mock behavior throws an exception", function() {
        
            var behavior = JsfIocTestDouble.MockBehavior("_foo", "Run");
            
            expect(function() {
                behavior(1,2,3);
            }).toThrow("Unexpected call to _foo.Run() with 3 parameters");
        });
    });
    
    describe("Can preload dependencies, allowing them to be initialized for the test", function() {
    
        it("Dependencies can be preloaded.", function() {
        
            var functionTestDouble = {};
        
            spyOn(sut, "TestDoublePolicy").andReturn(functionTestDouble);
            
            var preloadedService = sut.LoadTestDouble("_foo");
            
            expect(sut.TestDoublePolicy).toHaveBeenCalledWith("_foo", "Run");
            expect(preloadedService.Run).toBe(functionTestDouble);
        });
    
        it("The preloaded dependency is used initializing the service we want to test", function() {
        
            var preloadedService = sut.LoadTestDouble("_foo");
            
            var service = sut.Load("_bar");
            
            expect(service._foo).toBe(preloadedService);
        });
    
        it("Preload is idempotent", function() {
        
            var preloadedService1 = sut.LoadTestDouble("_foo");
            var preloadedService2 = sut.LoadTestDouble("_foo");
            
            expect(preloadedService1).toBeDefined();
            expect(preloadedService1).toBe(preloadedService2);
        });
    });
});