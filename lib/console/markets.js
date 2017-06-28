var _ = require('lodash')
var tablify = require('tablify')
  .tablify
module.exports = function (vorpal, app) {
  vorpal.command('markets', 'List all markets')
    .option('-a, --available', 'Available markets')
    .action(function (args, callback) {
      var list = []
      var isAvailables = args.options.available !== undefined
      if (isAvailables) {
        _.each(app.markets.availableMarkets, function (value, key) {
          list.push({
            // index: key,
            name: value.name
          })
        })
      } else {
        _.each(app.markets.markets, function (value, key) {
          list.push({
            // index: key,
            name: value.name
          })
        })
      }
      console.log(tablify(list, {
        has_header: true
      }))
      callback()
    })
}
