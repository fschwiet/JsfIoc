

function PreferredDistanceCalculator(padding) {
    this.padding = padding;
}

PreferredDistanceCalculator.prototype = {
    constructor: PreferredDistanceCalculator,

    GetDistance: function (a, b) {

        if (!(a instanceof RectangleParticle) || !(b instanceof RectangleParticle))
            return this.padding;

        var xd = a.positionX - b.positionX;
        var yd = a.positionY - b.positionY;

        var verticalSpacing = a.height / 2 + this.padding + b.height / 2;
        var horizontalSpacing = a.width / 2 + this.padding + b.width / 2;

        if (xd != 0) {
            var angle = Math.atan(yd / xd);
            var verticalFactor = Math.abs(verticalSpacing * Math.sin(angle));
            var horizontalFactor = Math.abs(horizontalSpacing * Math.cos(angle));

            return verticalFactor + horizontalFactor;
        } else {

            return verticalSpacing;
        }
    }
}