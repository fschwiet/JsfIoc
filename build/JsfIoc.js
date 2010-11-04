// Binding.js


function Binding() {
    this.requires = [];
    this.parameters = [];
    this.singleton = false;
    this.eventSource = [];
    this.eventListener = [];
}

Binding.WhitespaceRegex = /^\s*$/;

Binding.prototype = {
    constructor: Binding,

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
// JsfIoc.js
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


function JsfIoc() {
    this._bindings = [];
    this._singletons = [];
}

JsfIoc.prototype = {

    Register: function (parameters) {
        if (typeof parameters.name != "string") {
            throw "Register must be called with string parameter 'name'";
        } else if (typeof parameters.service != "function") {
            throw "Register must be called with function parameter 'service'";
        };

        var binding = new Binding();
        for (var key in parameters) {
            if (parameters.hasOwnProperty(key))
                binding[key] = parameters[key];
        }

        for (var i = 0; i < binding.parameters.length; i++) {
            if (typeof binding.parameters[i] == "string") {
                var name = binding.parameters[i];
                binding.parameters[i] = {
                    name: name,
                    validator: function () { return true; }
                };
            }
        }

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
// ParameterTypes.js

function JQueryElementParameter(name) {
    return {
        name: name,

        validator: function (value) {

            return (value instanceof jQuery) && 
                   (value.length == 1);
        }
    };
}
