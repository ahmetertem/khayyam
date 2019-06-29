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
            var marketName = _.trim(answers.marketName)
            var Market = _.find(app.markets.availableMarkets, function (O) {
              var x = new O()
              return x.name.toLowerCase() === marketName.toLowerCase()
            })
            Market = new Market
            var nParams = []
            _.forEach(Market.requiredExtraParams, function (a) {
                nParams.push({
                    type: 'input',
                    name: a,
                    message: a
                })
            });
            if(nParams.length == 0) {
                app.markets.add(answers.marketName, answers.apiKey, answers.apiSecret)
                callback()
            } else {
                 inquirer.prompt(nParams)
                   .then(function (answers2) {
                       app.markets.add(answers.marketName, answers.apiKey, answers.apiSecret, answers2)
                       callback()
                   });
            }
            // console.log(Market);
            // console.log();

        })
    })
}
