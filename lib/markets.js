const _ = require('lodash');
const readline = require('readline');
const fs = require('fs');
const glob = require('glob');
const Pair = require('./pair.js');
module.exports = {
	markets: [],
	available_markets: [],
	markets_directory: './markets/',
	settings_file_path: null,
	init: function()
	{
		//
		// cwd option must be set because
		// glob's default cwd is process's
		// directory
		//
		let files = glob.sync(this.markets_directory + "*.js",
		{
			cwd: __dirname
		});
		files.forEach(file =>
		{
			let market = require(file);
			console.log('Market `' + market.prototype.constructor.name + '` loaded');
			this.available_markets.push(market);
		});
	},
	load: function()
	{
		let json = JSON.parse(fs.readFileSync(this.settings_file_path, 'utf-8'))
		var tp = this;
		_.forEach(json, function(value)
		{
			tp.add(value.name, value.api_key, value.api_secret);
		});
	},
	save: function()
	{
		var list = [];
		_.forEach(this.markets, function(value, key)
		{
			list.push(
			{
				name: value.name,
				api_key: value.api_key,
				api_secret: value.api_secret
			});
		});
		fs.writeFileSync(this.settings_file_path, JSON.stringify(list));
	},
	add: function(market_name, api_key, api_secret)
	{
		let market = _.find(this.available_markets, function(o)
		{
			let x = new o();
			return x.name.toLowerCase() == market_name.toLowerCase();
		});
		if (market == undefined)
		{
			console.log('Market is not found named with `' + market_name + '`');
			return;
		}
		let market_ = new market(api_key, api_secret);
		//
		// initialize pairs' JSON files
		//
		let files = glob.sync(this.markets_directory + market_name + "/*.json",
		{
			cwd: __dirname
		});
		files.forEach(file =>
		{
			let pair = require(file);
			if (_.isArray(pair))
			{
				_.forEach(pair, function(value)
				{
					market_.available_pairs.push(value);
				});
			}
			else
			{
				market_.available_pairs.push(pair);
			}
		});
		/*	market_.on('pair_added', function()
			{
				console.log('test')
				console.log(a)
			})*/
		this.markets.push(market_);
		this.save();
	}
}
