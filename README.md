# robotto
Robots.txt reader, parser and matcher.


## How to Use

```js
var robotto = require('robotto');

var rules = robotto.fetch('http://google.com/robots.txt', function(rules) {
  var canCrawl = robotto.check('userAgent', 'http://google.com/exampleUrl', rules);
  if (canCrawl) {
    // Your crawling code goes here...
  }
});
```


# Docs

```js
// TODO
```
