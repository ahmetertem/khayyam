const _ = require('lodash');

function order(id, rate, amount, trade_type, timestamp, currency2_decimal) {
	currency2_decimal = currency2_decimal === undefined ? 8 : currency2_decimal;
	trade_type = (_.isString(trade_type) && trade_type.toLowerCase() == 'buy') || (_.isInteger(trade_type) && trade_type == 1) ? 'buy' : 'sell';
	this.id = id;
	this.rate = rate;
	this.amount = amount;
	this.trade_type = trade_type;
	this.timestamp = timestamp;
	this.till = 0;
	this.total = _.round(this.rate * this.amount, currency2_decimal);
}
module.exports = order;
