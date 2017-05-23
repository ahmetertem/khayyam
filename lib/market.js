"use strict";
const _ = require('lodash');
const Pair = require('./pair.js');
var EventEmitter = require('events')
	.EventEmitter;
/*
 *	- Available Events:
 *		- pair_added
 *		- pair_not_added
 *		- error
 */
function market(api_key, api_secret) {
	var self = this;
	EventEmitter.call(this);
	this.api_key = api_key;
	this.api_secret = api_secret;
	this.available_pairs = [];
	this.pairs = [];
	this.balances_in_pockets = [];
	this.balances_on_orders = [];
	this.balances_all = [];
	this._nonce = Math.floor(Date.now() / 1000);
	this.get_nonce = function() {
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
	this.addPair = function(currency1, currency2, args) {
		args = _.merge({
			programmed: false
		}, args);
		let pair = null;
		if (currency1 instanceof Pair) {
			pair = currency1;
		} else if (_.isString(currency1) && _.isString(currency2)) {
			let pair_ = _.find(self.available_pairs, {
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
		self.pairs.push(pair);
		self.emit('pair_added', pair, args);
		return true;
	};
	this.removePairAtIndex = function(index) {
		// self.pairs = _.remove(self.pairs, index);
		self.pairs.splice(index, 1);
		self.emit('pair_removed');
	};
}
market.prototype.__proto__ = EventEmitter.prototype;
module.exports = market;
