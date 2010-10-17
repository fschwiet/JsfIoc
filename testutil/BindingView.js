

function BindingView(ioc) {
    this._ioc = ioc;
}

BindingView.prototype = {
    constructor: BindingView,

    Draw: function (name) {

        var friendlyName = name;

        var binding = this._ioc._bindings[name];

        if (binding) {
            friendlyName = this._ioc._bindings[name].GetFriendlyName();
        }

        if (friendlyName[0] == "_")
            friendlyName = friendlyName[1].toUpperCase() + friendlyName.slice(2);

        var result = $("<div><div></div></div>").css("position", "absolute");
        var inner = result.children("div").css("position", "relative").addClass("binding");

        inner.append($("<div></div>").text(friendlyName));

        if (binding) {
            for (var i = 0; i < binding.eventListener.length; i++) {
                var event = binding.eventListener[i];

                inner.append($("<span></span>").addClass("eventListener").text("> " + event));
            }

            for (var i = 0; i < binding.eventSource.length; i++) {
                var event = binding.eventSource[i];

                inner.append($("<span></span>").addClass("eventSource").text(event + " >"));
            }
        }

        $("body").append(result);

        var originalWidth = inner.width();
        var originalHeight = inner.height();

        if (originalWidth > 200) {
            originalWidth = 200;
            inner.width(200);
        }

        result.height(1).width(1);

        inner.css("left", -originalWidth / 2);
        inner.css("top", -originalHeight / 2);
        inner.width(originalWidth);
        inner.height(originalHeight);

        return result;
    }
}



