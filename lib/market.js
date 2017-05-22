"use strict";
const Pair = require('./pair.js');
var EventEmitter = require('events')
	.EventEmitter;
module.exports = market;
const _ = require('lodash');

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
	this.is_pair_exist = function(currency1, currency2) {
		if (currency1 instanceof Pair) {
			currency2 = currency1.currency1;
			currency1 = currency1.currency1;
		}
		return _.findIndex(this.pairs, {
			currency1: currency1,
			currency2: currency2
		}) > -1
	}
	this.add_pair = function(currency1, currency2) {
		let pair = null;
		if (currency1 instanceof Pair) {
			pair = currency1;
		} else if (_.isString(currency1) && _.isString(currency2)) {
			let pair_ = _.find(this.available_pairs, {
				currency1: currency1,
				currency2: currency2
			});
			pair = new Pair(pair_.currency1, pair_.currency2, pair_.currency1_decimal != undefined ? pair_.currency1_decimal : 8, pair_.currency8_decimal != undefined ? pair_.currency8_decimal : 8);
		}
		if (this.is_pair_exist(pair.currency1, pair.currency2)) {
			self.emit('error', 'Pair ' + pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + ' is already added');
			self.emit('pair_not_added', pair);
			return false;
		}
		this.pairs.push(pair);
		self.emit('pair_added', pair);
		return true;
	};
}
market.prototype.__proto__ = EventEmitter.prototype;
