#% // Note: is inlined

param($sourceFile)

$source = get-content $sourceFile

$lastHeading = "no heading detected"

$visitor = @{};

$visitor.visitDefault = {
    param($line)
}

$l = @{};
"visitTitle", "visitHeading" | % {
    $l[$_] = {
        param($line)
        $l.visitDefault.Invoke($line)
    }
}

$visitor.visitTitle = {
    param($line)
    
    $visitor.visitDefault.Invoke($line);
}

$visitor.visitHeading = {
    param($line)
    $visitor.visitDefault.Invoke($line);
}

$visitor.visitStartScript = {
    param($line)
    $visitor.visitDefault.Invoke($line);
}

$visitor.visitEndScript = {
    param($line)
    $visitor.visitDefault.Invoke($line);
}



$markdownVisitor = $visitor.Clone();

$markdownVisitor.visitDefault = {
    param($line)
}

$markdownVisitor.visitTitle = {
    param($line, $value)
    
    "describe(""$value"", function("
}

$markdownVisitor.visitHeading = {
    
    param($line, $value)
    
    $lastHeading = $value;
}

$markdownVisitor.visitStartScript = {
    param($line, $value)
    
    write-error $inlineVisitor
    $visitor = $inlineVisitor;
}


$inlineVisitor = $visitor.Clone();

$inlineVisitor.visitDefault = {
    param($line)
    
    $line
}

$inlineVisitor.visitEndScript = {
    $visitor = $markdownVisitor;
}

$visitor = $markdownVisitor;

switch -r ($source) {
    "^\s*title:\s*(.*)\s*$" { $visitor.visitTitle.Invoke($matches[0], $matches[1]); }
    "^#+(.*)$" { $visitor.visitHeading.Invoke($matches[0], $matches[1]); }
    "\s*{% highlight javascript %}\s*" { $visitor.visitStartScript.Invoke($matches[0]) };
    "\s*{% endhighlight %}\s*" { $visitor.visitEndScript.Invoke($matches[0]) };
    default { $visitor.visitDefault.Invoke($_); } 
}
