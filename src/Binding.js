


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

