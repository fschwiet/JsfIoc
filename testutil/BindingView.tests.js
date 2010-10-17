

describe("BindingView", function () {

    function Foo() {
    }


    function get_view_for_foo(serviceDefinition) {

        var ioc = new JsfIoc();

        ioc.Register(serviceDefinition);

        var sut = new BindingView(ioc);

        return sut.Draw("_foo");
    }

    describe("can draw a service", function () {

        it("includes the name", function () {

            var view = get_view_for_foo({
                service: Foo,
                name: "_foo"
            });

            expect(view.text()).toContain("Foo");
        });

        it("includes eventsSource", function () {

            var view = get_view_for_foo({
                service: Foo,
                name: "_foo",
                eventSource: ["Baz"]
            });

            expect(view.find("span.eventSource:contains('Baz >')").length).toEqual(1);
        });

        it("includes eventListener", function () {

            var view = get_view_for_foo({
                service: Foo,
                name: "_foo",
                eventListener: ["Baz"]
            });

            expect(view.find("span.eventListener:contains('> Baz')").length).toEqual(1);
        });
    });

    describe("can draw an instance registered as a service", function () {

        it("includes the name", function () {

            var ioc = new JsfIoc();

            ioc.RegisterInstance("_foo", {});

            var sut = new BindingView(ioc);

            var view = sut.Draw("_foo");

            expect(view.text()).toContain("Foo");
        });
    });

    it("the result has a fixed height and width of one", function () {

        var view = get_view_for_foo({
            service: Foo,
            name: "_foo"
        });

        expect(view.height()).toEqual(1);
        expect(view.width()).toEqual(1);
    });

    it("the result has an inner div, relative position so the container is centered around its container", function () {

        var view = get_view_for_foo({
            service: Foo,
            name: "_foo"
        });

        var innerDiv = view.children("div");
        var innerHeight = innerDiv.height();
        var innerWidth = innerDiv.width();

        expect(innerHeight).toBeGreaterThan(0);
        expect(innerWidth).toBeGreaterThan(0);

        expect(innerDiv.hasClass("binding")).toBeTruthy();

        expect(innerDiv.css("position")).toEqual("relative");

        expect(innerDiv.css("left")).toEqual(-innerWidth / 2 + "px");
        expect(innerDiv.css("top")).toEqual(-innerHeight / 2 + "px");
    });

    it("bindingview_height() / bindingview_width() allow the caller to check its the necessary dimensions", function () {

        var view = get_view_for_foo({
            service: Foo,
            name: "_foo"
        });

        var innerDiv = view.children("div");
        var innerHeight = innerDiv.height();
        var innerWidth = innerDiv.width();

        expect(view.bindingView_height()).toEqual(innerHeight);
        expect(view.bindingView_width()).toEqual(innerWidth);
    });
});