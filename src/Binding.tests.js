/// <reference path="..\Intellisense.js"/>

describe("BindingStart", function () {

	function Foo() {
    }
    var originalFoo=Foo;

    var ioc;

    beforeEach(function () {
        ioc = new JsfIoc();
    });
    
    afterEach(function (){
    	Foo=originalFoo;
    	Foo.prototype.constructor=Foo;
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
        spyOn(getGlobal(), "RedefineFromObject").andCallThrough();
        
        var oldFoo=Foo;
        var binding = new BindingStart(ioc, "someServiceName").withConstructor(Foo);

        expect(ioc.RegBinding).toHaveBeenCalledWith(binding);
        expect(binding._name).toEqual("someServiceName");
        expect(binding._original).toEqual(oldFoo);
        expect(binding._isObject).toBeTruthy();
        expect(RedefineFromObject).toHaveBeenCalledWith(oldFoo,ioc.InjectDependencies,ioc,"someServiceName");
        expect(typeof(binding.service)).toEqual("function");
    });


    it("can specify a constructor as name,scope", function () {

        spyOn(ioc, "RegBinding");
        spyOn(getGlobal(), "Redefine").andCallThrough();
        
        var FooScope={};
        FooScope.Foo=function(){};
        
        var oldFoo=FooScope.Foo;
        var binding = new BindingStart(ioc, "someServiceName").withScopedConstructor('Foo',FooScope);

        expect(ioc.RegBinding).toHaveBeenCalledWith(binding);
        expect(binding._name).toEqual("someServiceName");
        expect(binding._original).toEqual(oldFoo);
        expect(binding._isObject).toBeTruthy();
        expect(Redefine).toHaveBeenCalledWith('Foo',FooScope,ioc.InjectDependencies,ioc,"someServiceName");
        expect(typeof(binding.service)).toEqual("function");
    });

    it("can specify an instance", function () {

        spyOn(ioc, "RegisterInstance");

        var instance = new Foo();

        new BindingStart(ioc, "someServiceName").withInstance(instance);

        expect(ioc.RegisterInstance).toHaveBeenCalledWith("someServiceName", instance);
    });

    it("can specify a function", function(){

        var oldFoo=Foo;

        spyOn(ioc, "RegBinding");
        spyOn(getGlobal(), "RedefineFromObject").andCallThrough();

        var funcBinding = new BindingStart(ioc, "someServiceName").withFunction(Foo);

        expect(ioc.RegBinding).toHaveBeenCalledWith(funcBinding);
        expect(funcBinding._name).toEqual("someServiceName");
        expect(funcBinding._original).toEqual(oldFoo);
        expect(funcBinding._isObject).toBeFalsy();
        expect(RedefineFromObject).toHaveBeenCalledWith(Foo,ioc.InjectDependencies,ioc,"someServiceName");
        expect(typeof(funcBinding.service)).toEqual("function");
    });

    it("Local functions can be redefined using getService", function(){

		var BarScope={};
		BarScope.Bar=function(){};
		
		function Foo(){BarScope.Bar()};
        var oldFoo=Foo;

 	    spyOn(BarScope, "Bar");
 
        Foo = new BindingStart(ioc, "someServiceName").withFunction(Foo).getService();

		Foo();
		
        expect(BarScope.Bar).toHaveBeenCalled();
    });
       
                
    it("can specify an scoped function", function(){

        var FooScope={};
        FooScope.Foo=function(){};
        var oldFoo=FooScope.Foo;

        spyOn(ioc, "RegBinding");
        spyOn(getGlobal(), "Redefine").andCallThrough();

        var funcBinding = new BindingStart(ioc, "someServiceName").withScopedFunction('Foo',FooScope);

        expect(ioc.RegBinding).toHaveBeenCalledWith(funcBinding);
        expect(funcBinding._name).toEqual("someServiceName");
        expect(funcBinding._original).toEqual(oldFoo);
        expect(funcBinding._isObject).toBeFalsy();
        expect(Redefine).toHaveBeenCalledWith('Foo',FooScope,ioc.InjectDependencies,ioc,"someServiceName");
        expect(typeof(funcBinding.service)).toEqual("function");
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
    });

    it("can specify events received by this component", function () {

        var binding = new Binding("serviceName").receivingEvents(1, 2, 3);

        expect(binding._eventListener).toEqual([1, 2, 3]);
    });

    describe("has a friendly name", function () {

        it("which is the constructor's name, if available", function () {

            var sut = new Binding("someServiceName",Foo);

            expect(sut.GetFriendlyName()).toEqual("Foo");
        });

        it("otherwise, its the service name", function () {

            function Foo() { }

            var sut = new Binding("someServiceName",function () { });
 
            expect(sut.GetFriendlyName()).toEqual("someServiceName");
        });
    });
});
