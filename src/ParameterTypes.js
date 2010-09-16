
function JQueryElementParameter(name) {
    return {
        name: name,

        validator: function (value) {

            return (value instanceof jQuery) && 
                   (value.length == 1);
        }
    };
}