/// <reference path="..\Intellisense.js"/>


describe("JsfTrace", function () {

    var sut;

    beforeEach(function () {
        sut = new JsfIoc();
        spyOn(sut._trace, "Log");
    });

    describe("when console is not defined", function () {

        it("doesnt blow up", function () {

        });
    });

    describe("when sut._trace.Log is not defined", function () {

        it("doesnt blow up", function () {

        });
    });

    describe("when console is defined", function () {

        function Foo() {
            this._property = Foo.OriginalProperty;
        }

        Foo.OriginalProperty = 123;

        Foo.prototype.Run = function () {
        };

        Foo.prototype.Throw = function () {
            throw "Farewell"
        };

        function Bar() {
        }

        Bar.prototype.Run = function () {
            this._foo.Run();
        };

        function expectStringIsTraceOfFunctionCompletion(actual, expectedClass, expectedWhitespace) {
            expectedWhitespace = expectedWhitespace || 0;
            var prefix = "^";
            for (var i = 0; i < expectedWhitespace; i++) {
                prefix = prefix + " ";
            }
            expect(actual).toMatch(prefix + "< " + expectedClass + "\\.Run \\(\\dms\\)");
        }

        describe("can trace service calls", function () {

            it("when the trace is requested before service registration", function () {

                sut.Trace(Foo);

                sut.Register("_foo").withConstructor(Foo);

                sut.Load("_foo").Run();

                expect(sut._trace.Log).toHaveBeenCalled();
                expect(sut._trace.Log.argsForCall[0]).toEqual(["> Foo.Run()"]);

                expectStringIsTraceOfFunctionCompletion(sut._trace.Log.argsForCall[1], "Foo");
            });

            it("when the trace is requested before service instantiation", function () {

                sut.Register("_foo").withConstructor(Foo);

                sut.Trace(Foo);

                sut.Load("_foo").Run();

                expect(sut._trace.Log).toHaveBeenCalled();
                expect(sut._trace.Log.argsForCall[0]).toEqual(["> Foo.Run()"]);
                expectStringIsTraceOfFunctionCompletion(sut._trace.Log.argsForCall[1], "Foo");
            });

            it("when the trace is requested after singleton instantiation", function () {

                sut.Register("_foo").withConstructor(Foo).asSingleton();

                var foo = sut.Load("_foo");

                sut.Trace(Foo);

                foo.Run();

                expect(sut._trace.Log).toHaveBeenCalled();
                expect(sut._trace.Log.argsForCall[0]).toEqual(["> Foo.Run()"]);
                expectStringIsTraceOfFunctionCompletion(sut._trace.Log.argsForCall[1], "Foo");
            });
        });

        it("doesn't affect non-method service members", function () {

            sut.Trace(Foo);

            sut.Register("_foo").withConstructor(Foo);

            expect(sut.Load("_foo")._property).toEqual(Foo.OriginalProperty);
        });

        it("nested calls are spaced", function () {

            sut.Trace(Foo);
            sut.Trace(Bar);

            sut.Register("_foo").withConstructor(Foo);
            sut.Register("_bar").withConstructor(Bar).withDependencies("_foo");

            sut.Load("_bar").Run();

            expect(sut._trace.Log).toHaveBeenCalled();
            expect(sut._trace.Log.argsForCall[0]).toEqual(["> Bar.Run()"]);
            expect(sut._trace.Log.argsForCall[1]).toEqual(["  > Foo.Run()"]);
            expectStringIsTraceOfFunctionCompletion(sut._trace.Log.argsForCall[2], "Foo", 2);
            expectStringIsTraceOfFunctionCompletion(sut._trace.Log.argsForCall[3], "Bar");
        });

        it("calls that throw an exception are traced", function () {
            sut.Trace(Foo);

            sut.Register("_foo").withConstructor(Foo);

            expect(function () {
                sut.Load("_foo").Throw();
            }).toThrow();

            expect(sut._trace.Log).toHaveBeenCalled();
            expect(sut._trace.Log.argsForCall[0]).toEqual(["> Foo.Throw()"]);
            expect(sut._trace.Log.argsForCall[1]).toEqual(["<!Foo.Throw exited on exception!"]);
        });

        it("decorated methods still work as before", function () {

            spyOn(Foo.prototype, "Run").andReturn("ABC");

            sut.Trace(Foo);

            sut.Register("_foo").withConstructor(Foo);

            var foo = sut.Load("_foo");

            var result = foo.Run(1, 2, 3);

            expect(Foo.prototype.Run).toHaveBeenCalledWith(1, 2, 3);
            expect(Foo.prototype.Run.mostRecentCall.object).toBe(foo);
            expect(result).toEqual("ABC");
        });
    });
});
