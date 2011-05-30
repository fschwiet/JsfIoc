

function Redefine(name,scope,ioc,iocRegName){

	if (scope==undefined)
		scope=getGlobal();

	var original=scope[name];


	scope[name]=(function(orig,regName){return function(){
		ioc.InjectDependencies(this,regName);
		orig.apply(this,arguments)};})(scope[name],iocRegName);
	
	scope[name].prototype=original.prototype;
	if (original.prototype.constructor==original)
		scope[name].prototype.constructor=scope[name];
		
	return scope[name];
}



function RedefineFromObject(obj,ioc,iocRegName){
	return Redefine(GetFunctionName(obj),getGlobal(),ioc,iocRegName);
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