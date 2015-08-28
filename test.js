var test = require('tape')
  , get = require('./')

test('works for me', function (t) {
  get({
    username: process.env.HEAP_USERNAME
  , password: process.env.HEAP_PASSWORD
  , environment: process.env.HEAP_ENVIRONMENT
  , reports: [{
    name: 'Conversions from any page'
  , range: {
      start: Date.now() - 7 * 24 * 60 * 60 * 1000
    , end: Date.now()
    }
  }]
  }, function (err, reports) {
    t.ifError(err, 'should not error')
    t.ok(reports, 'should respond with reports')

    // console.error(JSON.stringify(reports, null, 2))

    t.end()
  })
})
