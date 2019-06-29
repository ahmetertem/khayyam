var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('test', 'test')
    .action(function (args, callback) {
        app.markets.markets[0].getPublicTrades()
    })
}
