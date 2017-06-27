var lib = require('../lib.js')
var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
var tablify = require('tablify')
  .tablify
module.exports = function (vorpal, app) {
  var ans = function (marketIndex, hidezero) {
    var data = []
    var currencies = app.markets.markets[marketIndex].getMyPairCurrencies()
    _.each(currencies, function (currency) {
      if (!hidezero || (hidezero && app.markets.markets[marketIndex].balancesAll[currency] > 0)) {
        var n = []
        n.push(currency.toUpperCase())
        n.push(lib.toSatoshi(app.markets.markets[marketIndex].balancesInPockets[currency]))
        n.push(lib.toSatoshi(app.markets.markets[marketIndex].balancesOnOrders[currency]))
        n.push(lib.toSatoshi(app.markets.markets[marketIndex].balancesAll[currency]))
        data.push(n)
      }
    })
    if (data.length === 0) {
      console.log(chalk.red('None of your currency has balance!'))
      console.log(chalk.yellow('Maybe you didn\'t add pairs which you have balance?'))
    } else {
      data.unshift(['Pair', 'Available', 'On Orders', 'Total'])
      console.log(tablify(data, {
        has_header: true
      }))
    }
  }
  vorpal.command('balances', 'Prints currency balances of a market')
    .option('-0, --hidezero', 'Hides zero balances')
    .option('-m, --market <market_index>', 'Market Index')
    .action(function (args, callback) {
      var hidezero = args.options.hidezero !== undefined
      if (args.options.market === undefined) {
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
          name: 'marketIndex',
          message: 'Select market',
          paginated: true,
          choices: markets
        }])
          .then(function (answers) {
            ans(answers.marketIndex, hidezero)
            callback()
          })
      } else {
        var marketIndex = args.options.market
        if (marketIndex > -1 && marketIndex < app.markets.markets.length) {
          ans(marketIndex, hidezero)
        } else {
          console.log(chalk.red('There is no market with index: ' + marketIndex))
          console.log(chalk.yellow('Please use `markets` to see index'))
        }
        callback()
      }
    })
}
