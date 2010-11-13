/// <reference path="build/JsfIoc.js" />
/// <reference path="build/JsfIoc.testutil.js" />


// not sure why, but this helps the intellisense:
new JsfIoc().Register().withConstructor().asSingleton().asSingleton();