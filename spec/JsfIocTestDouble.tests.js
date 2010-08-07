

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


    describe("provides test doubles for each dependency", function() {
        
                
        it("default test double behavior is to be a stub (succeed, returning undefined)", function() {
            
            expect(sut.TestDoublePolicy).toBeDefined();
            expect(sut.TestDoublePolicy).toEqual(JsfIocTestDouble.StubBehavior);
        });
        
        it("you can change the test double behavior", function() {
        
            spyOn(sut, "TestDoublePolicy");
            
            var bar = sut.Load("_bar");
            
            bar._foo.Run();
            
            expect(sut.TestDoublePolicy).toHaveBeenCalled()
        });
        
        it("stub test behavior doesn't do anything", function() {
        
            var result = JsfIocTestDouble.StubBehavior("_foo", "Run");
            
            expect(result).not.toBeDefined();
        });
        
        it("mock behavior throws an exception", function() {
        
            expect(function() {
                var result = JsfIocTestDouble.MockBehavior("_foo", "Run");
            }).toThrow("Unexpected call to _foo.Run()");
        });
    });
});