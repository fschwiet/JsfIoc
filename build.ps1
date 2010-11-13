
$src = @( gi "license.txt" );
$testutil = @( gi "license.txt" );
$tests = @();

switch -w (gci .\src *.js -rec) {
        "*.tests.js" { $tests = $tests + $_ }
        default { $src = $src + $_ }
        }

switch -w (gci .\testutil *.js -rec) {
        "*.tests.js" { $tests = $tests + $_ }
        default { $testutil = $testutil + $_ }
        }

,"Detected source files:" + $src + "" | write-host

,"Detected test utility code:" + $testutil + "" | write-host

,"Detected test files:" + $tests + "" | write-host


rm .\build -recurse
$null = mkdir .\build

$src | % { , ("// " + $_.name), @(get-content $_.fullname) } | set-content .\build\JsfIoc.js
$testutil | % { , ("// " + $_.name), @(get-content $_.fullname) } | set-content .\build\JsfIoc.testutil.js
