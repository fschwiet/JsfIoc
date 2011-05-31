

function FakeJsfIoc(ioc) {

    this._ioc = ioc;
    this._preloadedDependencies = [];
    this._includedServices = [];
    this.TestDoublePolicy = FakeJsfIoc.StubBehavior;
}

FakeJsfIoc.StubBehavior = function(dependencyName, functionName) { 
    return function() {};
};

FakeJsfIoc.MockBehavior = function(dependencyName, functionName) { 
    
    return function() {
        throw new Error("Unexpected call to " 
            + dependencyName + "." + functionName + "()"
            + " with " + arguments.length + " parameters");
    };
};


FakeJsfIoc.prototype = {
    Load: function (service) {
        /// <summary>Load a service, replacing all dependencies with test doubles.</summary>
        /// <param name="service" type="Function">
        ///     service constructor
        /// </param>

        var binding = this.GetBindingByClass(service);
        var result = ioc._singletons[binding._name];

        if (result)
            return result;

		if (binding._fakeService==undefined)
			binding._fakeService=RedefineFromObject(binding._original,this.InjectDependencies,this,binding._name);

	    if (binding._isObject){
        	result = new binding._fakeService;

        	var parameterValues = Array.prototype.slice.call(arguments, 1); // all arguments after the first

        	this._ioc._SetParametersToObject(binding, result, parameterValues);
		
		} else {
		
			result = binding._fakeService;
		}

        return result;

    },
    LoadTestDouble: function (nameOrService) {
        /// <summary>Access the test doubles used as dependencies when .Load() is called.</summary>
        /// <param name="nameOrService">
        ///     service name or service constructor
        /// </param>
        /// <returns type="Boolean">return description</returns>

        name = nameOrService;

        if (typeof (nameOrService) == "function") {

            var service = nameOrService;

            name = this.GetBindingByClass(service)._name;
        }

        if (this._preloadedDependencies[name]) {
            return this._preloadedDependencies[name];
        }

        var result = this._ioc._singletons[name];

        if (!result) {
            var binding = this._ioc._bindings[name];

            if (binding) {
				if (binding._fakeService==undefined)
					binding._fakeService=RedefineFromObject(binding._original,this.InjectDependencies,this,binding._name);

			    if (binding._isObject){
        			result = new binding._fakeService;
				
		        result = this.CloneAsTestDouble(result, name);

        		var parameterValues = Array.prototype.slice.call(arguments, 1); // all arguments after the first

        		this._ioc._SetParametersToObject(binding, result, parameterValues);
		
				} else {
		
				result = binding._fakeService;
				}
            } else {
                throw "FakeJsfIoc could not find service: " + name;
            }
        }
        else
        	result = this.CloneAsTestDouble(result, name);

        this._preloadedDependencies[name] = result;

        return result;
    },
    IncludeReal: function (includedServices) {
        /// <summary>List services that should be loaded as dependencies without using test doubles.</summary>
        /// <param name="includedServices">
        ///     Name or name of arrays.
        /// </param>
        /// <returns type="FakeIoc">call Load</returns>

        var that = this;

        if (typeof (includedServices) == "string") {
            includedServices = [includedServices];
        }

        return {
            Load: function () {
                that._includedServices = includedServices;
                var result = that.Load.apply(that, arguments);
                that._includedServices = [];
                return result;
            }
        }

    },
    RegisterInstance: function (name, instance) {
        /// <summary>Register an object as a service by name.</summary>
        /// <param name="name">
        ///     Name of the service
        /// </param>
        /// <param name="instance">
        ///     The service instance
        /// </param>

        if (this._preloadedDependencies[name]) {
            throw new Error("Service " + name + " already has a test definition");
        }

        this._preloadedDependencies[name] = instance;
    },
    GetBindingByClass: function (service) {

        var binding = null;

        for (var bindingName in this._ioc._bindings) {

            if (!this._ioc._bindings.hasOwnProperty(bindingName)) {
                continue;
            };

            if (this._ioc._bindings[bindingName]._original === service) {
                binding = this._ioc._bindings[bindingName];
                break;
            }
        }

        if (binding == null) {

            throw new Error("FakeJsfIoc could not find service: " + service);
        };

        return binding;
    },
    CloneAsTestDouble: function (obj, name) {

        var result = {};

        for (var memberFunction in obj) {
            // jasmine.log("replacing " + member + "." + memberFunction);

            result[memberFunction] = this.TestDoublePolicy(name, memberFunction);
        }

        return result;
    },
    InjectDependencies: function(scope,name){

    	var binding=this._ioc.GetBinding(name,"InjectDependencies");

       dependencyLoadingLoop:
        for (var i = 0; i < binding._requires.length; i++) {

            var dependency = binding._requires[i];

            for (var includeIndex = 0; includeIndex < this._includedServices.length; includeIndex++) {
                if (dependency == this._includedServices[includeIndex]) {
                    scope[dependency] = this.Load(this._ioc._bindings[dependency]._original);
                    continue dependencyLoadingLoop;
                }
            }

            scope[dependency] = this.LoadTestDouble(dependency);
        }

        if (binding.boundParameters) {
            for (var i = 0; i < binding._parameters.length; i++) {
                var parameter = binding._parameters[i];
                scope[parameter._name] = binding.boundParameters[parameter._name];
            }
        }


        for (var i = 0; i < binding._eventSource.length; i++) {

            scope["_notify" + binding._eventSource[i]] =
                this.TestDoublePolicy(binding.GetFriendlyName(), "_notify" + binding._eventSource[i]);
        }

        if (binding._singleton) {
            this._singletons[name] = scope;
        }
    }
};

