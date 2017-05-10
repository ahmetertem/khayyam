const _ = require('lodash');
const readline = require('readline');
const fs = require('fs');
module.exports = {
	markets: [],
	available_markets: [],
	settings_file_path: null,
	load: function()
	{
		var json = JSON.parse(fs.readFileSync(this.settings_file_path, 'utf-8'))
		// console.log(json);
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
		var market = _.find(this.available_markets, function(o)
		{
			var x = new o();
			return x.name.toLowerCase() == market_name.toLowerCase();
		});
		if (market == undefined)
		{
			console.log('Market is not found named with `' + market_name + '`');
			return;
		}
		this.markets.push(new market(api_key, api_secret));
		this.save();
	}
}
