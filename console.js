#!/usr/bin/env node

//
// constants
//
const markets_folder = './lib/markets/';
//
// libraries
//
const _ = require('lodash');
const market = require('./lib/market.js');
const pair = require('./lib/pair.js');
const readline = require('readline');
const glob = require('glob');
const fs = require('fs');
let files = fs.readdirSync(markets_folder);
let markets = [];
glob(markets_folder + "*.js", function(err, files)
{
    files.forEach(file =>
    {
        var market_ = require(file);
        console.log(market_.prototype._pairs);
        console.log(file + ' loaded');
        glob(file.replace('.js', '') + "/*.json", function(err_, pairs)
        {
            pairs.forEach(pair =>
            {
                var o = JSON.parse(fs.readFileSync(pair, 'utf8'));
                if (_.isArray(o))
                {
                    market_._pairs = _.concat(market_.pairs, o);
                }
                else
                {
                    market_._pairs.push(o);
                }
                console.log(pair + ' loaded');
            });
        });
        markets.push(market_);
    });
});
console.log(markets);
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
