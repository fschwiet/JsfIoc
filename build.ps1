
$src = @( gi "license.txt" );
$testutil = @( gi "license.txt" );
$tests = @( gi "license.txt" );

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

function writeFilesTo($files, $target) {

    $files | % { , ("// " + $_.name), @(get-content $_.fullname) } | set-content $target
}

writeFilesTo $src .\build\JsfIoc.js
writeFilesTo $testutil .\build\JsfIoc.testutil.js
writeFilesTo $tests .\build\JsfIoc.tests.js

