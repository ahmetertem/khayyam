var _ = require('lodash')
const {table} = require('table')
module.exports = function (vorpal, app) {
  vorpal.command('markets', 'List all markets')
    .option('-a, --available', 'Available markets')
    .action(function (args, callback) {
      var list = []
      var isAvailables = args.options.available !== undefined
      if (isAvailables) {
        _.each(app.markets.availableMarkets, function (value, key) {
          list.push([
            key,
            value.name
          ])
        })
      } else {
        _.each(app.markets.markets, function (value, key) {
          list.push([
            key,
            value.name
          ])
        })
      }
      list.unshift(['Index', 'Name'])
      console.log(table(list))
      callback()
    })
}
