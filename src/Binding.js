


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
    this._eventAwakener = []; // create instance when event is seen

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

    createdOnEvents: function() {
        Binding.AppendArgsToMember(arguments, this, "_eventAwakener");
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

