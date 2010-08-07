JsfIoc
by Frank Schwieterman


JsfIoc is a simple and light-weight inversion of container for javascript.  The hope was to provide an easy way to wire up dependencies while keeping the code print small.

To see how it is used, read the tests in "ioc.tests.js".  There the following features are demonstrated:

- services may register dependencies on other services registered with the container
- services may register initialization parameters to be provided when the service is loaded
- services may optionally be singletons
- instances of services can be registered.

Dependencies and initialization parameters are provided to the service instance by property injection.
The service class does not need declare the properties, they are created after the service's constructor is called.

RegisterInstance() is provided in the case that you have existing singletons you want to provide as dependencies to other services.  Register({singleton:true}) would be used when you want the ioc container to provide dependencies and initialization parameters.
