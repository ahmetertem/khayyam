#!/usr/bin/env node

"use strict";
const Pair = require('./lib/pair.js');
const _ = require('lodash');
// ora and cliSpinners are brothers!
// const ora = require('ora');
// const cliSpinners = require('cli-spinners');
const vorpal = require('vorpal')();
// const tablify = require('tablify').tablify;
const chalk = require('chalk');
const inquirer = require('inquirer');
const app = require('./lib/app.js');
app.prerequisite();
app.markets.on('add_available_market', function(a) {
	console.log(chalk.blue('Market `' + a + '` added to available markets'));
});
app.markets.on('market_removed', function() {
	console.log(chalk.green('Market removed'));
});
app.markets.on('saved', function() {
	console.log(chalk.blue('Markets saved'));
});
app.markets.on('error', function(message) {
	console.log(chalk.red(message));
});
app.markets.on('market_pair_added', function(market, pair) {
	console.log(chalk.green('Pair `' + pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + '` added to ' + market.name));
});
app.markets.on('market_pair_removed', function(market) {
	console.log(chalk.green('Pair is removed from ' + market.name));
});
app.init();
//
// C
// O
// N
// S
// O
// L
// E
//
vorpal.find('exit')
	.remove();
vorpal.command('exit', 'Exits application.')
	.alias('quit')
	.action(function() {
		process.exit(0);
	});
vorpal.command('add_market', 'Initialize new market instance')
	.action(function(args, callback) {
		var market_names = [];
		_.forEach(app.markets.available_markets, function(value, key) {
			market_names.push(value.name);
		});
		inquirer.prompt([{
				type: 'list',
				name: 'market_name',
				message: 'Which market do you want to initialize?',
				paginated: true,
				choices: market_names
	}, {
				type: 'input',
				name: 'api_key',
				message: 'Enter your API key'
	}, {
				type: 'input',
				name: 'api_secret',
				message: 'Enter your API Secret'
	}])
			.then(function(answers) {
				app.markets.add(answers.market_name, answers.api_key, answers.api_secret);
				callback();
			});
	});
vorpal.command('remove_market', 'Removes a market')
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
				message: 'Which market do you want to remove?',
				paginated: true,
				choices: markets
	}])
			.then(function(answers) {
				app.markets.removeAtIndex(answers.market_index);
				callback();
			});
	});
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
vorpal.command('remove_pair', 'Removes pair from a market')
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
				message: 'Which market do you want to remove pair from?',
				paginated: true,
				choices: markets
		}])
			.then(function(answers) {
				var pairs = [];
				_.forEach(app.markets.markets[answers.market_index].pairs, function(value, key) {
					pairs.push({
						name: value.currency2.toUpperCase() + '/' + value.currency1.toUpperCase(),
						value: key
					});
				});
				if (pairs.length === 0) {
					console.log(chalk.red('You do not have any pair to remove in this market'));
					callback();
					return;
				}
				inquirer.prompt([{
						type: 'list',
						name: 'pair_index',
						message: 'Which pair do you want to remove?',
						paginated: true,
						choices: pairs
		}])
					.then(function(answers2) {
						app.markets.markets[answers.market_index].removePairAtIndex(answers2.pair_index);
						callback();
					});
			});
	});
vorpal.history('bitcoinbot')
	.delimiter('$')
	.show();
