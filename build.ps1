rm .\build\* -recurse

$src = @();
$testutil = @();

switch -w (gci .\src *.js -rec) {
        "*.tests.js" { }
        default { $src = $src + $_ }
        }


switch -w (gci .\testutil *.js -rec) {
        "Some.js" { }
        "*.tests.js" { }
        default { $testutil = $testutil + $_ }
        }

"Built with source files:" | write-host
$src | write-host

"" | write-host
"Built with test utility code:" | write-host
$testutil | write-host

$src | % { , ("// " + $_.name), @(get-content $_.fullname) } | set-content .\build\JsfIoc.js
$testutil | % { , ("// " + $_.name), @(get-content $_.fullname) } | set-content .\build\JsfIoc.testutil.js

