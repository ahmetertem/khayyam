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
const _ = require('lodash');
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY)
{
	process.stdin.setRawMode(true);
}
const rl = readline.createInterface(
{
	input: process.stdin,
	output: process.stdout,
	prompt: '> '
});
rl.prompt();
rl.on('line', (line) =>
	{
		line = line.trim();
		var args_ = line.split(' ');
		var args_c = args_.length;
		switch (args_[0])
		{
			case 'quit':
			case 'exit':
				console.log('Have a great day!');
				process.exit(0);
				break;
			case 'init':
				if (args_c == 1 || (args_c == 2 && args_[1] == 'list'))
				{
					console.log('Available markets:');
					for (key in app.markets.available_markets)
					{
						console.log(key + ' : ' + app.markets.available_markets[key].name);
					}
				}
				else
				{
					if (args_c > 1)
					{
						args_[1] = _.parseInt(args_[1]);
						if (args_[1] > -1 && args_[1] < app.markets.available_markets.length)
						{
							if (args_c < 4)
							{
								console.error('Usage:');
								console.log('\tinit <market_inde> <api_key> <api_secret>');
							}
							else
							{
								app.markets.add(app.markets.available_markets[args_[1]].name, args_[2], args_[3]);
							}
						}
						else
						{
							console.error('Index `' + args_[1] + '` is not found. Please enter value between 0 and ' + (app.markets.available_markets.length - 1));
						}
					}
				}
				break;
		}
		rl.prompt();
	})
	.on('close', () =>
	{
		console.log('Have a great day!');
		process.exit(0);
	});
