

function Binding() {
    this.requires = [];
    this.parameters = [];
    this.singleton = false;
    this.eventSource = [];
    this.eventListener = [];
}

Binding.WhitespaceRegex = /^\s*$/;

Binding.prototype = {
    constructor: Binding,

    GetFriendlyName: function () {
        var result = this.service.toString();

        if (result.indexOf("(") > -1)
            result = result.slice(0, result.indexOf("("));
        if (result.indexOf("function ") == 0)
            result = result.slice("function ".length);

        if (Binding.WhitespaceRegex.test(result))
            return this.name;

        return result;
    }
}