var _ = require('lodash');
var Pair = require('./pair.js');
var EventEmitter = require('events')
	.EventEmitter;
/*
 *	- Available Events:
 *		- before_initialize
 *		- after_initialize
 *		- before_init_fees
 *		- after_init_fees
 *		- before_get_balances
 *		- after_get_balances
 *		- before_get_orders
 *		- after_get_orders
 *		- pair_added
 *		- pair_not_added
 *		- pair_removed
 *		- pair_tick
 *		- error
 */
function market(api_key, api_secret) {
	var self = this;
	EventEmitter.call(this);
	this.api_key = api_key;
	this.api_secret = api_secret;
	this.available_pairs = [];
	this.pairs = [];
	this.balances_in_pockets = {};
	this.balances_on_orders = {};
	this.balances_all = {};
	this._nonce = Math.floor(Date.now() / 1000);
	this.initialize = function() {
		this.emit('before_initialize');
		this.initFees();
		this.getBalances();
		this.getOrders();
		this.emit('after_initialize');
	};
	this.initFees = function() {
		var self = this;
		self.emit('before_init_fees');
		self._initFees();
		self.emit('after_init_fees');
	};
	this.getBalances = function() {
		var self = this;
		self.emit('before_get_balances');
		self._getBalances();
		self.emit('after_get_balances');
	};
	this.getOrders = function() {
		var self = this;
		self.emit('before_get_orders');
		self._getOrders();
		self.calculateOrderBalances();
		self.calculateTotalBalances();
		self.emit('after_get_orders');
	};
	this.getNonce = function() {
		this._nonce++;
		return this._nonce;
	};
	this.isPairExist = function(currency1, currency2) {
		if (currency1 instanceof Pair) {
			currency2 = currency1.currency2;
			currency1 = currency1.currency1;
		}
		return _.findIndex(this.pairs, {
			currency1: currency1.toLowerCase(),
			currency2: currency2.toLowerCase()
		}) > -1
	};
	this.getMyPairCurrencies = function() {
		var pairs = [];
		var self = this;
		_.each(self.pairs, function(pair_) {
			pairs.push(pair_.currency1);
			pairs.push(pair_.currency2);
		});
		return _.uniq(pairs);
	};
	this.addPair = function(currency1, currency2, args) {
		args = _.merge({
			programmed: false
		}, args);
		var self = this;
		var pair = null;
		if (currency1 instanceof Pair) {
			pair = currency1;
		} else if (_.isString(currency1) && _.isString(currency2)) {
			var pair_ = _.find(self.available_pairs, {
				currency1: currency1.toUpperCase(),
				currency2: currency2.toUpperCase()
			});
			pair = new Pair(pair_.currency1, pair_.currency2, pair_.currency1_decimal !== undefined ? pair_.currency1_decimal : 8, pair_.currency2_decimal !== undefined ? pair_.currency2_decimal : 8);
		} else {
			self.emit('error', (typeof currency1) + ' -- ' + (typeof currency2));
		}
		if (this.isPairExist(pair.currency1, pair.currency2)) {
			self.emit('error', 'Pair ' + pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + ' is already added');
			self.emit('pair_not_added', pair);
			return false;
		}
		pair.on('tick', function(pair_) {
			self.pairTick(pair_);
			pair_.calculateDepthTills();
			self.emit('pair_tick', pair_);
		});
		pair.startTimer();
		self.pairs.push(pair);
		self.emit('pair_added', pair, args);
		if (!args.programmed) {
			self.initialize();
		}
		return true;
	};
	this.removePairAtIndex = function(index) {
		self.pairs[index].stopTimer();
		self.pairs.splice(index, 1);
		self.emit('pair_removed');
		self.initialize();
	};
	this.pairTick = function(pair) {
		var self = this;
		self._getDepths(null, {
			currency1: pair.currency1,
			currency2: pair.currency2
		});
	};
	this.calculateOrderBalances = function() {
		var self = this;
		var currencies = self.getMyPairCurrencies();
		_.each(currencies, function(currency) {
			self.balances_on_orders[currency.toLowerCase()] = 0;
		});
		_.each(self.pairs, function(pair) {
			var total = 0;
			_.each(pair.my_orders, function(order) {
				total += order.total;
			});
			self.balances_on_orders[pair.currency2.toLowerCase()] += total;
		});
	};
	this.calculateTotalBalances = function() {
		var self = this;
		var currencies = self.getMyPairCurrencies();
		_.each(currencies, function(currency) {
			self.balances_all[currency] = parseFloat(self.balances_in_pockets[currency]) + parseFloat(self.balances_on_orders[currency]);
		});
	};
}
market.prototype.__proto__ = EventEmitter.prototype;
module.exports = market;
