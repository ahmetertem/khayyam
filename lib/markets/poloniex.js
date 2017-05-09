var crypto = require('crypto');
var request = require('request');
var tablify = require('tablify')
	.tablify
//var request = require('request');
var http_build_query = require('locutus/php/url/http_build_query');
var poloniex = {
	// must set
	api_key: null,
	api_secret: null,
	// privates (of course not prive)
	_trading_url: 'https://poloniex.com/tradingApi',
	_public_url: 'https://poloniex.com/public',
	// publics
	balances_in_pockets: [],
	balances_on_orders: [],
	balances_all: [],
	query: function(args, callback)
	{
		//
		// set the nonce
		//
		var nonce = Math.floor(Date.now() / 1000);
		args.nonce = nonce;
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
	}
};
poloniex.api_key = "5TDY23WE-QSBQ5IVW-Y9UU5LER-XACGFRUA";
poloniex.api_secret = "03863a83e6ccc57426080cd142ea8dbb885634a851b0c8c4121c5fc3179cb918554d7e599e42d03c36830d97f215efbe85c3816a24122d57d4d1073c9000072d";
if (false)
{
	poloniex.query(
	{
		command: 'returnBalances'
	}, function(response)
	{
		console.log(tablify(JSON.parse(response)));
	});
}
