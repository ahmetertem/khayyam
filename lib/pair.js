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
 *   - setMyTrades
 */
function pair(currency1, currency2, currency1Decimal = 8, currency2Decimal = 8) {
  EventEmitter.call(this);
  this.currency1 = currency1.toLowerCase();
  this.currency2 = currency2.toLowerCase();
  this.currency1Decimal = currency1Decimal === null ? 8 : currency1Decimal;
  this.currency2Decimal = currency2Decimal === null ? 8 : currency2Decimal;
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
  //
  // use setDepthAsks to set!
  //
  this.depth_asks = [];
  //
  // use setDepthBids to set!
  //
  this.depth_bids = [];
  //
  // use setPublicTrades to set!
  //
  this.public_trades = [];
  //
  // use setMyTrades to set!
  //
  this.my_trades = [];
  //
  // use setMyOrders to set!
  //
  this.my_orders = [];
  this.ticker = {
    high: 0,
    low: 0,
    average: 0
  };
  this.minimum_amount_to_buy = 1 / Math.pow(10, this.currency2Decimal);
  this._interval = null; // private
  this.startTimer = function () {
    var self = this;
    if (!self.settings.enabled) {
      return false;
    }
    self.emit('timer_started');
    self.stopTimer();
    self._interval = setTimeout(function () {
      self.emit('tick', self);
      self.startTimer();
    }, self.settings.ticks * 1000);
    return true;
  };
  this.stopTimer = function () {
    this.emit('timer_stopped');
    clearTimeout(this._interval);
  };
  this.setDepthAsks = function (array) {
    this.depth_asks = array;
    this.emit('depth_asks_set');
  };
  this.setDepthBids = function (array) {
    this.depth_bids = array;
    this.emit('depth_bids_set');
  };
  this.setMyOrders = function (array) {
    this.my_orders = array;
    this.emit('my_orders_set');
  };
  this.setPublicTrades = function (array) {
    this.public_trades = array;
    this.emit('public_trades_set');
  };
  this.setMyTrades = function (array) {
    this.my_trades = array;
    this.emit('my_trades_set');
  };
  this.calculateDepthTills = function () {
    var self = this;
    var total;
    total = 0;
    _.each(self.depth_asks, function (value, key) {
      self.depth_asks[key].till = total;
      total += value.amount;
    });
    total = 0;
    _.each(self.depth_bids, function (value, key) {
      self.depth_bids[key].till = total;
      total += value.amount;
    });
    self.emit('depths_tills_calculated');
  };
}
pair.prototype.__proto__ = EventEmitter.prototype;
module.exports = pair;
