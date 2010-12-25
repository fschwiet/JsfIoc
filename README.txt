JsfIoc
by Frank Schwieterman


JsfIoc is a simple and light-weight inversion of container for javascript.  The goal is to provide an easy way to wire up dependencies while keeping the code size small.

To see how it is used, read the tests in "ioc.tests.js".  There the following features are demonstrated:

- services may register dependencies on other services within the same container
- services may register initialization parameters to be provided when a service is first instantiated
- services may be singletons
- instances of existing objects can be registered as services
- services can announce named events to all listening services

JsfIoc allows services to be Register()d, with various service parameters.

When a service is JsfIoc:Load()d, dependencies and initialization parameters are provided to the service instance by property injection.
The name of the property injected is the name registered for the dependency or parameter when the service was Register()d.

Register({singleton:true, ..}) can be used to register a singleton service.
RegisterInstance(serviceName, serviceInstance) can associate an existing service instance with a service name.

FakeJsfIoc does automocking, to make unit testing easier.  The system under test is loaded with FakeJsfIoc:Load.  Dependencies will be provided as stubs or mocks depending on the policy set to FakeJsfIoc:TestDoublePolicy.    The test doubles can be accessed with FakeJsfIoc:LoadTestDouble before or after creating the system under test, in order to set expectations with jasmine's spyOn.  See FakeJsfIoc.tests.js

JsfIoc will also produce a dependency graph prinatable with Graphviz (http://graphviz.org/).
To print a dependency graph, see how JsfIoc.GraphVizFormatting is used in the current test runner.
This produces output that GraphViz can process.  Use Graphviz from command line parameters like:

'C:\Program Files (x86)\Graphviz2.26.3\bin\dot.exe' -Tjpg .\input.dot -o output.jpg
'C:\Program Files (x86)\Graphviz2.26.3\bin\dot.exe' -Tjpg .\input.dot -o output.jpg
'C:\Program Files (x86)\Graphviz2.26.3\bin\dot.exe' -Tpdf .\input.dot -o output.pdf
