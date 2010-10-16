

describe("RectangleParticle", function () {

    it("is a type of Particle", function () {

        var sut = new RectangleParticle();

        expect(sut).toEqual(jasmine.any(Particle));
    });

    it("uses Particle init function", function () {

        var mass = some.Integer();
        var positionX = some.Integer();
        var positionY = some.Integer();

        spyOn(Particle.prototype, "init");

        var sut = new RectangleParticle(mass, positionX, positionY);

        expect(Particle.prototype.init).toHaveBeenCalledWith(mass, positionX, positionY);
    });

    it("can have dimesions set", function () {

        var width = some.Integer();
        var height = some.Integer();

        var sut = new RectangleParticle(some.Integer(), some.Integer(), some.Integer());

        expect(sut.SetDimensions(width, height)).toEqual(sut);

        expect(sut.width).toEqual(width);
        expect(sut.height).toEqual(height);
    });
});