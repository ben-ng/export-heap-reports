# Export Heap Reports

Stupid easy heap report exports

```
get({

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

`reports` is a map from report names to a JS representation of the exported CSV for that report. This means that you'll get an array of objects for each report that looks like this:

```
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
