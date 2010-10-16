

function RectangleParticle(mass, positionX, positionY) {
    this.init(mass, positionX, positionY);
}

RectangleParticle.prototype = new Particle();

RectangleParticle.prototype.SetDimensions = function (width, height) {

    this.width = width;
    this.height = height;
    return this;
};
