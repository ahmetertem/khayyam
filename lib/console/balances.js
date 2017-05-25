var _ = require('lodash');
var chalk = require('chalk');
var inquirer = require('inquirer');
var tablify = require('tablify')
	.tablify;
module.exports = function(vorpal, app) {
	vorpal.command('balances', 'Prints currency balances of a market')
		.option('-0, --hidezero', 'Hides zero balances')
		.option('-m, --market <market_index>', 'Market Index')
		.action(function(args, callback) {
			let hidezero = args.options.hidezero !== undefined;
			if (args.options.market === undefined) {
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
						message: 'Select market',
						paginated: true,
						choices: markets
}])
					.then(function(answers) {
						ans(answers.market_index, hidezero);
						callback();
					});
			} else {
				let market_index = args.options.market;
				if (market_index > -1 && market_index < app.markets.markets.length) {
					ans(market_index, hidezero);
				} else {
					console.log(chalk.red('There is no market with index: ' + market_index));
					console.log(chalk.yellow('Please use `markets` to see index'));
				}
				callback();
			}
		});
	var ans = function(market_index, hidezero) {
		var data = [];
		var currencies = app.markets.markets[market_index].getMyPairCurrencies();
		_.each(currencies, function(currency) {
			if (!hidezero || (hidezero && app.markets.markets[market_index].balances_all[currency] > 0)) {
				data.push([currency.toUpperCase(), app.markets.markets[market_index].balances_in_pockets[currency], app.markets.markets[market_index].balances_on_orders[currency], app.markets.markets[market_index].balances_all[currency]]);
			}
		});
		if (data.length === 0) {
			console.log(chalk.red('None of your currency has balance!'));
			console.log(chalk.yellow('Maybe you didn\'t add pairs which you have balance?'));
		} else {
			data.unshift(["Pair", "Available", "On Orders", "Total"]);
			console.log(tablify(data, {
				has_header: true
			}));
		}
	}
};
