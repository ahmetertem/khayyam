var _ = require('lodash');
var chalk = require('chalk');
var inquirer = require('inquirer');
var Pair = require('../pair.js');
module.exports = function (vorpal, app) {
  vorpal.command('add_pair', 'Initialize new pair')
    .action(function (args, callback) {
      if (app.markets.markets.length === 0) {
        console.log(chalk.red('You do not have added any market yet;'));
        console.log(chalk.blue('You may add new market via `add_market` command.'));
        callback();
        return false;
      }
      var markets = [];
      _.forEach(app.markets.markets, function (market, market_index) {
        markets.push({
          name: market.name,
          value: market_index
        });
      });
      inquirer.prompt([{
          type: 'list',
          name: 'market_index',
          message: 'Which market do you want to initialize?',
          paginated: true,
          choices: markets
	}])
        .then(function (answers) {
          var pairs = [];
          _.forEach(app.markets.markets[answers.market_index].available_pairs, function (available_pair, availablePairIndex) {
            if (!app.markets.markets[answers.market_index].isPairExist(available_pair.currency1, available_pair.currency2)) {
              pairs.push({
                name: available_pair.currency2.toUpperCase() + '/' + available_pair.currency1.toUpperCase(),
                value: availablePairIndex
              });
            }
          });
          if (pairs.length === 0) {
            console.log(chalk.red('You add all pairs in the market.'));
            callback();
            return;
          }
          inquirer.prompt([{
              type: 'list',
              name: 'pair_index',
              message: 'Which pair do you want to add?',
              paginated: true,
              choices: pairs
		}])
            .then(function (answers2) {
              var pair = app.markets.markets[answers.market_index].available_pairs[answers2.pair_index];
              app.markets.markets[answers.market_index].addPair(new Pair(pair.currency1, pair.currency2, pair.currency1Decimal !== undefined ? pair.currency1Decimal : 8, pair.currency8_decimal !== undefined ? pair.currency8_decimal : 8));
              callback();
            });
        });
    });
};
