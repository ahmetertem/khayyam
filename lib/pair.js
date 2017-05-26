var EventEmitter = require('events')
	.EventEmitter;
/*
 *	- Available Events:
 *		- tick
 *		- timer_started
 *		- timer_stopped
 */
function pair(currency1, currency2, currency1_decimal = 8, currency2_decimal = 8) {
	EventEmitter.call(this);
	this.currency1 = currency1.toLowerCase();
	this.currency2 = currency2.toLowerCase();
	this.currency1_decimal = currency1_decimal === null ? 8 : currency1_decimal;
	this.currency2_decimal = currency2_decimal === null ? 8 : currency2_decimal;
	this.buy_fee = 0;
	this.sell_fee = 0;
	this.settings = {
		enabled: true,
		buy_enabled: false,
		sell_enabled: false,
		ticks: 15, // seconds
		depths_buy_minimum_amount: 0,
		depths_sell_minimum_amount: 0,
		profit_enabled: true,
		profit_timeout: 60, // minutes
		minimum_profit: 0,
		trust_buy_max_amount: 0,
		trust_sell_max_amount: 0,
		danger_zone_enabled: true,
		danger_zone_type: 0,
		danger_zone_percentage: 20,
		dont_buy_if_selling: false
	};
	this.depth_asks = [];
	this.depth_bids = [];
	this.public_trades = [];
	this.my_trades = [];
	this.my_orders = [];
	this.ticker = {
		high: 0,
		low: 0,
		average: 0
	};
	this.minimum_amount_to_buy = 1 / Math.pow(10, this.currency2_decimal);
	this._interval = null; // private
	this.startTimer = function() {
		var self = this;
		if (!self.settings.enabled) {
			return false;
		}
		self.emit('timer_started');
		self.stopTimer();
		self._interval = setTimeout(function() {
			self.emit('tick', self);
			self.startTimer();
		}, self.settings.ticks * 1000);
		return true;
	};
	this.stopTimer = function() {
		this.emit('timer_stopped');
		clearTimeout(this._interval);
	};
};
pair.prototype.__proto__ = EventEmitter.prototype;
module.exports = pair;
