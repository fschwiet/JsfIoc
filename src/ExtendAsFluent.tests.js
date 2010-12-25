
describe("ExtendAsFluent", function() {
    function Foo() {
        ExtendAsFluent.PrototypeOf(Foo);
    }

    //ExtendAsFluent(Foo, {
    Foo.prototype = {
        setValue: function (value) {
            this._value = value;
        },
        getValue: function () {
            return this._value;
        }
    };

    Foo.prototype.Global = 3;

    var foo = new Foo();

    it("functions return values are stilled returned", function () {

        var expected = "123";

        var foo = new Foo();

        foo.setValue(expected);

        expect(foo.getValue()).toEqual(expected);

    });

    it("functions with no return value become fluent", function () {

        var foo = new Foo();

        expect(foo.setValue("123")).toEqual(foo);
    });

    it("non-functions are not modified", function() {

        var foo = new Foo();

        expect(Foo.prototype.Global).toEqual(3);
    });

    it("prototype is only extended once", function() {

        var fooA = new Foo();

        var firstSetValue = fooA.setValue;

        var fooB = new Foo();

        expect(firstSetValue).toBe(fooB.setValue);
    });
});
