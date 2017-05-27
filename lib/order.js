var _ = require('lodash');

function order(id, rate, amount, trade_type, timestamp, currency2Decimal) {
  currency2Decimal = currency2Decimal === undefined ? 8 : currency2Decimal;
  if (!_.isNull(id)) {
    this.id = id;
  }
  this.rate = rate;
  this.amount = amount;
  if (!_.isNull(trade_type)) {
    trade_type = (_.isString(trade_type) && trade_type.toLowerCase() == 'buy') || (_.isInteger(trade_type) && trade_type == 1) ? 'buy' : 'sell';
    this.trade_type = trade_type;
  }
  if (!_.isNull(timestamp)) {
    this.timestamp = timestamp;
  }
  this.total = _.round(this.rate * this.amount, currency2Decimal);
  this.till = 0;
}
module.exports = order;
