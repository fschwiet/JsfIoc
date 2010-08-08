

function JsfIocTestDouble(ioc) {

    this._ioc = ioc;
    this._preloadedDependencies = [];
    this.TestDoublePolicy = JsfIocTestDouble.StubBehavior;
}


JsfIocTestDouble.StubBehavior = function(dependencyName, functionName) { 
    return function() {};
};


JsfIocTestDouble.MockBehavior = function(dependencyName, functionName) { 
    
    return function() {
        throw "Unexpected call to " 
            + dependencyName + "." + functionName + "()"
            + " with " + arguments.length + " parameters";
    };
};


JsfIocTestDouble.prototype = {
    Load : function(name) {
        var result = this._ioc.Load(name);

        for (var member in result) {
        
            if (!result.hasOwnProperty(member))
                continue;
        
            result[member] = this.LoadTestDouble(member);
        }
        return result;
    },
    LoadTestDouble : function(name) {
    
        if (this._preloadedDependencies[name]) {
            return this._preloadedDependencies[name];
        }
        
        var result = this._ioc.Load(name);
    
        this.ReplaceMemberFunctionsWithTestDouble(result, name);
        
        this._preloadedDependencies[name] = result;
        
        return result;
    },
    ReplaceMemberFunctionsWithTestDouble : function(obj, name) {
        for (var memberFunction in obj)
        {
            // jasmine.log("replacing " + member + "." + memberFunction);
            
            obj[memberFunction] = this.TestDoublePolicy(name, memberFunction);
        }    
    }
};
