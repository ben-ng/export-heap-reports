# Export Heap Reports

Stupid easy heap report exports

```js
var exportReports = require('export-heap-reports')

exportReports({
  username: 'jenny@website.com'
, password: 'jenny'

// Click the project dropdown's gear icon and use the
// number in parenthesis next to the env you care about
, environment: 123456789

// Report names are case sensitive
, reports: ['Conversions from any page']

}, function (err, reports) {

})
```

You can specify a range option for each report if you don't want to override the one defined in the report:

```js
var opts = {
  // other options omitted.. see above
  reports: [
    {
      name: 'Conversions from any page'
      // Only in the last 24 hours
    , range: {
        start: Date.now() - 24 * 60 * 60 * 1000
      , end: Date.now()
      }
    }
  ]
}
```

`reports` is a map from report names to a JS representation of the exported CSV for that report. This means that you'll get an array of objects for each report that looks like this:

```json
{
  "Conversions from any page": [
    {
      "series": "TOTAL",
      "blah blah": "100",
      "blah blah blah": "20"
    }
  ]
}
```

## License

The MIT License (MIT)

Copyright (c) 2015 Ben Ng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
