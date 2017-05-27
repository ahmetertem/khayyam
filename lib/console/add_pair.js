var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
var Pair = require('../pair.js')
module.exports = function (vorpal, app) {
  vorpal.command('add_pair', 'Initialize new pair')
    .action(function (args, callback) {
      if (app.markets.markets.length === 0) {
        console.log(chalk.red('You do not have added any market yet;'))
        console.log(chalk.blue('You may add new market via `add_market` command.'))
        callback()
        return false
      }
      var markets = []
      _.forEach(app.markets.markets, function (market, marketIndex) {
        markets.push({
          name: market.name,
          value: marketIndex
        })
      })
      inquirer.prompt([{
        type: 'list',
        name: 'marketIndex',
        message: 'Which market do you want to initialize?',
        paginated: true,
        choices: markets
      }])
        .then(function (answers) {
          var pairs = []
          _.forEach(app.markets.markets[answers.marketIndex].availablePairs, function (availablePair, availablePairIndex) {
            if (!app.markets.markets[answers.marketIndex].isPairExist(availablePair.currency1, availablePair.currency2)) {
              pairs.push({
                name: availablePair.currency2.toUpperCase() + '/' + availablePair.currency1.toUpperCase(),
                value: availablePairIndex
              })
            }
          })
          if (pairs.length === 0) {
            console.log(chalk.red('You add all pairs in the market.'))
            callback()
            return
          }
          inquirer.prompt([{
            type: 'list',
            name: 'pairIndex',
            message: 'Which pair do you want to add?',
            paginated: true,
            choices: pairs
          }])
            .then(function (answers2) {
              var pair = app.markets.markets[answers.marketIndex].availablePairs[answers2.pairIndex]
              app.markets.markets[answers.marketIndex].addPair(new Pair(pair.currency1, pair.currency2, pair.currency1Decimal !== undefined ? pair.currency1Decimal : 8, pair.currency8Decimal !== undefined ? pair.currency8Decimal : 8))
              callback()
            })
        })
    })
}
