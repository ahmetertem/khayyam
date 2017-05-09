#!/usr/bin/env node

'use strict';
const markets_folder = './lib/markets/';
const readline = require('readline');
const fs = require('fs');
var files = fs.readdirSync(markets_folder);
files.forEach(file =>
{
	require(markets_folder + file);
	console.log(markets_folder + file + ' loaded');
});
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
		switch (line.trim())
		{
			case 'hello':
				console.log('world!');
				break;
			case 'quit':
				console.log('Have a great day!');
				process.exit(0);
				break;
			default:
				console.log(`Say what? I might have heard '${line.trim()}'`);
				break;
		}
		rl.prompt();
	})
	.on('close', () =>
	{
		console.log('Have a great day!');
		process.exit(0);
	});
