# robotto
Robots.txt reader, parser and matcher.


## How to Use

```js
var robotto = require('robotto');
var rules = robotto.fetch('http://google.com/robots.txt');
var canCrawl = robotto.check('userAgent', 'http://google.com/exampleUrl');

if (canCrawl) {
  // Your crawling code here
}
```


# Docs

```js
// TODO
```
