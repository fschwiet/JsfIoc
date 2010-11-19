
function GraphVizFormatting(ioc) {
    this._ioc = ioc;
}

GraphVizFormatting.prototype = {
    constructor: GraphVizFormatting,

    GetBinding: function (name) {

        var binding = this._ioc._bindings[name];

        if (binding == null)
            return name + ' [ shape="record", label=<' + name + ' <br/><font point-size=\"12\">(instance)</font>> ]';

        var bindingName = binding.GetFriendlyName();

        var eventListenerString = this._GetStringsAsSmallFont("green", binding._eventListener);

        var eventSourceString = this._GetStringsAsSmallFont("blue", binding._eventSource);

        var relationString = "";

        for (var i = 0; i < binding._requires.length; i++) {

            var targetName = binding._requires[i];

            if (this._ioc._bindings[targetName]) {
                targetName = this._ioc._bindings[targetName].GetFriendlyName();
            }

            relationString = relationString + "; " + bindingName + " -> " + targetName;
        }

        return bindingName + ' [ shape="record", label=<' + bindingName + eventListenerString + eventSourceString + '> ]' + relationString;
    },
    _GetStringsAsSmallFont: function (color, values) {

        if (values.length == 0)
            return "";

        values = values.slice();

        values.sort();

        var result = "<br/><font color=\"" + color + "\" point-size=\"8\">";

        var separator = "";
        var originalLineLength = result.length;

        for (var i = 0; i < values.length; i++) {
            result = result + separator + values[i]

            separator = " ";

            if (result.length - originalLineLength > 40) {
                result = result + "<br/>";
                originalLineLength = result.length;
            }
        }

        result += "</font>";

        return result;
    },

    AppendSampleCodetoDocument: function () {

        var vizString = 'digraph {\n    graph [rankdir = "LR"];\n';

        for (var singletonName in ioc._singletons) {
            if (!ioc._singletons.hasOwnProperty(singletonName))
                continue;

            vizString += "    " + this.GetBinding(singletonName) + "\n";
        }

        for (var bindingName in ioc._bindings) {

            if (!ioc._bindings.hasOwnProperty(bindingName))
                continue;

            vizString += "    " + this.GetBinding(bindingName) + "\n";
        }

        vizString += "}";

        $("body").append("<pre>" + HtmlEncode(vizString) + "</pre>");
    }
}