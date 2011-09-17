
function JsfIoc() {
    this._bindings = [];
    this._singletons = [];
    this._trace = new JsfTrace(this);
    this._createdListeners = {};
}

JsfIoc.prototype = {

    Register: function (name) {
        ///	<returns type="BindingStart" />

        return new BindingStart(this, name);
    },

    RegBinding: function (binding) {
        this._bindings[binding._name] = binding;
    },

    RegisterInstance: function (name, instance) {

        this._singletons[name] = instance;
    },

    Load: function (name) {

        var result = this._singletons[name];

        if (result)
            return result;

        var binding = this.GetBinding(name, "Load");

        function Temp() {
        }

        Temp.prototype = binding.service.prototype;

        var result = new Temp();
        result.constructor = binding.service;

        if (binding.boundParameters) {
            for (var i = 0; i < binding._parameters.length; i++) {
                var parameter = binding._parameters[i];
                result[parameter._name] = binding.boundParameters[parameter._name];
            }
        }
        else {
            var values = Array.prototype.slice.call(arguments, 1); // all arguments after the first

            this._SetParametersToObject(binding, result, values)
        }

        for (var i = 0; i < binding._requires.length; i++) {
            var dependency = binding._requires[i];
            result[dependency] = this.Load(dependency);
        }

        binding.service.apply(result, []);

        for (var i = 0; i < binding._eventSource.length; i++) {

            (function (event, that) {

                result["_notify" + event] = function () {
                    that.NotifyEvent(event, arguments);
                };
            })(binding._eventSource[i], this);
        }

        for (var i = 0; i < binding._eventListener.length; i++) {

            var event = binding._eventListener[i];

            if (!this._createdListeners[event]) {
                this._createdListeners[event] = [];
            }

            this._createdListeners[event].push({
                listener: result,
                test: binding._keepInstanceWhile ? binding._keepInstanceWhile : function () { return true; }
            });
        }

        this._trace.Decorate(binding, result);

        if (binding._singleton) {
            this._singletons[name] = result;
        }

        return result;
    },
    Configure: function (name) {

        var binding = this.GetBinding(name, "Configure");

        var boundParameters = {};

        for (var i = 0; i < binding._parameters.length; i++) {
            this._SetParameterToObject(binding, binding._parameters[i], boundParameters, arguments[1 + i], i);
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

            var binding = this._bindings[bindingName];

            var inArray = function (arr, name) {

                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] == name) {
                        return true;
                    }
                }

                return false;
            };

            if (inArray(binding._eventListener, name) && inArray(binding._eventAwakener, name)) {

                this.Load(bindingName);
            }
        }

        if (this._createdListeners[name]) {

            var listeners = this._createdListeners[name];

            for (var i = 0; i < listeners.length; i++) {

                var listener = listeners[i].listener;
                listener["On" + name].apply(listener, eventParameters || []);
            }
        }
    },
    Trace: function () {
        return this._trace.Trace.apply(this._trace, arguments);
    },
    DoPeriodicCleanup: function () {

        for (name in this._createdListeners) {

            if (!this._createdListeners.hasOwnProperty(name))
                continue;

            var listeners = this._createdListeners[name];

            for (var i = listeners.length - 1; i >= 0; i--) {

                var listener = listeners[i].listener;
                var test = listeners[i].test;

                if (!test.apply(listener)) {
                    listeners.splice(i, 1);
                }
            }
        }
    },
    _SetParametersToObject: function (binding, target, values) {
        for (var i = 0; i < binding._parameters.length; i++) {
            this._SetParameterToObject(binding, binding._parameters[i], target, values[i], i);
        }
    },
    _SetParameterToObject: function (binding, parameter, target, value, index) {

        if (typeof (value) !== "undefined" && !parameter.validator(value)) {
            throw new Error("Invalid parameter #" + (index + 1) + " passed to " + binding._name + ".");
        }

        if (typeof (value) === "undefined") {
            if (typeof (parameter.defaultValue) !== "undefined") {
                target[parameter._name] = parameter.defaultValue;
            }
        } else {
            target[parameter._name] = value;
        }
    }
};

function JsfParameter(name) {
    this._name = name;
    this.validator = function () { return true; };

    ExtendAsFluent.PrototypeOf(JsfParameter);
}

JsfParameter.prototype = {
    constructor: JsfParameter,
    withValidator: function (value) {
        ///	<returns type="JsfParameter" />
        this.validator = value;
    },
    withDefault: function (value) {
        ///	<returns type="JsfParameter" />
        this.defaultValue = value;
    },
    asSingleJQueryElement: function () {
        ///	<returns type="JsfParameter" />

        this.validator = function (value) {

            return typeof (jQuery) != "undefined" &&
                    (value instanceof jQuery) &&
                    (value.length == 1);
        }
    }
};

JsfIoc.prototype.Parameter = function (name) {
    ///	<returns type="JsfParameter" />
    return new JsfParameter(name);
};






