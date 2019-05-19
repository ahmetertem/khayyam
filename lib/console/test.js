var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('test', 'test')
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

        })
    })
}