
describe("JsfIoc", function () {

    function Foo() {
    };

    function Bar() {
    };

    it("Register and load a minimal service", function () {

        var sut = new JsfIoc();

        sut.Register({
            name: "_foo",
            service: Foo
        });

        var result = sut.Load("_foo");

        expect(result instanceof Foo).toBeTruthy();
    });

    it("Register and load a service with a dependency", function () {

        var sut = new JsfIoc();

        sut.Register({
            name: "_bar",
            service: Bar
        });

        sut.Register({
            name: "_foo",
            service: Foo,
            requires: ["_bar"]
        });

        var result = sut.Load("_foo");

        expect(result._bar instanceof Bar).toBeTruthy();
    });

    describe("services can have configuration parameters they receive on startup", function() {

        it("Register and load a service with an initialization parameter", function () {

            var parameterValue = "123abc";

            var sut = new JsfIoc();

            sut.Register({
                name: "_foo",
                service: Foo,
                parameters: ["_fooLevel"]
            });

            var result = sut.Load("_foo", parameterValue);

            expect(result._fooLevel).toEqual(parameterValue);
        });
        
        it("Services can have their configuration values set before they are loaded", function() {

            var parameterValue = "123abc";

            var sut = new JsfIoc();

            sut.Register({
                name: "_foo",
                service: Foo,
                parameters: ["_fooLevel"]
            });

            sut.Configure("_foo", parameterValue);

            var result = sut.Load("_foo");

            expect(result._fooLevel).toEqual(parameterValue);

        });
    });

    it("Register and load a singleton", function () {

        var initialValue = "abc123";

        var sut = new JsfIoc();

        sut.Register({
            name: "_foo",
            service: Foo,
            singleton: true
        });

        var result1 = sut.Load("_foo");
        var result2 = sut.Load("_foo");

        expect(result1).toBe(result2);
    });

    it("Services are not singletons by default", function () {

        var initialValue = "abc123";

        var sut = new JsfIoc();

        sut.Register({
            name: "_foo",
            service: Foo
        });

        var result1 = sut.Load("_foo");
        var result2 = sut.Load("_foo");

        expect(result1).not.toBe(result2);
    });

    it("Register and load an instance", function () {

        var instance = new Foo();

        var sut = new JsfIoc();

        sut.RegisterInstance("_foo", instance);

        var result = sut.Load("_foo");

        expect(result).toBe(instance);
    });

    describe("Register error handling", function () {

        var sut;

        beforeEach(function () {

            sut = new JsfIoc();
        });

        it("Parameter 'name' should be a string", function () {

            expect(function () {
                sut.Register({});
            }).toThrow("Register must be called with string parameter 'name'");
        });

        it("Parameter 'service' should be a function", function () {

            expect(function () {
                sut.Register({ name: "xyz321" });
            }).toThrow("Register must be called with function parameter 'service'");
        });
    });
});
