var Market = require('../market.js')
var Order = require('../order.js')
var _ = require('lodash')
var crypto = require('crypto')
var request = require('request')
var httpBuildQuery = require('locutus/php/url/http_build_query')
var EventEmitter = require('events')
  .EventEmitter

function Poloniex (apiKey, apiSecret) {
  EventEmitter.call(this)
  Market.call(this, apiKey, apiSecret)
  this.name = 'Poloniex'
  this._tradingUrl = 'https://poloniex.com/tradingApi'
  this._publicUrl = 'https://poloniex.com/public'
  this._initFees = function () {
    //
    // TODO: If queried before memorize it
    // and use it.
    //
    var self = this
    var response = JSON.parse(self.query({
      command: 'returnFeeInfo'
    }))
    _.each(self.pairs, function (pair, pairIndex) {
      self.pairs[pairIndex].buyFee = response.makerFee * 100
      self.pairs[pairIndex].sellFee = response.makerFee * 100
    })
  }
  this._getMyBalances = function () {
    var self = this
    var response = JSON.parse(self.query({
      command: 'returnBalances'
    }))
    var currencies = self.getMyPairCurrencies()
    _.each(currencies, function (currency) {
      self.balancesInPockets[currency.toLowerCase()] = response[currency.toUpperCase()]
    })
    self.calculateTotalBalances()
  }
  this._getMyOrders = function (args) {
    var self = this
    var pairString = _.isNull(args.currency1) ? 'all' : (args.currency1.toUpperCase() + '_' + args.currency2.toUpperCase())
    var response = JSON.parse(self.query({
      command: 'returnOpenOrders',
      currencyPair: pairString
    }))
    if (pairString === 'all') {
      _.each(self.pairs, function (pair, pairIndex) {
        pairString = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase()
        var list = []
        _.each(response[pairString], function (order) {
          var newOrder = new Order(order.orderNumber, order.rate, order.amount, order.type, new Date(order.date), pair.currency2Decimal)
          list.push(newOrder)
        })
        self.pairs[pairIndex].setMyOrders(list)
      })
    } else {
      var list = []
      _.each(response, function (order) {
        var newOrder = new Order(order.orderNumber, order.rate, order.amount, order.type, new Date(order.date), args.currency2Decimal)
        list.push(newOrder)
      })
      self.pairs[args.pairIndex].setMyOrders(list)
    }
  }
  this._getDepths = function (args) {
    var self = this
    var pairString = _.isNull(args.currency1) ? 'all' : (args.currency1.toUpperCase() + '_' + args.currency2.toUpperCase())
    var response = JSON.parse(self.public({
      command: 'returnOrderBook',
      currencyPair: pairString
    }))
    if (pairString === 'all') {
      _.each(self.pairs, function (pair, pairIndex) {
        pairString = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase()
        _.each(response[pairString], function (depths) {
          //
          // asks
          //
          var list = []
          _.each(depths.asks, function (depth) {
            list.push(new Order(null, depth[0], depth[1], null, null, pair.currency2Decimal))
          })
          self.pairs[pairIndex].setDepthAsks(list)
          //
          // bids
          //
          list = []
          _.each(depths.bids, function (depth) {
            list.push(new Order(null, depth[0], depth[1], null, null, pair.currency2Decimal))
          })
          self.pairs[pairIndex].setDepthBids(list)
        })
      })
    } else {
      //
      // asks
      //
      var list = []
      _.each(response.asks, function (depth) {
        list.push(new Order(null, depth[0], depth[1], null, null, args.currency2Decimal))
      })
      self.pairs[args.pairIndex].setDepthAsks(list)
      //
      // bids
      //
      list = []
      _.each(response.bids, function (depth) {
        list.push(new Order(null, depth[0], depth[1], null, null, args.currency2Decimal))
      })
      self.pairs[args.pairIndex].setDepthBids(list)
    }
  }
  this._getPublicTrades = function (args) {
    var self = this
    var pairString = _.isNull(args.currency1) ? 'all' : (args.currency1.toUpperCase() + '_' + args.currency2.toUpperCase())
    var response = JSON.parse(self.public({
      command: 'returnTradeHistory',
      currencyPair: pairString
    }))
    if (pairString === 'all') {
      self.emit('error', self.name + ' is not have _getPublicTrades pair `all`!')
      return false
    } else {
      var list = []
      _.each(response, function (trade) {
        var newOrder = new Order(null, trade.rate, trade.amount, trade.type, new Date(trade.date), args.currency2Decimal)
        list.push(newOrder)
      })
      self.pairs[args.pairIndex].setPublicTrades(list)
    }
  }
  this._getMyTrades = function (args) {
    var self = this
    var pairString = _.isNull(args.currency1) ? 'all' : (args.currency1.toUpperCase() + '_' + args.currency2.toUpperCase())
    var response = JSON.parse(self.query({
      command: 'returnTradeHistory',
      currencyPair: pairString
    }))
    if (pairString === 'all') {
      _.each(self.pairs, function (pair, pairIndex) {
        pairString = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase()
        var list = []
        _.each(response[pairString], function (trade) {
          var newOrder = new Order(trade.globalTradeID, trade.rate, trade.amount, trade.type, new Date(trade.date), pair.currency2Decimal)
          list.push(newOrder)
        })
        self.pairs[pairIndex].setMyTrades(list)
      })
    } else {
      var list = []
      _.each(response, function (trade) {
        var newOrder = new Order(trade.globalTradeID, trade.rate, trade.amount, trade.type, new Date(trade.date), args.currency2Decimal)
        list.push(newOrder)
      })
      self.pairs[args.pairIndex].setMyTrades(list)
    }
  }
  this._makeOrder = function (pair, tradeType, rate, amount) {
    var self = this
    switch (typeof pair) {
      case 'object':
        pair = pair.currency1.toUpperCase() + '_' + pair.currency2.toUpperCase()
        break
    }
    var response = JSON.parse(self.query({
      command: tradeType.toLowerCase() === 'buy' ? 'buy' : 'sell',
      currencyPair: pair,
      rate: rate,
      amount: amount
    }))
    console.log(response)
  }
  this._cancelOrder = function () {}
  this.query = function (args) {
    var self = this
    //
    // set the nonce
    //
    args.nonce = self.getNonce()
    //
    // create sha512 hash
    //
    var hash = crypto.createHmac('sha512', self.apiSecret)
    var postData = httpBuildQuery(args, '', '&')
    hash.update(postData)
    var sign = hash.digest('hex')
    //
    // create request
    //
    var ret
    request.post({
      url: self._trading_url,
      headers: {
        'Key': self.apiKey,
        'Sign': sign
      },
      form: args
    }, function (error, response, body) {
      ret = body
    })
    while (ret === undefined) {
      require('deasync')
        .runLoopOnce()
    }
    return ret
  }
  this.public = function (args) {
    var self = this
    var data = httpBuildQuery(args, '', '&')
    var ret
    request.post({
      url: self._public_url + '?' + data
    }, function (error, response, body) {
      ret = body
    })
    while (ret === undefined) {
      require('deasync')
        .runLoopOnce()
    }
    return ret
  }
}
Poloniex.prototype.__proto__ = EventEmitter.prototype
module.exports = Poloniex
