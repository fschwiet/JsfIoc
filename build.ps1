rm .\build\*

gci .\src\ *.js -rec | % { , ("// " + $_.name), @(get-content $_.fullname) } | set-content .\build\JsfIoc.js
gci .\spec\ *.js -rec | % { , ("// " + $_.name), @(get-content $_.fullname) } | set-content .\build\JsfIoc.tests.js
cp SpecRunner.html .\build\
cp lib .\build\ -rec
