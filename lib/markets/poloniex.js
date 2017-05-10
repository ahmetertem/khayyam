const market = require('../market.js');
const crypto = require('crypto');
const request = require('request');
const tablify = require('tablify')
	.tablify;
const http_build_query = require('locutus/php/url/http_build_query');
module.exports = poloniex;

function poloniex(api_key, api_secret)
{
	market.call(this, api_key, api_secret);
	this.name = 'Poloniex';
	this._trading_url = 'https://poloniex.com/tradingApi';
	this._public_url = 'https://poloniex.com/public';
	this.query = function(args, callback)
	{
		//
		// set the nonce
		//
		args.nonce = this.get_nonce();
		//
		// create sha512 hash
		//
		var hash = crypto.createHmac('sha512', this.api_secret);
		var post_data = http_build_query(args, '', '&');
		hash.update(post_data);
		var sign = hash.digest('hex');
		//
		// create request
		//
		request.post(
		{
			url: this._trading_url,
			headers:
			{
				'Key': this.api_key,
				'Sign': sign
			},
			form: args
		}, function(error, response, body)
		{
			callback(body);
		});
	};
}
if (false)
{
	var polo = new poloniex("5TDY23WE-QSBQ5IVW-Y9UU5LER-XACGFRUA", "03863a83e6ccc57426080cd142ea8dbb885634a851b0c8c4121c5fc3179cb918554d7e599e42d03c36830d97f215efbe85c3816a24122d57d4d1073c9000072d");
	polo.query(
	{
		command: 'returnBalances'
	}, function(response)
	{
		console.log(tablify(JSON.parse(response)));
	})
}
