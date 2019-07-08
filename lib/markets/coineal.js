// https://www.coineal.com/res/download/Coineal-API.htm
var Market = require('../market.js')
var Order = require('../order.js')
var lib = require('../lib.js')
var _ = require('lodash')
var crypto = require('crypto')
var CryptoJS = require('crypto-js')
var request = require('request')
var httpBuildQuery = require('locutus/php/url/http_build_query')
var EventEmitter = require('events')
  .EventEmitter
var moment = require('moment-timezone')

function Coineal(apiKey, apiSecret, extraParams) {
  EventEmitter.call(this)
  Market.call(this, apiKey, apiSecret, extraParams)
  this.name = 'Coineal'
  this.requiredExtraParams.push('country');
  this.requiredExtraParams.push('mobile');
  this.requiredExtraParams.push('password');
  this.ablePublicTradeHistory = true
  this._tradingUrl = 'https://exchange-open-api.coineal.com/open/api'
  this._publicUrl = 'https://exchange-open-api.coineal.com/open/api'
  this._initFees = function () {
    //
    // TODO: If queried before memorize it
    // and use it.
    //
    var self = this

    _.each(self.pairs, function (pair, pairIndex) {
      self.pairs[pairIndex].buyFeeMaker = 0.1
      self.pairs[pairIndex].sellFeeMaker = 0.1
      self.pairs[pairIndex].buyFeeTaker = 0.1
      self.pairs[pairIndex].sellFeeTaker = 0.1
    })
  }
  this._getMyBalances = function () {
    var self = this
    var response = self.query('user/account');
    response = JSON.parse(response)
    self.balancesInPockets = {}
    var currencies = self.getMyPairCurrencies()
    _.each(response.data.coin_list, function (res) {
        if(currencies.indexOf(res.coin) != -1) {
            self.balancesInPockets[res.coin.toLowerCase()] = res.normal;
        }
    });
    self.calculateTotalBalances()
  }
  this._getMyOrders = function (args) {
    var self = this
    var pairString = _.isNull(args.currency1) ? 'all' : (args.currency1.toLowerCase() + args.currency2.toLowerCase())
    var response = self.query('new_order', {
      symbol: pairString
    })
    // console.log(response);
    response = JSON.parse(response);
    // console.log(response)
    if (pairString === 'all') {
      _.each(self.pairs, function (pair, pairIndex) {
        pairString = pair.currency1.toLowerCase() + '_' + pair.currency2.toLowerCase()
        var list = []
        _.each(response[pairString], function (order) {
          var newOrder = new Order(order.orderNumber, order.rate, order.amount, order.type, new Date(order.date), pair.currency2Decimal)
          list.push(newOrder)
        })
        self.pairs[pairIndex].setMyOrders(list)
      })
    } else {
      var list = []
      _.each(response.data.resultList, function (order) {
        var newOrder = new Order(order.id, order.price, order.volume, order.side, new Date(order.created_at), args.currency2Decimal)
        list.push(newOrder)
      })
      self.pairs[args.pairIndex].setMyOrders(list)
    }
  }
  this._getDepths = function (args) {
    var self = this
    var pairString = _.isNull(args.currency1) ? 'all' : (args.currency1.toLowerCase() + args.currency2.toLowerCase())
    var response = JSON.parse(self.public('market_dept', {
      symbol: pairString,
      type: 'step0'
    }))
    if (pairString === 'all') {
      _.each(self.pairs, function (pair, pairIndex) {
        pairString = pair.currency1.toLowerCase() + '_' + pair.currency2.toLowerCase()
        _.each(response.data.ticks[pairString], function (depths) {
          var buys = []
          var sels = []
          _.each(depths.asks, function (depth) {
            var order = new Order(null, depth[0], depth[1], null, null, pair.currency2Decimal)
          })
          self.pairs[pairIndex].setDepthAsks(buys)
          self.pairs[pairIndex].setDepthBids(sels)
        })
      })
    } else {
      //
      // asks
      //
      var list = []
      _.each(response.data.tick.asks, function (depth) {
        list.push(new Order(null, depth[0], depth[1], null, null, args.currency2Decimal))
      })
      self.pairs[args.pairIndex].setDepthAsks(list)
      //
      // bids
      //
      list = []
      _.each(response.data.tick.bids, function (depth) {
        list.push(new Order(null, depth[0], depth[1], null, null, args.currency2Decimal))
      })
      self.pairs[args.pairIndex].setDepthBids(list)
    }
  }
  this._getPublicTrades = function (args) {
    var self = this
    var pairString = _.isNull(args.currency1) ? 'all' : (args.currency1.toLowerCase() + args.currency2.toLowerCase())
    var options = {
      symbol: pairString
    }
    if (!_.isNull(args.startDate)) {
      var tzned = moment.tz(args.startDate.getTime(), moment.tz.guess())
      // Poloniex's server timezone is
      // America / New York
      var tzned2 = new Date(tzned.tz('America/New_York')
        .format())
      options.start = Math.floor(tzned2.getTime() / 1000)
    }
    var response = self.public('get_trades', options)

    response = JSON.parse(response)
    if (pairString === 'all') {
      self.emit('error', self.name + ' is not have _getPublicTrades pair `all`!')
      return false
    } else {
      var list = []
      _.each(response.data, function (trade) {
        var newOrder = new Order(null, trade.price, trade.amount, trade.type, new Date(trade.trade_time), args.currency2Decimal)
        list.push(newOrder)
      })
      self.pairs[args.pairIndex].setPublicTrades(list)
    }
  }
  this._getMyTrades = function (args) {
    return;
    var self = this
    var pairString = _.isNull(args.currency1) ? 'all' : (args.currency1.toLowerCase() + '_' + args.currency2.toLowerCase())
    var response = JSON.parse(self.query({
      command: 'returnTradeHistory',
      currencyPair: pairString
    }))
    if (pairString === 'all') {
      _.each(self.pairs, function (pair, pairIndex) {
        pairString = pair.currency1.toLowerCase() + '_' + pair.currency2.toLowerCase()
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
      pair = pair.currency1.toLowerCase() + '_' + pair.currency2.toLowerCase()
      break
    }
    try {
      return;
      var response = JSON.parse(self.query({
        command: tradeType === 1 ? 'buy' : 'sell',
        currencyPair: pair,
        rate: rate,
        amount: amount
      }))
      if (response.orderNumber !== undefined) {
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }
  this._cancelOrder = function (orderId) {
    var self = this
    try {
      return;
      var response = JSON.parse(self.query({
        command: 'cancelOrder',
        orderNumber: orderId
      }))
      if (response.success === 1) {
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }
  this.signing = function(args) {
      var self = this
      var defaults = {}
      // defaults.country = self.extraParams['country']
      // defaults.mobile = self.extraParams['mobile']
      // defaults.password = self.extraParams['password']
      // defaults.time = self.getNonce()

      args = Object.assign(args, defaults)
      var ret = '';
      var keyss = Object.keys(args);
      keyss.sort();
      keyss.forEach(function eachKey(key) {
          ret += key + args[key]

      });
      return ret;
  }
  this.query = function (command, args) {
    var self = this
    if (args === undefined) {
      args = {}
    }

    //
    // set the nonce
    //
    var apiSecret = self._apiSecret
    self._nonce = Date.now()
    args.time = self.getNonce()
    args.api_key = self._apiKey
    //
    // create sha512 hash
    //
    var sign = this.signing(args)
    var hash = CryptoJS.MD5(sign + apiSecret).toString()
    args.sign = hash
    var data = httpBuildQuery(args, '', '&')

    //
    // create request
    //
    var ret
    var url = self._tradingUrl + '/' + command + '?' + data

    request({
      method: 'GET',
      url: url
    }, function (_err, response, body) {
      ret = body
    })
    while (ret === undefined) {
      require('deasync')
        .runLoopOnce()
    }

    var j = JSON.parse(ret)
    if (j.error !== undefined) {
      if (j.error.indexOf('Nonce') !== -1) {
        var res = /\d+/.exec(j.error)
        if (res !== null) {
          console.log('Nonce reseted')
          self._nonce = parseInt(res[0]) + 1
          ret = self.query(command, args)
        }
      } else {
        throw j.error
      }
    }
    return ret
  }
  this.public = function (command, args) {
    var self = this
    var data = httpBuildQuery(args, '', '&')
    var ret
    request({
      url: self._publicUrl + '/' + command + '?' + data,
      method: 'GET'
    }, function (_err, response, body) {
      ret = body
    })
    while (ret === undefined) {
      require('deasync')
        .runLoopOnce()
    }
    return ret
  }
}
Coineal.prototype.__proto__ = EventEmitter.prototype
module.exports = Coineal
