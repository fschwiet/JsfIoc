JsfIoc
by Frank Schwieterman


JsfIoc is a simple and light-weight inversion of container for javascript.  The goal is to provide an easy way to wire up dependencies while keeping the code size small.

To see how it is used, read the tests in "ioc.tests.js".  There the following features are demonstrated:

- services may register dependencies on other services within the same container
- services may register initialization parameters to be provided when a service is instantiated
- services may be singletons
- instances of existing objects can be registered as services

Dependencies and initialization parameters are provided to the service instance by property injection.
The service class does not need declare the properties, they are created after the service's constructor is called.

RegisterInstance() is provided in the case that you have existing singletons you want to provide as dependencies to other services.  Register({singleton:true}) would be used when you want the ioc container to provide dependencies and initialization parameters.

The name of services and properties also become the property name they are assigned to on the target.  For this reason, they should follow the same naming conventions as private members of a class.  For me, that means starting with a '_'.