#!/usr/bin/env node

const app = require('./lib/app.js');
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
const readline = require('readline');
// ora and cliSpinners are brothers!
const ora = require('ora');
const cliSpinners = require('cli-spinners');
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
}
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: '> '
});
rl.prompt();
rl.on('line', (line) => {
		line = line.trim();
		var args_ = line.split(' ');
		var args_c = args_.length;
		switch (args_[0]) {
			case 'quit':
			case 'exit':
				console.log('Have a great day!');
				process.exit(0);
				break;
			case 'init':
				if (args_c == 1 || (args_c == 2 && args_[1] == 'list')) {
					console.log('Available markets:');
					_.forEach(app.markets.available_markets, function(value, key) {
						console.log(key + ' : ' + value.name);
					});
				} else {
					if (args_c > 1) {
						args_[1] = _.parseInt(args_[1]);
						if (args_[1] > -1 && args_[1] < app.markets.available_markets.length) {
							if (args_c < 4) {
								console.error('Usage:');
								console.log('\tinit <market_index> <api_key> <api_secret>');
							} else {
								app.markets.add(app.markets.available_markets[args_[1]].name, args_[2], args_[3]);
							}
						} else {
							console.error('Index `' + args_[1] + '` is not found. Please enter value between 0 and ' + app.markets.available_markets.length);
						}
					}
				}
				break;
			case 'pair':
				show_usage = false;
				if (args_c > 1) {
					args_[1] = _.parseInt(args_[1]);
					if (args_[1] > -1 && args_[1] < app.markets.markets.length) {
						args_[3] = _.parseInt(args_[3]);
						switch (args_[2]) {
							case 'add':
								let pair_ = app.markets.markets[args_[1]].available_pairs[args_[3]];
								/*app.markets.markets[args_[1]].on('pair_added', function(pair)
								{
									console.log(pair);
								});*/
								app.markets.markets[args_[1]].add_pair(new Pair(pair_.currency1, pair_.currency2, pair_.currency1_decimal != undefined ? pair_.currency1_decimal : 8, pair_.currency8_decimal != undefined ? pair_.currency8_decimal : 8));
								break;
							case 'delete':
							case 'remove':
							case 'rm':
								break;
							default:
								show_usage = true;
						}
					} else {
						console.error('Index `' + args_[1] + '` is not found. Please enter value between 0 and ' + app.markets.available_markets.length);
					}
				} else {
					show_usage = true;
				}
				if (show_usage) {
					console.error('Usage:');
					console.log('\tpair <market_index> add <pair_index>');
					console.log('\tpair <market_index> delete <pair_index>');
					console.log('\tpair <market_index> remove <pair_index>');
					console.log('\tpair <market_index> rm <pair_index>');
				}
				break;
			case 'trade':
				show_usage = false;
				if (args_c > 1) {
					//console.log(cliSpinners.dots);
					const spinner = ora({
							spinner: cliSpinners.dots
						})
						.start();
					app.markets.markets[args_[1]].make_order(app.markets.markets[args_[1]].pairs[args_[2]], args_[3], args_[4], args_[5]);
					spinner.stop();
				} else {
					show_usage = true;
				}
				if (show_usage) {
					console.error('Usage:');
					console.log('\ttrade <market_index> <pair_index> buy <rate> <amount>');
					console.log('\ttrade <market_index> <pair_index> sell <rate> <amount>');
				}
		}
		rl.prompt();
	})
	.on('close', () => {
		console.log('Have a great day!');
		process.exit(0);
	});
