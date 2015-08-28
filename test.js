var test = require('tape')
  , get = require('./')

test(function (t) {
  get({
    username: process.env.HEAP_USERNAME
  , password: process.env.HEAP_PASSWORD
  , environment: process.env.HEAP_ENVIRONMENT
  , reports: ['Conversions from any page']
  }, function (err, reports) {
    t.ifError(err, 'should not error')
    t.ok(reports, 'should respond with reports')

    // console.error(JSON.stringify(reports, null, 2))

    t.end()
  })
})
