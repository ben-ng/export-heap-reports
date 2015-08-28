var request = require('request').defaults({jar: true})
  , async = require('async')
  , Joi = require('joi')
  , $ = require('cheerio')
  , _ = require('lodash')
  , csvparse = require('csv-parse')
  , optSchema

optSchema = Joi.object().keys({
  username: Joi.string().min(1).required()
, password: Joi.string().min(1).required()
, environment: Joi.number().required()
, reports: Joi.array().items(Joi.alternatives().try([
    Joi.string().min(1)
  , Joi.object().keys({
      range: Joi.object().keys({
          start: Joi.number()
        , end: Joi.number()
        , step: Joi.number()
        })
    , name: Joi.string().min(1)
    }).requiredKeys(['range', 'range.start', 'range.end', 'name'])
  ])).required()
})
.requiredKeys([
  'username'
, 'password'
, 'environment'
, 'reports'
])

module.exports = function downloadHeapReport (unvalidatedOpts, cb) {
  Joi.validate(unvalidatedOpts, optSchema, function (err, opts) {
    if (err) {
      cb(err)
    }
    else {
      async.waterfall([
        getCSRFToken.bind(this, opts)
      , login.bind(this, opts)
      , changeEnv.bind(this, opts)
      , getQueries.bind(this, opts)
      , runQueries.bind(this, opts)
      ], function (err, result) {
        if (err)
          return cb(err)

        cb(null, _(result).map(function (r) {
          return [r.name, r.result]
        }).zipObject().value())
      })
    }
  })
}

function getCSRFToken (opts, next) {
  request('https://heapanalytics.com/login', function (err, resp, body) {
    var csrf

    if (err)
      return next(err)
    else if (resp.statusCode !== 200) {
      console.error(body)
      return next(new Error('Expected 200, got ' + resp.statusCode))
    }

    try {
      csrf = $('input[name=_csrf]', body).val()

      if (csrf)
        next(null, csrf)
      else
        next(new Error('Could not extract csrf'))
    }
    catch (e) {
      next(e)
    }
  })
}

function login (opts, csrf, next) {
  request({
    uri: 'https://heapanalytics.com/login'
  , method: 'POST'
  , form: {
      email: opts.username
    , password: opts.password
    , _csrf: csrf
    }
  , followRedirect: false
  , followAllRedirects: false
  }, function (err, resp, body) {
    if (err)
      return next(err)
    else if (resp.statusCode !== 302) {
      console.error(body)
      return next(new Error('Expected 302, got ' + resp.statusCode + '... is your login information correct?'))
    }

    next(null, csrf)
  })
}

function changeEnv (opts, csrf, next) {
  request({
    uri: 'https://heapanalytics.com/changeenv'
  , method: 'POST'
  , headers: {
      'X-CSRF-Token': csrf
    , 'X-Requested-With': 'XMLHTTPRequest'
    }
  , form: {
      'envId': opts.environment
    }
  , followRedirect: false
  , followAllRedirects: false
  }, function (err, resp, body) {
    if (err)
      return next(err)
    else if (resp.statusCode !== 200) {
      console.error(body)
      return next(new Error('Expected 200, got ' + resp.statusCode))
    }

    next(null, csrf)
  })
}

function getQueries (opts, csrf, next) {
  request('https://heapanalytics.com/api/report', function (err, resp, body) {
    if (err)
      return next(err)
    else if (resp.statusCode !== 200) {
      console.error(body)
      return next(new Error('Expected 200, got ' + resp.statusCode))
    }

    try {
      body = JSON.parse(body)

      var reportNames = _(opts.reports).map(function (r) {
            return typeof r === 'string' ? r : r.name
          }).value()
        , reports = _(body)
          .filter(function (report) {
            return reportNames.indexOf(report.name) > -1
          })
          .map(function (report) {
            // Either use provided options, or use defaults in the query
            var reportOpts = _.find(opts.reports, function (r) {
              return typeof r === 'object'
            })

            if (!reportOpts) {
              reportOpts = {
                name: report.name
              , range: report.query.over || {}
              }
            }
            else {
              // Hahahahhahaha... sigh. who uses a negative start anyway?
              _.assign(reportOpts, {
                range: {
                  start: reportOpts.range.start - reportOpts.range.end
                , stop: reportOpts.range.end
                }
              })
            }

            query = _.merge({}, report.query, {
              main: {
                format: 'csv'
              }
            , over: reportOpts.range
            })

            // Thanks https://github.com/alexose/heapscrape for this hint
            // HACK: Override stop date because heap provides the wrong one

            return {
              name: report.name
            , query: query
            }
          })
          .value()

      if (reports.length !== opts.reports.length) {
        var envReports = _.pluck(body, 'name')

        throw new Error('Could not find these reports:\n' +
          _.difference(reportNames, envReports).join(', ') + '\n' +
          'In the environment\'s reports:\n' +
          envReports.join(', ') + '\n' +
          'Did you choose the right environment?')
      }

      next(null
      , csrf
      , reports
      )
    }
    catch (e) {
      next(e)
    }
  })
}

function runQueries (opts, csrf, reports, next) {
  async.map(reports, function (report, next) {
    request({
      uri: 'https://heapanalytics.com/api/csv'
    , headers: {
        'X-CSRF-Token': csrf
      , 'X-Requested-With': 'XMLHTTPRequest'
      }
    , method: 'POST'
    , form: {query: report.query}
    }, function (err, resp, body) {
      if (err)
        return next(err)
      else if (resp.statusCode !== 200) {
        console.error(body)
        return next(new Error('Expected 200, got ' + resp.statusCode))
      }

      try {
        csvparse(JSON.parse(body).csv, {
          relax: true
        , trim: true
        , columns: function (r) { return r }
        }, function (err, data) {
          next(null, {
            name: report.name
          , result: data
          })
        })
      }
      catch (e) {
        throw e
      }
    })
  } ,next)
}
