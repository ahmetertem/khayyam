var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('remove_pair', 'Removes pair from a market')
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
        message: 'Which market do you want to remove pair from?',
        paginated: true,
        choices: markets
      }])
        .then(function (answers) {
          var pairs = []
          _.forEach(app.markets.markets[answers.market_index].pairs, function (value, key) {
            pairs.push({
              name: value.currency2.toUpperCase() + '/' + value.currency1.toUpperCase(),
              value: key
            })
          })
          if (pairs.length === 0) {
            console.log(chalk.red('You do not have any pair to remove in this market'))
            callback()
            return
          }
          inquirer.prompt([{
            type: 'list',
            name: 'pair_index',
            message: 'Which pair do you want to remove?',
            paginated: true,
            choices: pairs
          }])
            .then(function (answers2) {
              app.markets.markets[answers.market_index].removePairAtIndex(answers2.pair_index)
              callback()
            })
        })
    })
}
