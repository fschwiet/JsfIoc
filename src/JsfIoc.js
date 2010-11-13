
function JsfIoc() {
    this._bindings = [];
    this._singletons = [];
}

JsfIoc.prototype = {

    Register: function (name) {
        ///	<returns type="BindingStart" />

        return new BindingStart(this, name);
    },

    RegBinding: function (binding) {
        this._bindings[binding.name] = binding;
    },

    RegisterInstance: function (name, instance) {

        this._singletons[name] = instance;
    },

    Load: function (name) {

        var result = this._singletons[name];

        if (result)
            return result;

        var binding = this.GetBinding(name, "Load");

        result = new binding.service;

        for (var i = 0; i < binding.requires.length; i++) {
            var dependency = binding.requires[i];
            result[dependency] = this.Load(dependency);
        }

        if (binding.boundParameters) {
            for (var i = 0; i < binding.parameters.length; i++) {
                var parameter = binding.parameters[i];
                result[parameter.name] = binding.boundParameters[parameter.name];
            }
        }
        else {
            for (var i = 0; i < binding.parameters.length; i++) {
                this._SetParameterToObject(binding, binding.parameters[i], result, arguments[1 + i], i);
            }
        }

        for (var i = 0; i < binding.eventSource.length; i++) {

            (function (event, that) {

                result["_notify" + event] = function () {
                    that.NotifyEvent(event, arguments);
                };
            })(binding.eventSource[i], this);
        }

        if (binding.singleton) {
            this._singletons[name] = result;
        }

        return result;
    },
    Configure: function (name) {

        var binding = this.GetBinding(name, "Configure");

        var boundParameters = {};

        for (var i = 0; i < binding.parameters.length; i++) {
            this._SetParameterToObject(binding, binding.parameters[i], boundParameters, arguments[1 + i], i);
        }

        binding.boundParameters = boundParameters;
    },
    GetBinding: function (name, caller) {

        var binding = this._bindings[name];

        if (typeof (binding) == "undefined") {
            throw caller + " was called for undefined service '" + name + "'.";
        }

        return binding;
    },
    NotifyEvent: function (name, eventParameters) {

        for (var bindingName in this._bindings) {

            if (!this._bindings.hasOwnProperty(bindingName))
                continue;

            var events = this._bindings[bindingName].eventListener;

            if (events) {

                for (var i = 0; i < events.length; i++) {

                    if (events[i] == name) {

                        var listener = this.Load(bindingName);

                        listener["On" + name].apply(listener, eventParameters || []);
                    }
                }
            }
        }
    },
    _SetParameterToObject: function (binding, parameter, target, value, index) {
        if (!parameter.validator(value)) {
            throw new Error("Invalid parameter #" + (index + 1) + " passed to " + binding.name + ".");
        }

        target[parameter.name] = value;
    }
};

var ioc = new JsfIoc();

