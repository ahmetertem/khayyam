var _ = require('lodash')
var Pair = require('./pair.js')
var EventEmitter = require('events')
  .EventEmitter
/**
 * - Available Events:
 *   - before_initialize
 *   - after_initialize
 *   - before_init_fees
 *   - after_init_fees
 *   - before_get_balances
 *   - after_get_balances
 *   - before_get_orders
 *   - after_get_orders
 *   - before_get_public_trades
 *   - after_get_public_trades
 *   - before_get_my_trades
 *   - after_get_my_trades
 *   - before_make_order
 *   - after_make_order
 *   - before_cancel_order
 *   - after_cancel_order
 *   - pair_added
 *   - pair_not_added
 *   - pair_removed
 *   - pair_tick
 *   - error
 */
function market(apiKey, apiSecret, extraParams) {
  var self = this
  EventEmitter.call(this)
  extraParams = extraParams === undefined ? {} : extraParams;
  self.ablePublicTradeHistory = false
  self.apiKey = apiKey
  self._apiKey = apiKey
  self.apiSecret = apiSecret
  self._apiSecret = apiSecret
  self.extraParams = extraParams
  self.requiredExtraParams = []
  self.availablePairs = []
  self.pairs = []
  self.balancesInPockets = {}
  self.balancesOnOrders = {}
  self.balancesAll = {}
  self._nonce = Math.floor(Date.now() / 1000)
  self.lastTimePublicTradeGet = null
  self.initialize = function () {
    var self = this
    self.emit('before_initialize')
    self.lastTimePublicTradeGet = new Date()
    self.initFees()
    self.emit('after_initialize')
  }
  self.initFees = function (args_) {
    var args = _.merge({
      pairIndex: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args_)
    var self = this
    self.emit('before_init_fees')
    self._initFees()
    self.emit('after_init_fees')
  }
  self.getMyBalances = function (args) {
    args = _.merge({
      pairIndex: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args)
    var self = this
    self.emit('before_get_balances')
    self._getMyBalances(args)
    self.emit('after_get_balances')
  }
  self.getMyOrders = function (args) {
    args = _.merge({
      pairIndex: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args)
    var self = this
    self.emit('before_get_orders')
    if (_.isNull(args.currency1)) {
      _.each(self.pairs, function (pair, pairIndex) {
        self._getMyOrders({
          pairIndex: pairIndex,
          currency1: pair.currency1,
          currency2: pair.currency2,
          currency2Decimal: pair.currency2Decimal
        })
      })
    } else {
      if (_.isNull(args.pairIndex)) {
        args.pairIndex = self.getPairIndex(args.currency1, args.currency2)
      }
      if (_.isNull(args.currency2Decimal)) {
        args.currency2Decimal = self.pairs[args.pairIndex].currency2Decimal
      }
      self._getMyOrders(args)
    }
    self.calculateOrderBalances()
    self.calculateTotalBalances()
    self.emit('after_get_orders')
  }
  self.getMyTrades = function (args) {
    args = _.merge({
      pairIndex: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args)
    var self = this
    self.emit('before_get_my_trades')
    if (_.isNull(args.currency1)) {
      _.each(self.pairs, function (pair, pairIndex) {
        self._getMyTrades({
          pairIndex: pairIndex,
          currency1: pair.currency1,
          currency2: pair.currency2,
          currency2Decimal: pair.currency2Decimal
        })
      })
    } else {
      if (_.isNull(args.pairIndex)) {
        args.pairIndex = self.getPairIndex(args.currency1, args.currency2)
      }
      if (_.isNull(args.currency2Decimal)) {
        args.currency2Decimal = self.pairs[args.pairIndex].currency2Decimal
      }
      self._getMyTrades(args)
    }
    self.emit('after_get_my_trades')
  }
  self.getPublicTrades = function (args) {
    args = _.merge({
      pairIndex: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null,
      startDate: null,
      endDate: null
    }, args)
    var self = this
    self.emit('before_get_public_trades')
    if (_.isNull(args.currency1)) {
      _.each(self.pairs, function (pair, pairIndex) {
        self._getPublicTrades({
          pairIndex: pairIndex,
          currency1: pair.currency1,
          currency2: pair.currency2,
          currency2Decimal: pair.currency2Decimal,
          startDate: args.startDate,
          endDate: args.endDate
        })
      })
    } else {
      if (_.isNull(args.pairIndex)) {
        args.pairIndex = self.getPairIndex(args.currency1, args.currency2)
      }
      if (_.isNull(args.currency2Decimal)) {
        args.currency2Decimal = self.pairs[args.pairIndex].currency2Decimal
      }
      self._getPublicTrades(args)
    }
    self.lastTimePublicTradeGet = new Date()
    self.emit('after_get_public_trades')
  }
  self.getDepths = function (args) {
    args = _.merge({
      pairIndex: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args)
    var self = this
    self.emit('before_get_depths')
    if (_.isNull(args.currency1)) {
      _.each(self.pairs, function (pair, pairIndex) {
        self._getDepths({
          pairIndex: pairIndex,
          currency1: pair.currency1,
          currency2: pair.currency2,
          currency2Decimal: pair.currency2Decimal
        })
        self.pairs[pairIndex].calculateDepthTills()
      })
    } else {
      if (_.isNull(args.pairIndex)) {
        args.pairIndex = self.getPairIndex(args.currency1, args.currency2)
      }
      if (_.isNull(args.currency2Decimal)) {
        args.currency2Decimal = self.pairs[args.pairIndex].currency2Decimal
      }
      self._getDepths(args)
      self.pairs[args.pairIndex].calculateDepthTills()
    }
    self.emit('after_get_depths')
  }
  self.makeOrder = function (pair, tradeType, rate, amount) {
    var self = this
    self.emit('before_make_order')
    var result = self._makeOrder(pair, tradeType, rate, amount)
    self.emit('after_make_order')
    return result
  }
  self.cancelOrder = function (orderId) {
    var self = this
    self.emit('before_cancel_order')
    var result = self._cancelOrder(orderId)
    self.emit('after_cancel_order')
    return result
  }
  self.getNonce = function () {
    ++self._nonce
    return self._nonce
  }
  self.getPairIndex = function (currency1, currency2) {
    return _.findIndex(self.pairs, {
      currency1: currency1,
      currency2: currency2
    })
  }
  self.isPairExist = function (currency1, currency2) {
    if (currency1 instanceof Pair) {
      currency2 = currency1.currency2
      currency1 = currency1.currency1
    }
    return _.findIndex(self.pairs, {
      currency1: currency1.toLowerCase(),
      currency2: currency2.toLowerCase()
    }) > -1
  }
  self.getMyPairCurrencies = function () {
    var pairs = []
    var self = this
    _.each(self.pairs, function (pair_) {
      pairs.push(pair_.currency1)
      pairs.push(pair_.currency2)
    })
    return _.uniq(pairs)
  }
  self.addPair = function (currency1, currency2, args) {
    args = _.merge({
      programmed: false
    }, args)
    var self = this
    var pair = null
    if (currency1 instanceof Pair) {
      pair = currency1
    } else if (_.isString(currency1) && _.isString(currency2)) {
      var pair_ = _.find(self.availablePairs, {
        currency1: currency1.toUpperCase(),
        currency2: currency2.toUpperCase()
      })
      pair = new Pair(pair_.currency1, pair_.currency2, pair_.currency1Decimal !== undefined ? pair_.currency1Decimal : 8, pair_.currency2Decimal !== undefined ? pair_.currency2Decimal : 8)
    } else {
      self.emit('error', (typeof currency1) + ' -- ' + (typeof currency2))
    }
    if (self.isPairExist(pair.currency1, pair.currency2)) {
      self.emit('error', 'Pair ' + pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + ' is already added')
      self.emit('pair_not_added', pair)
      return false
    }
    self.pairs.push(pair)
    var latestPairIndex = self.pairs.length - 1
    self.pairs[latestPairIndex].on('tick', function (pair) {
        args = {
          currency1: pair.currency1,
          currency2: pair.currency2,
          currency1Decimal: pair.currency1Decimal,
          currency2Decimal: pair.currency2Decimal
        }
        args.pairIndex = self.getPairIndex(args.currency1, args.currency2)
        self.getMyOrders(args)
        self.getMyTrades(args)
        self.getMyBalances(args)
        if (self.ablePublicTradeHistory === true) {
          self.getPublicTrades(_.merge(args, {
            startDate: self.lastTimePublicTradeGet
          }))
        } else {
          self.getPublicTrades(args)
        }
        self.getDepths(args)
        self.emit('pair_tick', pair)
      })
      .on('public_trades_set', function (pair, count) {
        self.emit('pair_public_trades_set', pair, count)
      })
      .on('my_orders_set', function (pair, count) {
        // console.log('b ' + pair.currency1)
        // console.log('b ' + JSON.stringify(count))
        self.emit('pair_my_orders_set', pair, count)
      })
    self.pairs[latestPairIndex].startTimer()
    self.emit('pair_added', self.pairs[latestPairIndex], args)
    if (!args.programmed) {
      self.initialize()
    }
    return true
  }
  self.removePairAtIndex = function (index) {
    self.pairs[index].stopTimer()
    self.pairs.splice(index, 1)
    self.emit('pair_removed')
    self.initialize()
  }
  self.calculateOrderBalances = function () {
    var self = this
    var currencies = self.getMyPairCurrencies()
    self.balancesOnOrders = {}
    _.each(currencies, function (currency) {
      self.balancesOnOrders[currency.toLowerCase()] = 0
    })
    _.each(self.pairs, function (pair) {
      var total = 0
      _.each(pair.myOrders, function (order) {
        total += order.amount
      })
      self.balancesOnOrders[pair.currency2.toLowerCase()] += total
    })
  }
  self.calculateTotalBalances = function () {
    var self = this
    var currencies = self.getMyPairCurrencies()
    self.balancesAll = {}
    _.each(currencies, function (currency) {
      self.balancesAll[currency] = parseFloat(self.balancesInPockets[currency]) + parseFloat(self.balancesOnOrders[currency])
    })
  }
}
market.prototype.__proto__ = EventEmitter.prototype
module.exports = market
