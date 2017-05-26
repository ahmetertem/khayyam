var Market = require('../market.js');
var Order = require('../order.js');
var _ = require('lodash');
var crypto = require('crypto');
var request = require('request');
var http_build_query = require('locutus/php/url/http_build_query');
var EventEmitter = require('events')
	.EventEmitter;

function poloniex(api_key, api_secret) {
	EventEmitter.call(this);
	Market.call(this, api_key, api_secret);
	this.name = 'Poloniex';
	this._trading_url = 'https://poloniex.com/tradingApi';
	this._public_url = 'https://poloniex.com/public';
	this._initFees = function() {
		var self = this;
		var response = JSON.parse(self.query({
			command: 'returnFeeInfo'
		}));
		_.each(self.pairs, function(value, key) {
			self.pairs[key].buy_fee = response.makerFee * 100;
			self.pairs[key].sell_fee = response.makerFee * 100;
		});
	};
	this._getBalances = function() {
		var self = this;
		var response = JSON.parse(self.query({
			command: 'returnBalances'
		}));
		var currencies = self.getMyPairCurrencies();
		_.each(currencies, function(currency) {
			self.balances_in_pockets[currency.toLowerCase()] = response[currency.toUpperCase()];
		});
		self.calculateTotalBalances();
	};
	this._getOrders = function() {
		var self = this;
		var response = JSON.parse(self.query({
			command: 'returnOpenOrders',
			currencyPair: 'all' // set to pair for single pair for exp `BTC_XRP`
		}));
		_.each(self.pairs, function(value, key) {
			var pair_string = value.currency1.toUpperCase() + '_' + value.currency2.toUpperCase();
			var list = [];
			_.each(response[pair_string], function(order) {
				var new_order = new Order(order.orderNumber, order.rate, order.amount, order.type, new Date(order.date), value.currency2_decimal);
				list.push(new_order);
			});
			self.pairs[key].setMyOrders(list);
		});
	};
	this._getDepths = function(pair, args) {
		var self = this;
		args = _.merge({
			pair_index: null,
			currency1: null,
			currency2: null
		}, args);
		if (!_.isNull(pair)) {
			switch (typeof pair) {
				case 'object':
					args.currency1 = pair.currency1;
					args.currency2 = pair.currency2;
					break;
			}
		}
		var pair_string = args.currency1.toUpperCase() + '_' + args.currency2.toUpperCase();
		var response = JSON.parse(self.public({
			command: 'returnOrderBook',
			currencyPair: pair_string
		}));
		if (_.isNull(args.pair_index)) {
			args.pair_index = _.findIndex(self.pairs, {
				currency1: args.currency1.toLowerCase(),
				currency2: args.currency2.toLowerCase()
			});
		}
		// var currency1_decimal = self.pairs[args.pair_index].currency1_decimal;
		var currency2_decimal = self.pairs[args.pair_index].currency2_decimal;
		//
		// asks
		//
		var list = [];
		_.each(response.asks, function(depth) {
			list.push(new Order(null, depth[0], depth[1], null, null, currency2_decimal));
		});
		self.pairs[args.pair_index].setDepthAsks(list);
		//
		// bids
		//
		list = [];
		_.each(response.bids, function(depth) {
			list.push(new Order(null, depth[0], depth[1], null, null, currency2_decimal));
		});
		self.pairs[args.pair_index].setDepthBids(list);
	};
	this.make_order = function(pair, trade_type, rate, amount) {
		switch (typeof pair) {
			case 'object':
				pair = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase();
				break;
		}
		var response = JSON.parse(this.query({
			command: trade_type.toLowerCase() === 'buy' ? 'buy' : 'sell',
			currencyPair: pair,
			rate: rate,
			amount: amount
		}));
		console.log(response);
	};
	this.query = function(args) {
		//
		// set the nonce
		//
		args.nonce = this.getNonce();
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
	this.public = function(args) {
		var data = http_build_query(args, '', '&');
		var ret;
		request.post({
			url: this._public_url + "?" + data
		}, function(error, response, body) {
			ret = body;
		});
		while (ret === undefined) {
			require('deasync')
				.runLoopOnce();
		}
		return ret;
	};
}
poloniex.prototype.__proto__ = EventEmitter.prototype;
module.exports = poloniex;
