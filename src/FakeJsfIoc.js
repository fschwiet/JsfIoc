

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
        throw "Unexpected call to " 
            + dependencyName + "." + functionName + "()"
            + " with " + arguments.length + " parameters";
    };
};


FakeJsfIoc.prototype = {
    Load: function (service) {

        var binding = this.GetBindingByClass(service);

        var result = new binding.service;

        if (binding.requires) {

            dependencyLoadingLoop:
            for (var i = 0; i < binding.requires.length; i++) {

                var dependency = binding.requires[i];

                for (var includeIndex = 0; includeIndex < this._includedServices.length; includeIndex++) {
                    if (dependency == this._includedServices[includeIndex]) {
                        result[dependency] = this.Load(this._ioc._bindings[dependency].service);
                        continue dependencyLoadingLoop;
                    }
                }

                result[dependency] = this.LoadTestDouble(dependency);
            }
        }

        if (binding.parameters) for (var i = 0; i < binding.parameters.length; i++) {
            var parameter = binding.parameters[i];
            result[parameter.name] = arguments[1 + i];
        }

        if (binding.eventSource) for (var i = 0; i < binding.eventSource.length; i++) {

            var serviceName = binding.service.toString();

            if (serviceName.indexOf("(") > -1)
                serviceName = serviceName.slice(0, serviceName.indexOf("("));

            result["_notify" + binding.eventSource[i]] =
                this.TestDoublePolicy(serviceName, "_notify" + binding.eventSource[i]);
        }

        return result;
    },
    LoadTestDouble: function (nameOrService) {

        name = nameOrService;

        if (typeof (nameOrService) == "function") {

            var service = nameOrService;

            name = this.GetBindingByClass(service).name;
        }

        if (this._preloadedDependencies[name]) {
            return this._preloadedDependencies[name];
        }

        var result = this._ioc.Load(name);

        this.ReplaceMemberFunctionsWithTestDouble(result, name);

        this._preloadedDependencies[name] = result;

        return result;
    },
    IncludeReal: function (includedServices) {

        var that = this;

        return {
            Load: function () {
                that._includedServices = includedServices;
                var result = that.Load.apply(that, arguments);
                that._includedServices = [];
                return result;
            }
        }

    },
    GetBindingByClass: function (service) {
        var binding = null;

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

            throw "FakeJsfIoc could not find service: " + service;
        };

        return binding;
    },
    ReplaceMemberFunctionsWithTestDouble: function (obj, name) {
        for (var memberFunction in obj) {
            // jasmine.log("replacing " + member + "." + memberFunction);

            obj[memberFunction] = this.TestDoublePolicy(name, memberFunction);
        }
    }
};
