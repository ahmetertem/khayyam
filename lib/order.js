var _ = require('lodash')

function order (id, rate, amount, tradeType, timestamp, currency2Decimal) {
  currency2Decimal = currency2Decimal === undefined ? 8 : currency2Decimal
  if (!_.isNull(id)) {
    this.id = id
  }
  this.rate = rate
  this.amount = amount
  if (!_.isNull(tradeType)) {
    tradeType = (_.isString(tradeType) && tradeType.toLowerCase() === 'buy') || (_.isInteger(tradeType) && tradeType === 1) ? 'buy' : 'sell'
    this.tradeType = tradeType
  }
  if (!_.isNull(timestamp)) {
    this.timestamp = timestamp
  }
  this.total = _.round(this.rate * this.amount, currency2Decimal)
  this.till = 0
}
module.exports = order
