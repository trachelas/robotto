[![Build Status](https://travis-ci.org/trachelas/robotto.svg)](https://travis-ci.org/trachelas/robotto) [![Coverage Status](https://coveralls.io/repos/trachelas/robotto/badge.svg?branch=master&service=github)](https://coveralls.io/github/trachelas/robotto?branch=master) [![This is Awesome](https://img.shields.io/badge/awesomeness-100%25-ff69b4.svg)](http://www.catgifpage.com/)

# robotto
Easily read, parse and check permissions on robots.txt files!

## Installing

You can easily install robotto using npm. Just run:

```
npm install robotto
```


## Getting Started

After installing robotto you need to require it using:

```js
    var robotto = require('robotto');
```

Now you can call every single robotto's methods using your robotto variable!

To check if a website allows you to crawl a certain url you just gotta call the `canCrawl(userAgent, fullUrl, callback)` method. Take a look below for an example on how to do this:

```js
var robotto = require('robotto');

robotto.canCrawl('ExampleBot', 'https://www.npmjs.com/browse/keyword/robotto', function(isAllowed) {
  if (isAllowed) {
    // Your crawling code goes here...
  } else {
    console.log('I am not allowed to crawl this url.');
  }
});
```

Simple, isn't it?


## Docs

### Methods

#### robotto.getRobotsUrl(url)
Returns the full url to the website's robots.txt.

##### Parameters
* url -> Any url

##### Example

```js
var robotsUrl = robotto.getRobotsUrl('http://www.007.com/characters/the-bonds/');
console.log(robotsUrl);
// --> http://www.007.com/robots.txt
```


#### robotto.fetch(url, callback)
Gets the content of the robots.txt file.

##### Parameters
* url -> Any url
* callback(error, content)
    - error -> Errors, if any, otherwise `null`
    - content -> Content of the robots.txt file

##### Example

```js
robotto.fetch('https://nodejs.org/robots.txt', function(error, content) {
    if(error)
        console.log('There was an error.');
    else
        console.log('robots.txt content:\n' + content);
});
```


#### robotto.parse(text)
Parses the content of a robots.txt file and returns an object with it's rules.

This is an example of the rules object returned:

```js
{
    comments: ["This is a comment", "This is another comment"],
    userAgents: {
        Googlebot: {
            allow: ['/cats/', '/dogs/'],
            disallow: ['/sharks/', '/tigers/']
        },
        Msnbot: {
            allow: ['/technology'],
            disallow: ['/whatever/', '/example/']
        }
    }
}
```

##### Parameters
* text -> The content of a robots.txt file

##### Example

```js
robotto.fetch('https://nodejs.org/api/cluster.html', function(error, content) {
    if(!error)
        var rules = robotto.parse(content);
        // Rules will have an object containing the robots.txt rules for nodejs.org
});
```


#### robotto.check(userAgent, url, rulesObject);
Checks if an user-agent has permission to crawl an url based on an object with rules.

##### Parameters
* userAgent -> The user-agent's name
* url -> Any url
* rulesObject -> An object with rules

##### Example

```js
robotto.fetch('http://www.amazon.com/gp/', function(error, content) {
    if(!error) {
        var rules = robotto.parse(content);
        // Rules will have an object containing the robots.txt rules for amazon.com

        var permission = robotto.check('MyBotName', 'http://www.amazon.com/gp/goldbox/', rules);

        console.log('Permission to Crawl http://www.amazon.com/gp/goldbox/: ' + permission);
    }
});
```

#### robotto.canCrawl(userAgent, url, callback);
Checks if an user-agent has permission to crawl an url.

##### Parameters
* userAgent -> The name of your bot (your user-agent)
* url -> Any url
* callback(error, isAllowed)
    - error -> Errors, if any, otherwise `null`
    - isAllowed -> Boolean value indicating if this user-agent is allowed to crawl the url

##### Example

```js
robotto.canCrawl('https://twitter.com/zenorocha', function(error, isAllowed) {
    if(error)
        console.log('There was an error.');
    
    if(isAllowed)
        console.log('I can crawl this url!');
});
```


## Contributing

Feel free to contribute in any way you want. Every help is valid.
If you find any issues or even if you have a suggestion please feel free to report it using our [issue tracker](https://github.com/trachelas/robotto/issues).

This is the OpenSource Software's magic :sparkles:


## Credits

Robotto is proudly brought to you by the [Trachelas Team](https://github.com/trachelas).

| Name               | Github        | Twitter       |
| ------------------ | ------------- | ------------- |
| [**Lucas F. da Costa**](http://lucasfcosta.com) | [github.com/lucasfcosta](https://github.com/lucasfcosta) | [@lfernandescosta](https://twitter.com/lfernandescosta) |
| **Lucas Vieira** | [github.com/vieiralucas](https://github.com/vieiralucas) | |


## License

[MIT License](https://en.wikipedia.org/wiki/MIT_License)

No need for copyright, live free, buddy, internet is for everyone :wink:
