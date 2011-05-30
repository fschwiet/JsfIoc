


function SpyAbleFunction(p1,p2,p3){
}

function RedefinitionTestExample(p1,p2){
	SpyAbleFunction(p1,p2,this);
}

describe("FunctionRedefinition", function() {

	var originalTestExample=RedefinitionTestExample;
	var ioc;
	
	afterEach(function(){RedefinitionTestExample=originalTestExample;RedefinitionTestExample.prototype.constructor=RedefinitionTestExample;});
	beforeEach(function(){ioc=new JsfIoc();});


	describe("Global function/constructor",function(){

		it("Redefines function", function (){
		
			RedefineFromObject(RedefinitionTestExample,ioc,'name');
		
			expect(RedefineFromObject.toString()).toNotEqual(originalTestExample.toString());
		});
	

		it("Returns the redefined function", function (){
		
			var result=RedefineFromObject(RedefinitionTestExample,ioc,'name');
		
			expect(result).toEqual(RedefinitionTestExample);
		});

	    it("Redefined function calls the original with the new scope", function () {
	    
	    	//cannot spy directly as interfears with the redefinition

			spyOn(getGlobal(),'SpyAbleFunction');	
			spyOn(ioc,"InjectDependencies");	

			RedefineFromObject(RedefinitionTestExample,ioc,'name');
							
			
			obj=new RedefinitionTestExample(1,2);		
				
	        expect(SpyAbleFunction).toHaveBeenCalledWith(1,2,obj);
	    });

				
	    it("Redefined function Inject dependencies", function () {
			
			spyOn(ioc,"InjectDependencies");	
	
			RedefineFromObject(RedefinitionTestExample,ioc,'name');
			
			var obj=new RedefinitionTestExample();		
				
	        expect(ioc.InjectDependencies).toHaveBeenCalledWith(obj,'name');
	    });
	
	    it("Redefined function mantains prototype", function () {
	
			var orig=RedefinitionTestExample.prototype;
				
			RedefineFromObject(RedefinitionTestExample,ioc,'name');
			
	        expect(RedefinitionTestExample.prototype).toBe(orig);
	    });
	   
	
	    it("Redefined function replace prototype.constructor if it original point to passed constructor", function () {
	
			var origConstructor=RedefinitionTestExample.prototype.constructor;
				
			RedefineFromObject(RedefinitionTestExample,ioc,'name');
			
	        expect(RedefinitionTestExample.prototype.constructor).toBe(RedefinitionTestExample);
	        expect(RedefinitionTestExample.prototype.constructor).toNotBe(origConstructor);
	    });

	    it("Redefined function does NOT replace prototype.constructor if it original does NOT point to passed constructor", function () {
	
			RedefinitionTestExample.prototype.constructor=function(){};
			var origConstructor=RedefinitionTestExample.prototype.constructor;
			
			RedefineFromObject(RedefinitionTestExample,ioc,'name');
			
	        expect(RedefinitionTestExample.prototype.constructor).toNotBe(RedefinitionTestExample);
	        expect(RedefinitionTestExample.prototype.constructor).toBe(origConstructor);
	    });

	});
            
	describe("Scoped function/constructor",function(){

		it("Redefines function", function (){
		
			Redefine('RedefinitionTestExample',getGlobal(),ioc,'name');
		
			expect(RedefineFromObject.toString()).toNotEqual(originalTestExample.toString());
		});
	
		it("Returns the redefined function", function (){
		
			var result=Redefine('RedefinitionTestExample',getGlobal(),ioc,'name');
		
			expect(result).toEqual(RedefinitionTestExample);
		});
	
		it("Redefines object scoped function", function (){
		
			var FooObject={};
		
			FooObject.Foo=function(){};
		
			var orig=FooObject.Foo;
		
			Redefine('Foo',FooObject,ioc,'name');
		
			expect(FooObject.Foo).toNotBe(orig);
			expect(FooObject.Foo.toString()).toNotEqual(orig.toString());
		});


		it("Redefines object scoped function, if scope is undefined means global", function (){
		
			Redefine('RedefinitionTestExample',undefined,ioc,'name');
		
			expect(RedefineFromObject.toString()).toNotEqual(originalTestExample.toString());
		});



	    it("Redefined function calls the original", function () {

			var orig=RedefinitionTestExample;
				
			spyOn(getGlobal(),'SpyAbleFunction');	
			spyOn(ioc,"InjectDependencies");	
	
			Redefine('RedefinitionTestExample',getGlobal(),ioc,'name');
			
			obj=new RedefinitionTestExample(1,2);		
				
	        expect(SpyAbleFunction).toHaveBeenCalledWith(1,2,obj);
	    });

				
	    it("Redefined function Inject dependencies", function () {
			
			spyOn(ioc,"InjectDependencies");	
	
			Redefine('RedefinitionTestExample',getGlobal(),ioc,'name');
			
			var obj=new RedefinitionTestExample();		
				
	        expect(ioc.InjectDependencies).toHaveBeenCalledWith(obj,'name');
	    });
	
	    it("Redefined function mantains prototype", function () {
	
			var orig=RedefinitionTestExample.prototype;
				
			Redefine('RedefinitionTestExample',getGlobal(),ioc,'name');
			
	        expect(RedefinitionTestExample.prototype).toBe(orig);
	    });
	   
	
	    it("Redefined function replace prototype.constructor if it original point to passed constructor", function () {
	
			var origConstructor=RedefinitionTestExample.prototype.constructor;
				
			Redefine('RedefinitionTestExample',getGlobal(),ioc,'name');
			
	        expect(RedefinitionTestExample.prototype.constructor).toBe(RedefinitionTestExample);
	        expect(RedefinitionTestExample.prototype.constructor).toNotBe(origConstructor);
	    });

	    it("Redefined function does NOT replace prototype.constructor if it original does NOT point to passed constructor", function () {
	
			RedefinitionTestExample.prototype.constructor=function(){};
			var origConstructor=RedefinitionTestExample.prototype.constructor	;
			
			Redefine('RedefinitionTestExample',getGlobal(),ioc,'name');
			
	        expect(RedefinitionTestExample.prototype.constructor).toNotBe(RedefinitionTestExample);
	        expect(RedefinitionTestExample.prototype.constructor).toBe(origConstructor);
	    });

	});
});

