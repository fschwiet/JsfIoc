

ExtendAsFluent = {};

ExtendAsFluent.PrototypeOf = function (obj) {

    var prototype = obj.prototype;

    if (prototype.isFluent)
        return;

    prototype.isFluent = true;
    
    for (var key in prototype) {

        if (!prototype.hasOwnProperty(key))
            continue;

        if (typeof (prototype[key]) == "function") {

            prototype[key] = (function (original) {
                return function () {
                    var rv = original.apply(this, arguments);

                    if (typeof (rv) === "undefined")
                        return this;
                    else
                        return rv;
                }
            })(prototype[key]);
        }
    }
};