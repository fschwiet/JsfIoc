/// <reference path="build/JsfIoc.js" />
/// <reference path="build/JsfIoc.testutil.js" />


// not sure why, but including this helps the intellisense:
new JsfIoc().Register().withConstructor().asSingleton().withDependencies(new JsfIoc().Parameter().asSingleJQueryElement().withValidator().withDefault());


