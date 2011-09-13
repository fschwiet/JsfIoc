// license.txt
/*********************************************************************

(this is the MIT license)

Copyright (c) 2010 Frank Schwieterman

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**********************************************************************/
// Binding.js



function BindingStart(ioc, name) {
    this._container = ioc;
    this._name = name;

    ExtendAsFluent.PrototypeOf(BindingStart);
}


BindingStart.prototype = {
    constructor: BindingStart,

    withConstructor: function (value) {
	///	<summary>
	///		Registers a component by constructor, returning a configuration builder with more options.
	///	</summary>
	///	<param name="value" type="function">
    ///     The constructor for the component
	///	</param>
	///	<returns type="Binding" />

        var binding = new Binding(this._name);
        binding.service = value;

        this._container.RegBinding(binding);

        return binding;
    },

    withInstance: function (value) {
	///	<summary>
	///		Registers a component with a single instance.
	///	</summary>
	///	<param name="value" type="Object">
    ///     An instance of the component
	///	</param>

        this._container.RegisterInstance(this._name, value);
    }
}


function Binding(name) {
    this._name = name;
    this._requires = [];
    this._parameters = [];
    this._singleton = false;
    this._eventSource = [];
    this._eventListener = [];

    ExtendAsFluent.PrototypeOf(Binding);
}

Binding.prototype = {
    constructor: Binding,

    withDependencies: function() {
    	///	<returns type="Binding" />
        Binding.AppendArgsToMember(arguments, this, "_requires");
    },

    withParameters: function() {
	    ///	<returns type="Binding" />
        Binding.AppendArgsToMember(arguments, this, "_parameters");

        for (var i = 0; i < this._parameters.length; i++) {
            if (typeof this._parameters[i] == "string") {
                this._parameters[i] = JsfIoc.prototype.Parameter(this._parameters[i]);
            }
        }
    },

    asSingleton: function() {
	    ///	<returns type="Binding" />
        this._singleton = true;
    },

    sendingEvents: function() {
	    ///	<returns type="Binding" />
        Binding.AppendArgsToMember(arguments, this, "_eventSource");
    },

    receivingEvents: function() {
	    ///	<returns type="Binding" />
        Binding.AppendArgsToMember(arguments, this, "_eventListener");
    },

    GetFriendlyName: function () {
        var result = this.service.toString();

        if (result.indexOf("(") > -1)
            result = result.slice(0, result.indexOf("("));
        if (result.indexOf("function ") == 0)
            result = result.slice("function ".length);

        if (Binding.WhitespaceRegex.test(result))
            return this._name;

        return result;
    }
}

Binding.WhitespaceRegex = /^\s*$/;

Binding.AppendArgsToMember = function(args, target, member) {
    for(var i = 0; i < args.length; i++) {
        target[member].push(args[i]);
    }
}

// ExtendAsFluent.js


ExtendAsFluent = {};

ExtendAsFluent.PrototypeOf = function (obj) {

    var prototype = obj.prototype;

    if (prototype.isFluent)
        return;

    prototype.isFluent = true;
    
    for (var key in prototype) {

        if (!prototype.hasOwnProperty(key))
            continue;

        if (typeof (prototype[key]) == "function") {

            prototype[key] = (function (original) {
                return function () {
                    var rv = original.apply(this, arguments);

                    if (typeof (rv) === "undefined")
                        return this;
                    else
                        return rv;
                }
            })(prototype[key]);
        }
    }
};
// JsfIoc.js

function JsfIoc() {
    this._bindings = [];
    this._singletons = [];
    this._trace = new JsfTrace(this);
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

            var events = this._bindings[bindingName]._eventListener;

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
    Trace: function () {
        return this._trace.Trace.apply(this._trace, arguments);
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






// JsfTrace.js


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
};
