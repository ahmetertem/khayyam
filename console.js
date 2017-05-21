#!/usr/bin/env node

const app = require('./lib/app.js');
app.prerequisite();
app.markets.on('add_available_market', function(a) {
	console.log('Market `' + a + '` added to available markets');
})
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
const Pair = require('./lib/pair.js');
const _ = require('lodash');
// ora and cliSpinners are brothers!
const ora = require('ora');
const cliSpinners = require('cli-spinners');
const vorpal = require('vorpal')();
const tablify = require('tablify').tablify;
const chalk = require('chalk');
const inquirer = require('inquirer');


vorpal.find('exit').remove();
vorpal.command('exit', 'Exits application.').alias('quit').action(function(args, callback) {
	process.exit(0);
});
vorpal.command('add_market', 'Initialize new market instance').action(function(args, callback) {
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
	}]).then(function(answers) {
		app.markets.add(answers.market_name, answers.api_key, answers.api_secret);
		callback();
	});
});
vorpal.command('add_pair', 'Initialize new pair').action(function(args, callback) {
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
	}]).then(function(answers) {
		var pairs = [];
		_.forEach(app.markets.markets[answers.market_index].available_pairs, function(value, key) {
			pairs.push({
				name: value.currency1.toUpperCase() + '/' + value.currency2.toUpperCase(),
				value: key
			});
		});

		inquirer.prompt([{
			type: 'list',
			name: 'pair_index',
			message: 'Which market do you want to initialize?',
			paginated: true,
			choices: pairs
		}]).then(function(answers2) {
			let pair = app.markets.markets[answers.market_index].available_pairs[answers2.pair_index];
			app.markets.markets[answers.market_index].add_pair(new Pair(pair.currency1, pair.currency2, pair.currency1_decimal != undefined ? pair.currency1_decimal : 8, pair.currency8_decimal != undefined ? pair.currency8_decimal : 8));
			callback();
		});
	});
});
vorpal.delimiter('$').show();
