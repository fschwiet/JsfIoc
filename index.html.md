---
title: "JsfIoc"
---


## Registering a minimal service

JsfIoc allows registering component via a fluent interface.  Each registration always has a name, and may register a component by
its constructor or an instance.  Registering a component by its constructor is preferred as the other options made available by the ioc container are available.
Registering by instance is a means to pull in components that do not use the ioc container.  JsfIoc declares a global instance of JsfIoc named "ioc".  You can use
it, or create your own with new JsfIoc().

{% highlight javascript %}

    // component definition by constructor
    function Foo() { }
    ioc.Register("_foo").withConstructor(foo);
    Foo.prototype.Run = function() { return "Hello, world"; }

    // component usage: opens an alert box with text "Hello, World"
    alert(ioc.Load("_foo").Run());
{% endhighlight %}

{% highlight javascript %}

    // component registration by instance
    function FooLegacy() { }
    Foo.prototype.Run = function() { return "Hello, flat world"; }
    ioc.Register("_fooLegacy").withInstance(new FooLegacy());

    // component usage: opens an alert box with text "Hello, flat world"
    alert(ioc.Load("_fooLegacy").Run());
{% endhighlight %}


## Dependencies

Components can indicate dependency on other components.  When a component is loaded from the ioc container, its dependencies
are also created.  The dependencies are not available until after the constructor completes.  Circular dependencies are not supported.

{% highlight javascript %}

    // component definition by constructor
    function Bar() { }
    ioc.Register("_bar").withConstructor(Bar).withDependencies("_foo", "_fooLegacy");
    Bar.prototype.Run = function() { return this._foo.Run() + " and " + this._fooLegacy.Run(); };

    // component usage: opens an alert box with text "Hello, world and Hello, flat world"
    alert(ioc.Load("_bar").Run());

{% endhighlight %}

The expression "this._foo" shows that the Foo component was added as a
field to the class.
The name of the field added is the name the dependency was registered
with, which why I prefix component names with "_" during registration.

The examples in this document use ioc.Load() to access components,
thats for examples only.
When using an ioc container properly, usually only a few top-level
components are loaded directly while a majority of components should
be loaded as dependencies.


## Testing

JsfIoc has a corresponding class FakeJsfIoc which can be used when unit testing.
It will let you load a component with test doubles attached for each dependency.
Under the hood, the dependencies are created, but only to discover
what methods they support.
By default the test doubles are stubs, but this can be customized.
The stub methods have no side effects or return value.

