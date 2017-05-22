"use strict";
const Pair = require('./pair.js');
var EventEmitter = require('events').EventEmitter;
module.exports = market;

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
	this.add_pair = function(pair, pair2) {
		if (pair instanceof Pair) {
			// skip to exit of if
		} else if (_.isString(pair) && _.isString(pair2)) {
			// TODO
		}
		this.pairs.push(pair);
		self.emit('pair_added', pair);
	};
}
market.prototype.__proto__ = EventEmitter.prototype;
