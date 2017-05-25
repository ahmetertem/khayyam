var _ = require('lodash');
var chalk = require('chalk');
var inquirer = require('inquirer');
var Pair = require('../pair.js');
module.exports = function(vorpal, app) {
	vorpal.command('add_pair', 'Initialize new pair')
		.action(function(args, callback) {
			if (app.markets.markets.length === 0) {
				console.log(chalk.red('You do not have added any market yet;'));
				console.log(chalk.blue('You may add new market via `add_market` command.'));
				callback();
				return false;
			}
			var markets = [];
			_.forEach(app.markets.markets, function(value, key) {
				markets.push({
					name: value.name,
					value: key
				});
			});
			inquirer.prompt([{
					type: 'list',
					name: 'market_index',
					message: 'Which market do you want to initialize?',
					paginated: true,
					choices: markets
	}])
				.then(function(answers) {
					var pairs = [];
					_.forEach(app.markets.markets[answers.market_index].available_pairs, function(value, key) {
						if (!app.markets.markets[answers.market_index].isPairExist(value.currency1, value.currency2)) {
							pairs.push({
								name: value.currency2.toUpperCase() + '/' + value.currency1.toUpperCase(),
								value: key
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
						.then(function(answers2) {
							let pair = app.markets.markets[answers.market_index].available_pairs[answers2.pair_index];
							app.markets.markets[answers.market_index].addPair(new Pair(pair.currency1, pair.currency2, pair.currency1_decimal !== undefined ? pair.currency1_decimal : 8, pair.currency8_decimal !== undefined ? pair.currency8_decimal : 8));
							callback();
						});
				});
		});
};
