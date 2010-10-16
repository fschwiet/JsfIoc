

describe("PreferredDistanceCalculator", function () {

    it("if either node is a particle, return the padding as the preferred distance", function () {

        var padding = some.Integer();

        var sut = new PreferredDistanceCalculator(padding);

        expect(sut.GetDistance(new Particle(), new Particle())).toEqual(padding);
        expect(sut.GetDistance(new RectangleParticle(), new Particle())).toEqual(padding);
        expect(sut.GetDistance(new Particle(), new RectangleParticle())).toEqual(padding);
    });

    it("two vertically stacked RectangleParticles are spaced by the padding plus height.", function () {

        var height1 = some.Integer();
        var height2 = some.Integer();
        var padding = some.Integer();

        var top = new RectangleParticle(some.Integer(), 0, 0.1).SetDimensions(some.Integer(), height1);
        var bottom = new RectangleParticle(some.Integer(), 0, 0).SetDimensions(some.Integer(), height2);

        var sut = new PreferredDistanceCalculator(padding);

        expect(sut.GetDistance(top, bottom)).toEqual((height1 / 2) + padding + (height2 / 2));
        expect(sut.GetDistance(bottom, top)).toEqual((height1 / 2) + padding + (height2 / 2));
    });

    it("two horizontally stacked RectangleParticles are spaced by the padding plus width.", function () {

        var width1 = some.Integer();
        var width2 = some.Integer();
        var padding = some.Integer();

        var left = new RectangleParticle(some.Integer(), 0.1, 0).SetDimensions(width1, some.Integer());
        var right = new RectangleParticle(some.Integer(), 0, 0).SetDimensions(width2, some.Integer());

        var sut = new PreferredDistanceCalculator(padding);

        expect(sut.GetDistance(left, right)).toEqual((width1 / 2) + padding + (width2 / 2));
        expect(sut.GetDistance(right, left)).toEqual((width1 / 2) + padding + (width2 / 2));
    });

    it("when two RectangleParticles are far enough apart horizontally, the spring is inert", function () {

        var width1 = some.Integer();
        var width2 = some.Integer();
        var padding = some.Integer();

        var farEnough = width1 / 2 + padding + width2 / 2;

        var actualDistance = some.Integer();

        var left = new RectangleParticle(some.Integer(), farEnough, 0).SetDimensions(width1, some.Integer());
        var right = new RectangleParticle(some.Integer(), 0, 0).SetDimensions(width2, some.Integer());

        var sut = new PreferredDistanceCalculator(padding);

        expect(sut.GetDistance(left, right, actualDistance)).toEqual(actualDistance);
        expect(sut.GetDistance(right, left, actualDistance)).toEqual(actualDistance);
    });

    it("when two RectangleParticles are far enough apart vertically, the spring is inert", function () {

        var height1 = some.Integer();
        var height2 = some.Integer();
        var padding = some.Integer();

        var farEnough = height1 / 2 + padding + height2 / 2;

        var actualDistance = some.Integer();

        var top = new RectangleParticle(some.Integer(), 0, farEnough).SetDimensions(some.Integer(), height1);
        var bottom = new RectangleParticle(some.Integer(), 0, 0).SetDimensions(some.Integer(), height2);

        var sut = new PreferredDistanceCalculator(padding);

        expect(sut.GetDistance(top, bottom, actualDistance)).toEqual(actualDistance);
        expect(sut.GetDistance(bottom, top, actualDistance)).toEqual(actualDistance);
    });
});