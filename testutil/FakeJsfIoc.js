

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

        var binding = this.GetBinding(service);

        function Temp() {
        }

        Temp.prototype = binding.service.prototype;

        var result = new Temp();
        result.constructor = binding.service;

        dependencyLoadingLoop:
        for (var i = 0; i < binding._requires.length; i++) {

            var dependency = binding._requires[i];

            for (var includeIndex = 0; includeIndex < this._includedServices.length; includeIndex++) {
                if (dependency == this._includedServices[includeIndex]) {
                    result[dependency] = this.Load(this._ioc._bindings[dependency].service);
                    continue dependencyLoadingLoop;
                }
            }

            result[dependency] = this.LoadTestDouble(dependency);
        }

        var parameterValues = Array.prototype.slice.call(arguments, 1); // all arguments after the first

        this._ioc._SetParametersToObject(binding, result, parameterValues);

        binding.service.apply(result, []);

        for (var i = 0; i < binding._eventSource.length; i++) {

            result["_notify" + binding._eventSource[i]] =
                this.TestDoublePolicy(binding.GetFriendlyName(), "_notify" + binding._eventSource[i]);
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

            name = this.GetBinding(service)._name;
        }

        if (this._preloadedDependencies[name]) {
            return this._preloadedDependencies[name];
        }

        var result = this._ioc._singletons[name];

        if (!result) {
            var binding = this._ioc._bindings[name];

            if (binding) {
                result = new (this._ioc._bindings[name].service);
            } else {
                throw "FakeJsfIoc could not find service: " + name;
            }
        }

        result = this.CloneAsTestDouble(result, name);

        this._preloadedDependencies[name] = result;

        return result;
    },
    Preload: function (service) {

        var serviceName = this.GetBinding(service)._name;

        if (!this._preloadedDependencies[serviceName]) {
            this._preloadedDependencies[serviceName] = this.Load(serviceName);
        }

        return this._preloadedDependencies[serviceName];
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

        for (var i = 0; i < includedServices.length; i++) {
            this.Preload(includedServices[i]);
        }

        return {
            Load: function () {
                var result = that.Load.apply(that, arguments);
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
    GetBinding: function (service) {

        var binding = null;

        if (typeof (service) == "string") {
            return this._ioc._bindings[service];
        }

        for (var bindingName in this._ioc._bindings) {

            if (!this._ioc._bindings.hasOwnProperty(bindingName)) {
                continue;
            };

            if (this._ioc._bindings[bindingName].service === service) {
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
    }
};

