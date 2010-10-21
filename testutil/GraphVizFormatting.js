

function GraphVizFormatting(ioc) {
    this._ioc = ioc;
}

GraphVizFormatting.prototype = {
    constructor: GraphVizFormatting,

    GetBinding: function (name) {

        var binding = this._ioc._bindings[name];

        if (binding == null)
            return name + ' [ shape="record"; label="' + name + ' | (instance)" ]';

        return name + ' [ shape="record"; label="' + name + '" ]';
    }
}