var lib = require('../lib.js')
var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('make_order', 'Create new buy/sell order')
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
        name: 'value',
        message: 'Select market which will give order',
        paginated: true,
        choices: markets
      }])
        .then(function (marketIndex) {
          var pairs = []
          _.forEach(app.markets.markets[marketIndex.value].pairs, function (pair, pairIndex) {
            pairs.push({
              name: pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase(),
              value: pairIndex
            })
          })
          if (pairs.length === 0) {
            console.log(chalk.red('You do not have any active pair which added'))
            callback()
          } else {
            inquirer.prompt([{
              type: 'list',
              name: 'pair_index',
              message: 'Select a pair',
              paginated: true,
              choices: pairs
            }, {
              type: 'list',
              name: 'trade_type',
              message: 'Select an action',
              paginated: false,
              choices: [{
                name: 'Buy',
                value: 1
              }, {
                name: 'Sell',
                value: 0
              }]
            }, {
              type: 'input',
              name: 'rate',
              message: 'Enter rate'
            }, {
              type: 'input',
              name: 'amount',
              message: 'Enter amount (blank or zero for all available)'
            }])
              .then(function (answers) {
                var amount = _.trim(answers.amount)
                if (amount === '') {
                  if (answers.trade_type === 1) {
                    amount = app.markets.markets[marketIndex.value].balancesInPockets[app.markets.markets[marketIndex.value].pairs[answers.pair_index].currency1.toLowerCase()]
                    amount = lib.calcBuyable(answers.rate, amount, app.markets.markets[marketIndex.value].pairs[answers.pair_index].currency1Decimal)
                  } else {
                    amount = app.markets.markets[marketIndex.value].balancesInPockets[app.markets.markets[marketIndex.value].pairs[answers.pair_index].currency2.toLowerCase()]
                  }
                }
                if (app.markets.markets[marketIndex.value].makeOrder(app.markets.markets[marketIndex.value].pairs[answers.pair_index], answers.trade_type, answers.rate, amount)) {
                  console.log(chalk.green('New order entered'))
                } else {
                  console.log(chalk.red('Error occured while giving order'))
                }
                callback()
              })
          }
        })
    })
}
