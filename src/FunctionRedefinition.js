

function Redefine(name,scope,injector,ioc,iocRegName){
	///	<summary>
	///		Redefines a function, injecting dependencies by adding properties to this, if the function is a constructor,
	///     it injects the properties to the constructed object, and are available when the actual constructor is called.
	///	</summary>
	///	<param name="name" type="string">The name of the function</param>
	///	<param name="scope" type="object">The scope where the function is defined</param>
	///	<param name="injector" type="function">The function to be used to inject dependencies</param>
	///	<param name="ioc" type="object">scope of the injector function</param>
	///	<param name="iocRegName" type="string">The name of the service in the ioc</param>
	///	<returns type="Binding" />
	if (scope==undefined)
		scope=getGlobal();

	//We replace the definition with the new one, allowing to use new directly
	scope[name]=_CreateFunctionWrapper(scope[name],injector,ioc,iocRegName);
	
	return scope[name];
}


function RedefineFromObject(obj,injector,ioc,iocRegName){
	///	<summary>
	///		Redefines a function, injecting dependencies by adding properties to this, if the function is a constructor,
	///     it injects the properties to the constructed object, and are available when the actual constructor is called.
	///		If the function is global it can be reassigned, if not the modified version is just returned
	///	</summary>
	///	<param name="obj" type="object">The name of the function</param>
	///	<param name="injector" type="function">The function to be used to inject dependencies</param>
	///	<param name="ioc" type="object">scope of the injector function</param>
	///	<param name="iocRegName" type="string">The name of the service in the ioc</param>
	///	<returns type="Binding" />
			
	var result=_CreateFunctionWrapper(obj,injector,ioc,iocRegName);			
	
	//If the object belongs to global scope, and name can be obtained, we can do full redefinition , allowing to use new directly


	if ((getGlobal())[_GetFunctionName(obj)]===obj)
		(getGlobal())[_GetFunctionName(obj)]=result;
	
	//else , we only return the redefined function
	
	return result;
}

function _CreateFunctionWrapper(obj,injector,ioc,iocRegName){

	var result;	
	
	if (typeof(obj)!='function')
		throw("Invalid Argument, expecting a Function");
	
	result=(function(orig,regName,dependencyInjector,diScope){return function(){
		dependencyInjector.call(diScope,this,regName);
		orig.apply(this,arguments)};})(obj,iocRegName,injector,ioc);
	result.prototype=obj.prototype;
	if (obj.prototype.constructor==obj)
		result.prototype.constructor=result;

	return result;
}


function _GetFunctionName(obj){

	if (typeof(obj)!='function')
		throw "Invalid Argument, function expected";

    var result = obj.toString();

    if (result.indexOf("(") > -1)
        result = result.slice(0, result.indexOf("("));
    if (result.indexOf("function ") == 0)
        result = result.slice("function ".length);

    return result;
}