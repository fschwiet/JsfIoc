

function HtmlEncode(s) {
    s = String(s === null ? "" : s);
    return s.replace(/&(?!\w+;)|["<>\\]/g, function(s) {
        switch(s) {
            case "&": return "&amp;";
            case "\\": return "\\\\";
            case '"': return '\"';
            case "<": return "&lt;";
            case ">": return "&gt;";
            default: return s;
        }
    });
}