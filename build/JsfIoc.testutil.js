// DependencyGraphing.js


function DependencyGrapher(ioc) {
    this._ioc = ioc;
}

DependencyGrapher.prototype = {
    constructor: DependencyGrapher,

    GetRegisteredServices: function () {
        var result = [];

        var bindings = this._ioc._bindings;

        for (var name in bindings) {
            if (!bindings.hasOwnProperty(name))
                continue;

            result.push(name);
        }

        return result;
    },

    GetTopLevelServices: function () {

        //  Start with a list of all services.
        //  Enumerate the dependencies of every service, remove each from the list of all services.
        //  The remaining services have no dependencies.

        var servicesLeft = this.GetRegisteredServices();

        var bindings = this._ioc._bindings;

        for (var name in bindings) {
            if (!bindings.hasOwnProperty(name))
                continue;

            var binding = bindings[name];

            if (binding.requires) {
                for (var i = 0; i < binding.requires.length; i++) {
                    for (var j = 0; j < servicesLeft.length; j++) {

                        if (servicesLeft[j] == binding.requires[i]) {
                            servicesLeft.splice(j, 1);
                            break;
                        }
                    }
                }
            }
        }

        return servicesLeft;
    },

    _dependencyWeights: {},

    GetWeightOfDependencies: function (serviceName) {

        var existing = this._dependencyWeights[serviceName];

        if (existing)
            return existing;

        var sum = 1;

        var binding = this._ioc._bindings[serviceName];

        var requires = binding.requires;

        if (requires) for (var i = 0; i < requires.length; i++) {

            sum += this.GetWeightOfDependencies(requires[i]);
        }

        this._dependencyWeights[serviceName] = sum;

        return sum;
    },

    GetSortValue: function (name) {

        var index = 0;

        for (var key in this._ioc._bindings) {
            if (key == name)
                break;

            index++;
        }

        return index;
    },

    VisitDependencies: function (visitor, nodes, parent, depth) {

        nodes = nodes || this.GetTopLevelServices();
        parent = parent || null;
        depth = depth || 0;

        var that = this;

        var nodeCount = nodes.length;

        function getSortScore(name) {
            return that.GetWeightOfDependencies(name) * nodeCount - that.GetSortValue(name);
        }

        nodes.sort(function (a, b) {
            return getSortScore(b) - getSortScore(a);
        });

        for (var i = 0; i < nodes.length; i++) {

            var node = nodes[i];

            visitor(node, parent, depth);

            var requires = (this._ioc._bindings[node].requires || []).slice(0);

            this.VisitDependencies(visitor, requires, node, depth + 1);
        };
    },

    SimpleGraph: function() {
        
        var result = "";

        this.VisitDependencies(function(node, parent, depth){
            result += new Array(depth+1).join("    ") + node + "\n";
        });

        return result;
    }
}
// FakeJsfIoc.js


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

        var binding = this.GetBindingByClass(service);

        var result = new binding.service;

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

        for (var i = 0; i < binding.parameters.length; i++) {
            var parameter = binding.parameters[i];
            result[parameter.name] = arguments[1 + i];
        }

        for (var i = 0; i < binding.eventSource.length; i++) {

            result["_notify" + binding.eventSource[i]] =
                this.TestDoublePolicy(binding.GetFriendlyName(), "_notify" + binding.eventSource[i]);
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
    IncludeReal: function (includedServices) {

        var that = this;

        if (typeof(includedServices) == "string") {
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
