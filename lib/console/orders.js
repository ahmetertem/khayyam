var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
var tablify = require('tablify')
  .tablify
module.exports = function (vorpal, app) {
  vorpal.command('orders', 'Show active orders')
    .action(function (args, callback) {
      if (app.markets.markets.length === 0) {
        console.log(chalk.red('You do not have added any market yet;'))
        console.log(chalk.blue('You may add new market via `add_market` command.'))
        callback()
        return false
      }
      var markets = []
      _.forEach(app.markets.markets, function (value, key) {
        markets.push({
          name: value.name,
          value: key
        })
      })
      inquirer.prompt([{
        type: 'list',
        name: 'market_index',
        message: 'Select market to see active orders',
        paginated: true,
        choices: markets
      }])
        .then(function (answers) {
          var data = []
          _.forEach(app.markets.markets[answers.market_index].pairs, function (pair) {
            _.forEach(pair.myOrders, function (order) {
              order.pair = pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase()
              delete order.till
              data.push(order)
            })
          })
          console.log(tablify(data))
          callback()
        })
    })
}
