var _ = require('lodash')
var EventEmitter = require('events')
  .EventEmitter
/**
 * - Available Events:
 *   - tick
 *   - timer_started
 *   - timer_stopped
 *   - depths_tills_calculated
 *   - depth_asks_set
 *   - depth_bids_set
 *   - my_orders_set
 *   - public_trades_set
 *   - my_trades_set
 */
function pair (currency1, currency2, currency1Decimal, currency2Decimal) {
  EventEmitter.call(this)
  this.currency1 = currency1.toLowerCase()
  this.currency2 = currency2.toLowerCase()
  this.currency1Decimal = currency1Decimal === null || currency1Decimal === undefined ? 8 : currency1Decimal
  this.currency2Decimal = currency2Decimal === null || currency2Decimal === undefined ? 8 : currency2Decimal
  this.buyFee = 0
  this.sellFee = 0
  this.settings = {
    enabled: true,
    buyEnabled: false,
    sellEnabled: false,
    ticks: 15, // seconds
    depthsBuyMinimumAmount: 0,
    depthsSellMinimumAmount: 0,
    profitEnabled: true,
    profitTimeout: 60, // minutes
    minimumProfit: 0,
    trustBuyMaxAmount: 0,
    trustSellMaxAmount: 0,
    dangerZoneEnabled: true,
    dangerZoneType: 0,
    dangerZonePercentage: 20,
    dontBuyIfSelling: false
  }
  //
  // use setDepthAsks to set!
  //
  this.depthAsks = []
  //
  // use setDepthBids to set!
  //
  this.depthBids = []
  //
  // use setPublicTrades to set!
  //
  this.publicTrades = []
  //
  // use setMyTrades to set!
  //
  this.myTrades = []
  //
  // use setMyOrders to set!
  //
  this.myOrders = []
  this.ticker = {
    high: 0,
    low: 0,
    average: 0
  }
  this.minimumAmountToBuy = 1 / Math.pow(10, this.currency2Decimal)
  this._interval = null // private
  this.startTimer = function () {
    var self = this
    if (!self.settings.enabled) {
      return false
    }
    self.emit('timer_started')
    self.stopTimer()
    self._interval = setTimeout(function (pair) {
      pair.emit('tick', pair)
      pair.startTimer()
    }, self.settings.ticks * 1000, self)
    return true
  }
  this.stopTimer = function () {
    this.emit('timer_stopped')
    clearTimeout(this._interval)
  }
  this.setDepthAsks = function (array) {
    this.depthAsks = array
    this.emit('depth_asks_set')
  }
  this.setDepthBids = function (array) {
    this.depthBids = array
    this.emit('depth_bids_set')
  }
  this.setMyOrders = function (array) {
    this.myOrders = array
    this.emit('my_orders_set')
  }
  this.setPublicTrades = function (array) {
    this.publicTrades = array
    this.emit('public_trades_set')
  }
  this.setMyTrades = function (array) {
    this.myTrades = array
    this.emit('my_trades_set')
  }
  this.calculateDepthTills = function () {
    var self = this
    var total
    total = 0
    _.each(self.depthAsks, function (value, key) {
      self.depthAsks[key].till = total
      total += value.amount
    })
    total = 0
    _.each(self.depthBids, function (value, key) {
      self.depthBids[key].till = total
      total += value.amount
    })
    self.emit('depths_tills_calculated')
  }
}
pair.prototype.__proto__ = EventEmitter.prototype
module.exports = pair
