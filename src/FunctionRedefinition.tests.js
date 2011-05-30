


function SpyAbleFunction(p1,p2,p3){
}

function RedefinitionTestExample(p1,p2){
	SpyAbleFunction(p1,p2,this);
}

describe("FunctionRedefinition", function() {

	var ioc;
	var originalTestExample=RedefinitionTestExample;

	beforeEach(function(){
		ioc=new JsfIoc();
	});
	
	afterEach(function(){
		RedefinitionTestExample=originalTestExample;
		RedefinitionTestExample.prototype.constructor=RedefinitionTestExample;
	});


	describe("Global function/constructor",function(){


		it("Redefines function", function (){
		
			RedefineFromObject(RedefinitionTestExample,ioc.InjectDependencies,ioc,'name');
		
			expect(RedefineFromObject.toString()).toNotEqual(originalTestExample.toString());
		});
	

		it("Returns the redefined function", function (){
		
			var result=RedefineFromObject(RedefinitionTestExample,ioc.InjectDependencies,ioc,'name');
		
			expect(result).toEqual(RedefinitionTestExample);
		});

	    it("Redefined function calls the original with the new scope", function () {
	    
	    	//cannot spy directly as interfears with the redefinition

			spyOn(getGlobal(),'SpyAbleFunction');	
			spyOn(ioc,"InjectDependencies");	

			RedefineFromObject(RedefinitionTestExample,ioc.InjectDependencies,ioc,'name');
							
			
			obj=new RedefinitionTestExample(1,2);		
				
	        expect(SpyAbleFunction).toHaveBeenCalledWith(1,2,obj);
	    });

				
	    it("Redefined function Inject dependencies", function () {
			
			spyOn(ioc,"InjectDependencies");	
	
			RedefineFromObject(RedefinitionTestExample,ioc.InjectDependencies,ioc,'name');
			
			var obj=new RedefinitionTestExample();		
				
	        expect(ioc.InjectDependencies).toHaveBeenCalledWith(obj,'name');
	    });
	
	    it("Redefined function mantains prototype", function () {
	
			var orig=RedefinitionTestExample.prototype;
				
			RedefineFromObject(RedefinitionTestExample,ioc.InjectDependencies,ioc,'name');
			
	        expect(RedefinitionTestExample.prototype).toBe(orig);
	    });
	   
	
	    it("Redefined function replace prototype.constructor if it original point to passed constructor", function () {
	
			var origConstructor=RedefinitionTestExample.prototype.constructor;
				
			RedefineFromObject(RedefinitionTestExample,ioc.InjectDependencies,ioc,'name');
			
	        expect(RedefinitionTestExample.prototype.constructor).toBe(RedefinitionTestExample);
	        expect(RedefinitionTestExample.prototype.constructor).toNotBe(origConstructor);
	    });

	    it("Redefined function does NOT replace prototype.constructor if it original does NOT point to passed constructor", function () {
	
			RedefinitionTestExample.prototype.constructor=function(){};
			var origConstructor=RedefinitionTestExample.prototype.constructor;
			
			RedefineFromObject(RedefinitionTestExample,ioc.InjectDependencies,ioc,'name');
			
	        expect(RedefinitionTestExample.prototype.constructor).toNotBe(RedefinitionTestExample);
	        expect(RedefinitionTestExample.prototype.constructor).toBe(origConstructor);
	    });

		it("If passed function is not global, it has unknown scope, redefined function is returned, but original is not replaced",function(){
			
			function LocalFoo(){}
			
			var origFoo=LocalFoo;
			
			var result=RedefineFromObject(LocalFoo,ioc.InjectDependencies,ioc,'name');
			
			expect(LocalFoo).toBe(origFoo);
			expect(result).toNotBe(origFoo);
		
		});

	});
            
	describe("Scoped function/constructor",function(){

		var FooScope={};
		var origFoo;

		beforeEach(function(){
			FooScope.SpyAbleFoo=function(p1,p2,p3){
			};

			FooScope.Foo=function(p1,p2){
				FooScope.SpyAbleFoo(p1,p2,this);
			};
			origFoo=FooScope.Foo;
		});

		it("Redefines function", function (){
		
			Redefine('Foo',FooScope,ioc.InjectDependencies,ioc,'name');
		
			expect(FooScope.Foo.toString()).toNotEqual(originalTestExample.toString());
		});
	
		it("Returns the redefined function", function (){
		
			var result=Redefine('Foo',FooScope,ioc.InjectDependencies,ioc,'name');
		
			expect(result).toEqual(FooScope.Foo);
		});
	
		it("Redefines Global scoped function", function (){
			
			var orig=RedefinitionTestExample;
		
			Redefine('RedefinitionTestExample',getGlobal(),ioc.InjectDependencies,ioc,'name');
		
			expect(RedefinitionTestExample).toNotBe(orig);
			expect(RedefinitionTestExample.toString()).toNotEqual(orig.toString());
		});



	    it("Redefined function calls the original", function () {

				
			spyOn(FooScope,'SpyAbleFoo');	
			spyOn(ioc,"InjectDependencies");	
	
			Redefine('Foo',FooScope,ioc.InjectDependencies,ioc,'name');
			
			obj=new FooScope.Foo(1,2);		
				
	        expect(FooScope.SpyAbleFoo).toHaveBeenCalledWith(1,2,obj);
	    });

				
	    it("Redefined function Inject dependencies", function () {
			
			spyOn(ioc,"InjectDependencies");	
	
			Redefine('Foo',FooScope,ioc.InjectDependencies,ioc,'name');
			
			var obj=new FooScope.Foo();		
				
	        expect(ioc.InjectDependencies).toHaveBeenCalledWith(obj,'name');
	    });
	
	    it("Redefined function mantains prototype", function () {
	
			var orig=FooScope.Foo.prototype;
				
			Redefine('Foo',FooScope,ioc.InjectDependencies,ioc,'name');
			
	        expect(FooScope.Foo.prototype).toBe(orig);
	    });
	   
	
	    it("Redefined function replace prototype.constructor if it original point to passed constructor", function () {
	
			var origConstructor=FooScope.Foo.prototype.constructor;
				
			Redefine('Foo',FooScope,ioc.InjectDependencies,ioc,'name');
			
	        expect(FooScope.Foo.prototype.constructor).toBe(FooScope.Foo);
	        expect(FooScope.Foo.prototype.constructor).toNotBe(origConstructor);
	    });

	    it("Redefined function does NOT replace prototype.constructor if it original does NOT point to passed constructor", function () {
	
			FooScope.Foo.prototype.constructor=function(){};
			var origConstructor=FooScope.Foo.prototype.constructor	;
			
			Redefine('Foo',FooScope,ioc.InjectDependencies,ioc,'name');
			
	        expect(FooScope.Foo.prototype.constructor).toNotBe(FooScope.Foo);
	        expect(FooScope.Foo.prototype.constructor).toBe(origConstructor);
	    });

	});
});

