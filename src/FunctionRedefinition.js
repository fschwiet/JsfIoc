

function Redefine(name,scope,ioc,iocRegName){

	if (scope==undefined)
		scope=getGlobal();

	//We replace the definition with the new one, allowing to use new directly
	scope[name]=_CreateFunctionWrapper(scope[name],ioc,iocRegName);
	
	return scope[name];
}

function _CreateFunctionWrapper(obj,ioc,iocRegName){

	var result;	
	
	if (typeof(obj)!='function')
		throw("Invalid Argument, expecting a Function");
	
	result=(function(orig,regName){return function(){
		ioc.InjectDependencies(this,regName);
		orig.apply(this,arguments)};})(obj,iocRegName);
	result.prototype=obj.prototype;
	if (obj.prototype.constructor==obj)
		result.prototype.constructor=result;

	return result;
}

function RedefineFromObject(obj,ioc,iocRegName){
			
	var result=_CreateFunctionWrapper(obj,ioc,iocRegName);			
	
	//If the object belongs to global scope, and name can be obtained, we can do full redefinition , allowing to use new directly


	if ((getGlobal())[GetFunctionName(obj)]===obj)
		(getGlobal())[GetFunctionName(obj)]=result;
	
	//else , we only return the redefined function
	
	return result;
}



function GetFunctionName(obj){

	if (typeof(obj)!='function')
		throw "Invalid Argument, function expected";

    var result = obj.toString();

    if (result.indexOf("(") > -1)
        result = result.slice(0, result.indexOf("("));
    if (result.indexOf("function ") == 0)
        result = result.slice("function ".length);

    return result;
}