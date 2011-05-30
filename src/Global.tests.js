var testValue=3;

describe("Global", function() {


    it("Returns the global object", function () {

		var global=getGlobal();
		
		expect(global['testValue']).toEqual(3);
    });
});
