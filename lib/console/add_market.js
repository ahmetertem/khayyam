var _ = require('lodash')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('add_market', 'Initialize new market instance')
    .action(function (args, callback) {
      var market_names = []
      _.forEach(app.markets.availableMarkets, function (available_market) {
        market_names.push(available_market.name)
      })
      inquirer.prompt([{
          type: 'list',
          name: 'market_name',
          message: 'Which market do you want to initialize?',
          paginated: true,
          choices: market_names
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
          app.markets.add(answers.market_name, answers.apiKey, answers.apiSecret)
          callback()
        })
    })
}
