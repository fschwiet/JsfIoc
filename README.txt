JsfIoc
by Frank Schwieterman


JsfIoc is a simple and light-weight inversion of container for javascript.  The goal is to provide an easy way to wire up dependencies while keeping the code size small.

To see how it is used, read the tests in "ioc.tests.js".  There the following features are demonstrated:

- services may register dependencies on other services within the same container
- services may register initialization parameters to be provided when a service is first instantiated
- services may be singletons
- instances of existing objects can be registered as services

Dependencies and initialization parameters are provided to the service instance by property injection.
The service class does not need declare the properties, they are created after the service's constructor is called.

RegisterInstance() is provided in the case that you have statically implemented singletons you want to provide as dependencies to other services.  Otherwise using Register({singleton:true}) is preferred for singletons.

The name of services and properties also become the property name they are assigned to on the target.  For this reason, they should follow the same naming conventions as private members of a class.  For me, that means starting with a '_'.

FakeJsfIoc can be used to test instances wired by the Ioc container.  The fake ioc container will load stubs or mocks depending on the test double policy.  The test doubles can have expectations set on them before and after loading the system under test.  See FakeJsfIoc.tests.js