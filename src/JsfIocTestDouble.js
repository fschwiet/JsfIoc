

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
    
        var binding = this._ioc._bindings[name];

        result = new binding.service;

        if (binding.requires instanceof Array) for (var i = 0; i < binding.requires.length; i++) {
            var dependency = binding.requires[i];
            result[dependency] = this.LoadTestDouble(dependency);
        }

        if (binding.parameters instanceof Array) for (var i = 0; i < binding.parameters.length; i++) {
            var parameter = binding.parameters[i];
            result[parameter] = arguments[1 + i];
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
