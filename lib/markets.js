var _ = require('lodash')
var fs = require('fs')
var glob = require('glob')
var EventEmitter = require('events')
  .EventEmitter
/**
 * - Available Events:
 *   - add_available_market
 *   - initialized
 *   - saved
 *   - loaded
 *   - error (*fireable from market and self*)
 *   - market_pair_added (*fires from market*)
 *   - market_added
 *   - market_removed
 *   - market_pair_tick
 */
function Markets () {
  EventEmitter.call(this)
  this.markets = []
  this.availableMarkets = []
  this.marketsDirectory = './markets/'
  this.settingsFilePath = null
  this.init = function () {
    //
    // cwd option must be set because
    // glob's default cwd is process's
    // directory
    //
    var files = glob.sync(this.marketsDirectory + '*.js', {
      cwd: __dirname
    })
    files.forEach(file => {
      var market = require(file)
      this.availableMarkets.push(market)
      this.emit('add_available_market', market.prototype.constructor.name)
    })
    this.emit('initialized')
  }
  this.load = function () {
    var json = JSON.parse(fs.readFileSync(this.settingsFilePath, 'utf-8'))
    var self = this
    _.forEach(json, function (market) {
      if (self.add(market.name, market.apiKey, market.apiSecret, {
        save: false,
        initialize: false
      })) {
        var marketLastIndex = self.markets.length - 1
        _.forEach(market.pairs, function (pair) {
          self.markets[marketLastIndex].addPair(pair.currency1, pair.currency2, {
            programmed: true
          })
          var pairLastIndex = self.markets[marketLastIndex].pairs.length - 1
          self.markets[marketLastIndex].pairs[pairLastIndex].settings = _.merge(self.markets[marketLastIndex].pairs[pairLastIndex].settings, pair.settings)
        })
        self.markets[marketLastIndex].initialize()
      }
    })
    this.emit('loaded')
  }
  this.save = function () {
    var list = []
    _.forEach(this.markets, function (market) {
      var pairs = []
      _.forEach(market.pairs, function (pair) {
        var pairNew = {}
        pairNew.currency1 = pair.currency1
        pairNew.currency2 = pair.currency2
        pairNew.settings = pair.settings
        pairs.push(pairNew)
      })
      list.push({
        name: market.name,
        apiKey: market.apiKey,
        apiSecret: market.apiSecret,
        pairs: pairs
      })
    })
    fs.writeFileSync(this.settingsFilePath, JSON.stringify(list))
    this.emit('saved')
  }
  this.add = function (marketName, apiKey, apiSecret, args) {
    args = _.merge({
      save: true,
      initialize: true
    }, args)
    marketName = _.trim(marketName)
    apiKey = _.trim(apiKey)
    apiSecret = _.trim(apiSecret)
    var Market = _.find(this.availableMarkets, function (O) {
      var x = new O()
      return x.name.toLowerCase() === marketName.toLowerCase()
    })
    if (Market === undefined) {
      this.emit('error', 'Market is not found named with `' + marketName + '`')
      return false
    }
    var self = this
    var market_ = new Market(apiKey, apiSecret)
    market_.on('error', function (error) {
      self.emit('error', error)
    })
    market_.on('pair_added', function (pair, args) {
      if (!args.programmed) {
        self.save()
      }
      self.emit('market_pair_added', this, pair, args)
    })
    market_.on('pair_removed', function () {
      self.save()
      self.emit('market_pair_removed', this)
    })
    market_.on('pair_tick', function (pair) {
      self.emit('market_pair_tick', this, pair)
    })
    //
    // initialize pairs' JSON files
    //
    var files = glob.sync(this.marketsDirectory + marketName + '/*.json', {
      cwd: __dirname
    })
    files.forEach(file => {
      var pairJSON = require(file)
      if (_.isArray(pairJSON)) {
        _.forEach(pairJSON, function (pair) {
          market_.availablePairs.push(pair)
        })
      } else {
        market_.availablePairs.push(pairJSON)
      }
    })
    if (args.initialize) {
      market_.initialize()
    }
    this.markets.push(market_)
    if (args.save) {
      this.save()
    }
    this.emit('market_added', market_)
    return true
  }
  this.removeAtIndex = function (index) {
    this.markets.splice(index, 1)
    this.save()
    this.emit('market_removed')
  }
}
Markets.prototype.__proto__ = EventEmitter.prototype
module.exports = Markets
