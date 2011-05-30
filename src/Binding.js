


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

        var binding = new Binding(this._name,value,true);
        binding.service = RedefineFromObject(value,this._container,this._name);

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
    },

    withScopedConstructor: function (name,scope) {
	///	<summary>
	///		Registers a component by scoped constructor, returning a configuration builder with more options.
	///	</summary>
	///	<param name="name" type="string">
    ///     The constructor name for the component
	///	<param name="scope" type="object">
    ///     The scope of the constructor for the component
	///	</param>
	///	<returns type="Binding" />

        if (scope==undefined)
        	scope=getGlobal();
        var binding = new Binding(this._name,scope[name],true);

        binding.service = Redefine(name,scope,this._container,this._name);

        this._container.RegBinding(binding);

        return binding;
    },
    
    withFunction: function (obj) {
	///	<summary>
	///		Registers a component by scoped constructor, returning a configuration builder with more options.
	///	</summary>
	///	<param name="name" type="string">
    ///     The constructor name for the component
	///	<param name="scope" type="object">
    ///     The scope of the constructor for the component
	///	</param>
	///	<returns type="Binding" />

        var binding = new Binding(this._name,obj,false);
        
        binding.service = RedefineFromObject(obj,this._container,this._name);

        this._container.RegBinding(binding);

        return binding;
    },

    withScopedFunction: function (name,scope) {
	///	<summary>
	///		Registers a component by scoped constructor, returning a configuration builder with more options.
	///	</summary>
	///	<param name="name" type="string">
    ///     The constructor name for the component
	///	<param name="scope" type="object">
    ///     The scope of the constructor for the component
	///	</param>
	///	<returns type="Binding" />

        if (scope==undefined)
        	scope=getGlobal();
        var binding = new Binding(this._name,scope[name],false);
        
        binding.service = Redefine(name,scope,this._container,this._name);

        this._container.RegBinding(binding);

        return binding;
    },

}


function Binding(name,original,isObject) {
    this._name = name;
    this._requires = [];
    this._parameters = [];
    this._singleton = false;
    this._eventSource = [];
    this._eventListener = [];
    this._original=original;
    this._isObject=isObject;

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
        var result = this._original.toString();

        if (result.indexOf("(") > -1)
            result = result.slice(0, result.indexOf("("));
        if (result.indexOf("function ") == 0)
            result = result.slice("function ".length);

        if (Binding.WhitespaceRegex.test(result))
            return this._name;

        return result;
    },
    
	getService: function(){
	///	<summary>
	///		Retrieves the service function for the bining, allowing for example to redefinition of local functions.
	///	</summary>
	///	<returns type="object" />
		return this.service;
	}
}

Binding.WhitespaceRegex = /^\s*$/;

Binding.AppendArgsToMember = function(args, target, member) {
    for(var i = 0; i < args.length; i++) {
        target[member].push(args[i]);
    }
}
