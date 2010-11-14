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
    this.container = ioc;
    this.name = name;

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

        var binding = new Binding(this.name);
        binding.service = value;

        this.container.RegBinding(binding);

        return binding;
    },

    withInstance: function (value) {
	///	<summary>
	///		Registers a component with a single instance.
	///	</summary>
	///	<param name="value" type="Object">
    ///     An instance of the component
	///	</param>

        this.container.RegisterInstance(this.name, value);
    }
}


function Binding(name) {
    this.name = name;
    this.requires = [];
    this.parameters = [];
    this.singleton = false;
    this.eventSource = [];
    this.eventListener = [];

    ExtendAsFluent.PrototypeOf(Binding);
}

Binding.prototype = {
    constructor: Binding,

    withDependencies: function() {
    	///	<returns type="Binding" />
        Binding.AppendArgsToMember(arguments, this, "requires");
    },

    withParameters: function() {
	    ///	<returns type="Binding" />
        Binding.AppendArgsToMember(arguments, this, "parameters");

        for (var i = 0; i < this.parameters.length; i++) {
            if (typeof this.parameters[i] == "string") {
                this.parameters[i] = JsfIoc.prototype.Parameter(this.parameters[i]);
            }
        }
    },

    asSingleton: function() {
	    ///	<returns type="Binding" />
        this.singleton = true;
    },

    sendingEvents: function() {
	    ///	<returns type="Binding" />
        Binding.AppendArgsToMember(arguments, this, "eventSource");
    },

    receivingEvents: function() {
	    ///	<returns type="Binding" />
        Binding.AppendArgsToMember(arguments, this, "eventListener");
    },

    GetFriendlyName: function () {
        var result = this.service.toString();

        if (result.indexOf("(") > -1)
            result = result.slice(0, result.indexOf("("));
        if (result.indexOf("function ") == 0)
            result = result.slice("function ".length);

        if (Binding.WhitespaceRegex.test(result))
            return this.name;

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
            var values = Array.prototype.slice.call(arguments, 1); // all arguments after the first

            this._SetParametersToObject(binding, result, values)
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
    _SetParametersToObject: function(binding, target, values) {
        for (var i = 0; i < binding.parameters.length; i++) {
            this._SetParameterToObject(binding, binding.parameters[i], target, values[i], i);
        }
    },
    _SetParameterToObject: function (binding, parameter, target, value, index) {

        if (!parameter.validator(value)) {
            throw new Error("Invalid parameter #" + (index + 1) + " passed to " + binding.name + ".");
        }

        if (typeof(value) === "undefined") {
            if (typeof(parameter.defaultValue) !== "undefined") {
                target[parameter.name] = parameter.defaultValue;
            }
        } else {
            target[parameter.name] = value;
        }
    }
};

function JsfParameter(name) {
    this.name = name;
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
    asSingleJQueryElement : function() {
        ///	<returns type="JsfParameter" />

        this.validator =function (value) {

            return typeof(jQuery) != "undefined" &&
                    (value instanceof jQuery) && 
                    (value.length == 1);
        }
    }
}

JsfIoc.prototype.Parameter = function (name) {
    ///	<returns type="JsfParameter" />
    return new JsfParameter(name);
}



var ioc = new JsfIoc();




