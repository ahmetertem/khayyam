const market = require('../market.js');
const _ = require('lodash');
const crypto = require('crypto');
const request = require('request');
const http_build_query = require('locutus/php/url/http_build_query');
var EventEmitter = require('events')
	.EventEmitter;

function poloniex(api_key, api_secret) {
	EventEmitter.call(this);
	market.call(this, api_key, api_secret);
	this.name = 'Poloniex';
	this._trading_url = 'https://poloniex.com/tradingApi';
	this._public_url = 'https://poloniex.com/public';
	this._initFees = function() {
		var self = this;
		let response = JSON.parse(self.query({
			command: 'returnFeeInfo'
		}));
		_.each(self.pairs, function(value, key) {
			self.pairs[key].buy_fee = response.makerFee * 100;
			self.pairs[key].sell_fee = response.makerFee * 100;
		});
	};
	this._getBalances = function() {
		var self = this;
		let response = JSON.parse(self.query({
			command: 'returnBalances'
		}));
		let pairs = self.getMyPairCurrencies();
		_.each(pairs, function(value) {
			self.balances_in_pockets[value.toLowerCase()] = response[value.toUpperCase()];
		});
		self.calculateTotalBalances();
	};
	this.query = function(args) {
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
		var ret;
		request.post({
			url: this._trading_url,
			headers: {
				'Key': this.api_key,
				'Sign': sign
			},
			form: args
		}, function(error, response, body) {
			ret = body;
		});
		while (ret === undefined) {
			require('deasync')
				.runLoopOnce();
		}
		return ret;
	};
	this.make_order = function(pair, trade_type, rate, amount) {
		switch (typeof pair) {
			case 'object':
				pair = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase();
				break;
		}
		let response = JSON.parse(this.query({
			command: trade_type.toLowerCase() === 'buy' ? 'buy' : 'sell',
			currencyPair: pair,
			rate: rate,
			amount: amount
		}));
		console.log(response);
	};
}
poloniex.prototype.__proto__ = EventEmitter.prototype;
module.exports = poloniex;
