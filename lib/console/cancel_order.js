var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('cancel_order', 'Cancel order which you selected')
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
          var orders = []
          _.forEach(app.markets.markets[answers.market_index].pairs, function (pair) {
            _.forEach(pair.myOrders, function (order) {
              orders.push({
                name: pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + ' - ' + order.rate + ' - ' + order.amount,
                value: order.id
              })
            })
          })
          if (orders.length === 0) {
            console.log(chalk.red('You do not have any active order'))
            callback()
          } else {
            inquirer.prompt([{
              type: 'list',
              name: 'order_no',
              message: 'Select an order',
              paginated: true,
              choices: orders
            }])
              .then(function (answers2) {
                app.markets.markets[answers.market_index].cancelOrder(answers2.order_no)
                console.log(chalk.green('Order canceled'))
                callback()
              })
          }
        })
    })
}
