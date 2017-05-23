"use strict";

function pair(currency1, currency2, currency1_decimal = 8, currency2_decimal = 8) {
	this.currency1 = currency1.toLowerCase();
	this.currency2 = currency2.toLowerCase();
	this.currency1_decimal = currency1_decimal == null ? 8 : currency1_decimal;
	this.currency2_decimal = currency2_decimal == null ? 8 : currency2_decimal;
	this.buy_fee = 0;
	this.sell_fee = 0;
	this.settings = {};
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
}
module.exports = pair;
