

var counter = 1;

Some = {
    Integer: function () { return counter++; },
    Number: function () { return some.Integer() + Math.random(); },
    String: function (substring) {
        var substring = substring || "someString"; 
        return substring + some.Integer();
    },
    Object: function () { return {}; },
    NonemptyArray: function () { return [some.String()]; },
    Boolean: function () { return (some.Integer() % 1) == 0 ? true : false; },
    DomElement: function (tag) {
        tag = tag || "div";
        return $("<" + tag + ">" + some.String() + "</" + tag + ">");
    },
    RawDomElement: function () {
        return $("<div>" + some.String() + "</div>")[0];
    },
    Function: function () { return function () { }; },
    ArrayOf: function (size) {

        var arrayBuilder = {};

        for (member in some) {

            if (!this.hasOwnProperty(member))
                continue;

            var that = this;

            arrayBuilder[member] = (function (originalMember) {
                return function () {

                    var arrayResult = [];

                    for (var i = 0; i < size; i++) {
                        arrayResult.push(originalMember.apply(that, arguments));
                    }

                    return arrayResult;
                }
            })(that[member]);
        }

        return arrayBuilder;
    }
};

Unique = Some;
some = Some;