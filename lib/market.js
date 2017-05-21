"use strict";
var EventEmitter = require('events')
	.EventEmitter;
module.exports = market;

function market(api_key, api_secret) {
	EventEmitter.call(this);
	this.api_key = api_key;
	this.api_secret = api_secret;
	// private pairs for reading json (not implemented yet)
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
		if (pair2 == undefined) {
			this.pairs.push(pair);
			console.log(this);
			this.emit('pair_added');
		} else {
			console.log('2 argument on add_pair function is not ready yet.');
			console.log('Please use add_pair(Pair pair) for now');
		}
	};
}

market.prototype.__proto__ = EventEmitter.prototype;
// util.inherits(market, EventEmitter);
