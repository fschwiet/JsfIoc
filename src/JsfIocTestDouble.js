

function JsfIocTestDouble(ioc) {

    this._ioc = ioc;
    this.TestDoublePolicy = JsfIocTestDouble.StubBehavior;
}


JsfIocTestDouble.StubBehavior = function(dependencyName, functionName) { };

JsfIocTestDouble.MockBehavior = function(dependencyName, functionName) { 
    
    throw "Unexpected call to " + dependencyName + "." + functionName + "()"
};


JsfIocTestDouble.prototype = {
    Load : function(name) {
    
        var result = this._ioc.Load(name);

        for (var member in result) {
        
            if (!result.hasOwnProperty(member))
                continue;
        
            for (var memberFunction in result[member])
            {
                // jasmine.log("replacing " + member + "." + memberFunction);
                
                result[member][memberFunction] = this.TestDoublePolicy;
            }
        }
        return result;
    }
};