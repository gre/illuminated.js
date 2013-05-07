**Illuminated.js is a 2D lights and shadows rendering engine for HTML5 applications and games.**

[Checkout the demo](http://gre.github.io/illuminated.js)

[Read the article](http://greweb.me/2012/05/illuminated-js-2d-lights-and-shadows-rendering-engine-for-html5-applications/)

**src/illuminated.js** should be the only file you need.

Get a Minified Version
----------------------

```bash
URL=https://raw.github.com/gre/illuminated.js/master/src/illuminated.js
OUTPUT=illuminated.min.js
curl -d compilation_level=SIMPLE_OPTIMIZATIONS -d output_format=text -d output_info=compiled_code -d code_url=$URL http://closure-compiler.appspot.com/compile > $OUTPUT
```

Projects using Illuminated.js
-----------------------------
* [A Villain Monster (Ludum Dare 25)](https://github.com/gre/ld25)
* &lt;your project here&gt;
