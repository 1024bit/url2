url2
====

An implementing of Node.js Url, common for Browser and Node.js env.

## Install

    $ npm install url-browser

## Usage


```javascript
// Create query object from query str like '?query=string'
url2.unparam("a[b]=1&a[c]=2&d[]=3&d[]=4&d[2][c][e]=5");
// => {"a":{"b":"1","c":"2"},"d":["3","4",{"c":{"e":"5"}}]}

// In traditional mode
url2.traditional = true;
url2.unparam("a=1&a=2&a=3");
// => {"a":["1","2","3"]}

// Add new queries and merge existed queries
url2.addQuery('?a=1', {a:2,b:3});
// => ?a=2&b=3
			
// Use jQuery.param's source code, doc at http://api.jquery.com/jQuery.param/
var myObject = {
  a: {
    one: 1,
    two: 2,
    three: 3
  },
  b: [ 1, 2, 3 ]
};
url2.param(myObject);
// => a%5Bone%5D=1&a%5Btwo%5D=2&a%5Bthree%5D=3&b%5B%5D=1&b%5B%5D=2&b%5B%5D=3
decodeURIComponent(url2.param(myObject));
// => a[one]=1&a[two]=2&a[three]=3&b[]=1&b[]=2&b[]=3
```

Go [url](http://www.nodejs.org/api/url.html) for thoes:
url2.parse, url2.format, url2.normalize, url2.resolve

## License

[The MIT License](http://opensource.org/licenses/MIT)
