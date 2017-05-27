var Market = require('../market.js');
var Order = require('../order.js');
var _ = require('lodash');
var crypto = require('crypto');
var request = require('request');
var http_build_query = require('locutus/php/url/http_build_query');
var EventEmitter = require('events')
	.EventEmitter;

function Poloniex(api_key, api_secret) {
	EventEmitter.call(this);
	Market.call(this, api_key, api_secret);
	this.name = 'Poloniex';
	this._trading_url = 'https://poloniex.com/tradingApi';
	this._public_url = 'https://poloniex.com/public';
	this._initFees = function() {
		//
		// TODO: If queried before memorize it
		// and use it.
		//
		var self = this;
		var response = JSON.parse(self.query({
			command: 'returnFeeInfo'
		}));
		_.each(self.pairs, function(pair, pair_index) {
			self.pairs[pair_index].buy_fee = response.makerFee * 100;
			self.pairs[pair_index].sell_fee = response.makerFee * 100;
		});
	};
	this._getMyBalances = function() {
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
	this._getMyOrders = function(args) {
		var self = this;
		var pair_string = _.isNull(args.currency1) ? 'all' : (args.currency1.toUpperCase() + '_' + args.currency2.toUpperCase());
		var response = JSON.parse(self.query({
			command: 'returnOpenOrders',
			currencyPair: pair_string
		}));
		if (pair_string === 'all') {
			_.each(self.pairs, function(pair, pair_index) {
				var pair_string = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase();
				var list = [];
				_.each(response[pair_string], function(order) {
					var new_order = new Order(order.orderNumber, order.rate, order.amount, order.type, new Date(order.date), pair.currency2Decimal);
					list.push(new_order);
				});
				self.pairs[pair_index].setMyOrders(list);
			});
		} else {
			var list = [];
			_.each(response, function(order) {
				var new_order = new Order(order.orderNumber, order.rate, order.amount, order.type, new Date(order.date), args.currency2Decimal);
				list.push(new_order);
			});
			self.pairs[args.pair_index].setMyOrders(list);
		}
	};
	this._getDepths = function(args) {
		var self = this;
		var pair_string = _.isNull(args.currency1) ? 'all' : (args.currency1.toUpperCase() + '_' + args.currency2.toUpperCase());
		var response = JSON.parse(self.public({
			command: 'returnOrderBook',
			currencyPair: pair_string
		}));
		if (pair_string === 'all') {
			_.each(self.pairs, function(pair, pair_index) {
				var pair_string = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase();
				_.each(response[pair_string], function(order) {
					//
					// asks
					//
					var list = [];
					_.each(response.asks, function(depth) {
						list.push(new Order(null, depth[0], depth[1], null, null, pair.currency2Decimal));
					});
					self.pairs[pair_index].setDepthAsks(list);
					//
					// bids
					//
					list = [];
					_.each(response.bids, function(depth) {
						list.push(new Order(null, depth[0], depth[1], null, null, pair.currency2Decimal));
					});
					self.pairs[pair_index].setDepthBids(list);
				});
			});
		} else {
			//
			// asks
			//
			var list = [];
			_.each(response.asks, function(depth) {
				list.push(new Order(null, depth[0], depth[1], null, null, args.currency2Decimal));
			});
			self.pairs[args.pair_index].setDepthAsks(list);
			//
			// bids
			//
			list = [];
			_.each(response.bids, function(depth) {
				list.push(new Order(null, depth[0], depth[1], null, null, args.currency2Decimal));
			});
			self.pairs[args.pair_index].setDepthBids(list);
		}
	};
	this._getPublicTrades = function(args) {
		var self = this;
		var pair_string = _.isNull(args.currency1) ? 'all' : (args.currency1.toUpperCase() + '_' + args.currency2.toUpperCase());
		var response = JSON.parse(self.public({
			command: 'returnTradeHistory',
			currencyPair: pair_string
		}));
		if (pair_string === 'all') {
			self.emit('error', self.name + ' is not have _getPublicTrades pair `all`!');
			return false;
		} else {
			var list = [];
			_.each(response, function(trade) {
				var new_order = new Order(null, trade.rate, trade.amount, trade.type, new Date(trade.date), args.currency2Decimal);
				list.push(new_order);
			});
			self.pairs[args.pair_index].setPublicTrades(list);
		}
	};
	this._getMyTrades = function(args) {
		var self = this;
		var pair_string = _.isNull(args.currency1) ? 'all' : (args.currency1.toUpperCase() + '_' + args.currency2.toUpperCase());
		var response = JSON.parse(self.query({
			command: 'returnTradeHistory',
			currencyPair: pair_string
		}));
		if (pair_string === 'all') {
			_.each(self.pairs, function(pair, pair_index) {
				pair_string = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase();
				var list = [];
				_.each(response[pair_string], function(trade) {
					var new_order = new Order(trade.globalTradeID, trade.rate, trade.amount, trade.type, new Date(trade.date), pair.currency2Decimal);
					list.push(new_order);
				});
				self.pairs[pair_index].setMyTrades(list);
			});
		} else {
			var list = [];
			_.each(response, function(trade) {
				var new_order = new Order(trade.globalTradeID, trade.rate, trade.amount, trade.type, new Date(trade.date), args.currency2Decimal);
				list.push(new_order);
			});
			self.pairs[args.pair_index].setMyTrades(list);
		}
	};
	this._makeOrder = function(pair, trade_type, rate, amount) {
		var self = this;
		switch (typeof pair) {
			case 'object':
				pair = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase();
				break;
		}
		var response = JSON.parse(self.query({
			command: trade_type.toLowerCase() === 'buy' ? 'buy' : 'sell',
			currencyPair: pair,
			rate: rate,
			amount: amount
		}));
		console.log(response);
	};
	this._cancelOrder = function(pair, order) {};
	this.query = function(args) {
		var self = this;
		//
		// set the nonce
		//
		args.nonce = self.getNonce();
		//
		// create sha512 hash
		//
		var hash = crypto.createHmac('sha512', self.api_secret);
		var post_data = http_build_query(args, '', '&');
		hash.update(post_data);
		var sign = hash.digest('hex');
		//
		// create request
		//
		var ret;
		request.post({
			url: self._trading_url,
			headers: {
				'Key': self.api_key,
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
		var self = this;
		var data = http_build_query(args, '', '&');
		var ret;
		request.post({
			url: self._public_url + "?" + data
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
Poloniex.prototype.__proto__ = EventEmitter.prototype;
module.exports = Poloniex;
