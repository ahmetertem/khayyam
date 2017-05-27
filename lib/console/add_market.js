var _ = require('lodash')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('add_market', 'Initialize new market instance')
    .action(function (args, callback) {
      var marketNames = []
      _.forEach(app.markets.availableMarkets, function (availableMarket) {
        marketNames.push(availableMarket.name)
      })
      inquirer.prompt([{
        type: 'list',
        name: 'marketName',
        message: 'Which market do you want to initialize?',
        paginated: true,
        choices: marketNames
      }, {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your API key'
      }, {
        type: 'input',
        name: 'apiSecret',
        message: 'Enter your API Secret'
      }])
        .then(function (answers) {
          app.markets.add(answers.marketName, answers.apiKey, answers.apiSecret)
          callback()
        })
    })
}
