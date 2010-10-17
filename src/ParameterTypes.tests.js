
describe("JQueryElementParameter", function () {

    var parameter;

    beforeEach(function () {

        parameter = JQueryElementParameter("_foo");
    });

    it("uses the input parameter as its name", function () {

        expect(parameter.name).toEqual("_foo");
    });

    it("a single jQuery collections is valid", function () {

        expect(parameter.validator($("<div></div>"))).toBeTruthy();
    });

    it("multiple jQuery elements are not invalid", function () {

        expect(parameter.validator($("<div></div><div></div>"))).not.toBeTruthy();
    });

    it("other stuff is considered invalid", function () {

        expect(parameter.validator()).not.toBeTruthy();
        expect(parameter.validator(null)).not.toBeTruthy();
        expect(parameter.validator(1)).not.toBeTruthy();
        expect(parameter.validator([1])).not.toBeTruthy();
    });

});