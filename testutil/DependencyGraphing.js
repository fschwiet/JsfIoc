

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

            if (binding && binding._requires) {
                for (var i = 0; i < binding._requires.length; i++) {
                    for (var j = 0; j < servicesLeft.length; j++) {

                        if (servicesLeft[j] == binding._requires[i]) {
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

        if (binding) {

            var requires = binding._requires;

            if (requires) for (var i = 0; i < requires.length; i++) {

                sum += this.GetWeightOfDependencies(requires[i]);
            }
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

            var nodeBinding = this._ioc._bindings[node];

            var requires = [];

            if (nodeBinding && nodeBinding._requires) {
                requires = nodeBinding._requires.slice(0);
            }

            this.VisitDependencies(visitor, requires, node, depth + 1);
        };
    },

    SimpleGraph: function () {

        var result = "";

        this.VisitDependencies(function (node, parent, depth) {
            result += new Array(depth + 1).join("    ") + node + "\n";
        });

        return result;
    }
}