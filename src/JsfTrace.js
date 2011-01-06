

function JsfTrace(ioc) {
    this._ioc = ioc;
    this._decorators = [];
    this._depth = 1;
}

JsfTrace.prototype = {
    constructor: JsfTrace,
    Trace: function (service) {

        var that = this;

        var decorator = function (binding, instance) {

            for (var method in instance) {

                (function (methodName, methodBlock) {

                    if (typeof (methodBlock) == "function") {

                        instance[methodName] = function () {

                            var prefix = new Array(that._depth).join("  ");

                            that.Log(prefix + "> " + binding.GetFriendlyName() + "." + methodName + "()");
                            that._depth++;

                            var start = new Date().getTime();

                            var success = false;

                            try {
                                var result = methodBlock.apply(this, arguments);

                                var end = new Date().getTime();

                                that._depth--;
                                that.Log(prefix + "< " + binding.GetFriendlyName() + "." + methodName + " (" + (end - start) + "ms)");
                                success = true;
                                return result;
                            }
                            finally {
                                if (!success) {
                                    that._depth--;
                                    that.Log(prefix + "<!" + binding.GetFriendlyName() + "." + methodName + " exited on exception!");
                                }
                            }
                        }
                    }
                })(method, instance[method]);
            }
        };

        this._decorators.push([service, decorator]);

        for (var singletonName in this._ioc._singletons) {

            if (!this._ioc._singletons.hasOwnProperty(singletonName))
                continue;

            var singletonBinding = this._ioc.GetBinding(singletonName);

            if (singletonBinding.service == service) {
                decorator(singletonBinding, this._ioc._singletons[singletonName]);
            }
        }
    },
    Decorate: function (binding, instance) {

        for (var i = 0; i < this._decorators.length; i++) {

            var entry = this._decorators[i];

            if (binding.service == entry[0]) {
                entry[1](binding, instance);
            }
        }
    },
    Log: function (message) {
        if (console && console.log) {
            console.log(message);
        }
    }
}