{% highlight javascript %}

    var fakeIoc = new FakeJsfIoc(ioc);

    var testBar = fakeIoc.Load("_bar");

    // opens a dialog with "function"
    alert(typeof(testBar._foo.Run);

    // opens a dialog containing "undefined and undefined"
    alert(testBar.Run());

{% endhighlight %}

JsfIoc methods all identify the components by the name they were
registered with.  FakeJsfIoc however can also take the constructor as
an identifier.
Using a constructor to identify the component is nicer to read, but we
don't do that with our production code as that requires components to
be defined in a particular order.
Test doubles can be loaded with fakeIoc.LoadTestDouble() before or
after the component under test is loaded with fakeIoc.Load().


## Modifying test doubles

The test doubles provided can be modified as part of test setup.

{% highlight javascript %}

    var fakeIoc = new FakeJsfIoc(ioc);

    fakeIoc.LoadTestDouble(Foo).Run = function() { return "Hello, test"; }
    fakeIoc.LoadTestDouble("_fooLegacy").Run = function() { return "Hello, flat test"; }

    var testBar = fakeIoc.Load("_bar");

    // opens a dialog containing "Hello, test and Hello, flat test";
    alert(testBar.Run());

    ioc.Register("_bar").withInstance({ Run : function() { return "bar was run"; });

{% endhighlight %}


## Register a component with configuration parameters

A component can be registered with parameters, to allow those values
to be injected later.
The parameter will be attached to the component after its created.

{% highlight javascript %}

    //  the component definition
    function Baz() { }
    ioc.Register("_baz").withConstructor(Baz).withParameters("_salutation", "_recipient");
    Baz.prototype.Run = function() { return this._salutation + ", " + this._recipient; }

    //  somewhere else, the component is configured
    ioc.Configure("_baz", "Hello", "current city");

    // this usage opens an alert box with text "Hello, current city"
    alert(ioc.Load("_baz").Run());

{% endhighlight %}

Parameters can have a default value.  The default value is primarily
used when testing, where its a hassle to provide a parameter value for
every test.

{% highlight javascript %}

    //  the component definition
    function Baz() { }
    ioc.Register("_baz").withConstructor(Baz).withParameters(ioc.Parameter("_parameter").withDefaultValue("Hello, default city"));
    Baz.prototype.Run = function() { return this._parameter; }

    // this usage opens an alert box with text "Hello, default city"
    alert(ioc.Load("_baz").Run());

{% endhighlight %}

Parameters can also have validation functions, to ensure any parameter
value provided is as expected.
This is primarily to help find bugs early, during production usage
your code shouldn't be passing in invalid parameters.

{% highlight javascript %}

    function isNumber(value) {
        return typeof (value) == "number";
    }

    //  the component definition
    function Baz() { }
    ioc.Register("_baz").withConstructor(Baz).withParameters(ioc.Parameter("_parameter").withValidator(isNumber));
    Baz.prototype.Run = function() { return this._parameter; }

    // this usage will throw an error, as a valid parameter value has
    not been provided
    alert(ioc.Load("_baz").Run());

{% endhighlight %}

Typically I use parameters to pass in the DOM element where a
component will render itself.
There is a shorthand method to take a parameter that should be a
single DOM element within a jQuery collection:
This is useful in case the jQuery selector for the targeted DOM
element doesn't match a single element as expected.

{% highlight javascript %}

    // the component definition
    function Baz() { }
    ioc.Register("_baz").withConstructor(Baz).withParameters(ioc.Parameter("_parameter").asSingleJQueryElement());

    // the component is configured before use
    <div class="bazContainer"></div>
    <script type="text/javascript"> ioc.Configure("_baz", $(".bazContainer")); </script

{% endhighlight %}

## Singletons

Typically, every time a component is loaded a new instance of the
component is created.
So if multiple components all depend on the same component Foo, a
different instance of Foo is provided for each instance of each class
as they are created.
If you'd rather there only be one instance of the component used
everywhere, you can register it as an instance or register it with a
constructor as a singleton.

{% highlight javascript %}

    // the component definition
    function SingletonFoo() { }
    ioc.Register("_singletonFoo").withConstructor(SingletonFoo).asSingleton();

    // opens an alert box with text 'true'
    alert(ioc.Load("_singletonFoo") == ioc.Load("_singletonFoo"));
{% endhighlight %}


## Events

Events provide a means to do one-to-many communication, or to break
dependency cycles.
A component may be registered as a source or listener for some number of events.
Event sources have a method added "_notify<EVENT>", when that method
is called all listeners are called.
Parameters passed to the notify function are passed to all the listeners.
Event listeners should have a method "On<EVENT>" which will then
receive all the events.
Support for events is a bit crude, it generally makes sense of
listeners to be singletons.
If they're not singletons, a new instance is created for each listener
each time the event is triggered, only that most recent instance
receives the notification.

{% highlight javascript %}

    // component definitions

    function Listener() {}
    ioc.Register("_listener").withConstructor(Listener).receivingEvents("Change");
    Listener.prototype.OnChange = function(value) { alert(value); };

    function Source() {}
    ioc.Register("_source").withConstructor(Source).sendingEvents("Change");
    Source.prototype.Run = function() { this._notifyChange("Hello, all"); }

    // Example usage opens alert box "Hello, all"
    ioc.Load(Source).Run();

{% endhighlight %}


## More on FakeJsfIoc

todo...

