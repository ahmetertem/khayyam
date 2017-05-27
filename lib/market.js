var _ = require('lodash');
var Pair = require('./pair.js');
var EventEmitter = require('events')
  .EventEmitter;
/*
 *	- Available Events:
 *		- before_initialize
 *		- after_initialize
 *		- before_init_fees
 *		- after_init_fees
 *		- before_get_balances
 *		- after_get_balances
 *		- before_get_orders
 *		- after_get_orders
 *		- before_get_public_trades
 *		- after_get_public_trades
 *		- before_get_my_trades
 *		- after_get_my_trades
 *		- pair_added
 *		- pair_not_added
 *		- pair_removed
 *		- pair_tick
 *		- error
 */
function market(apiKey, apiSecret) {
  var self = this;
  EventEmitter.call(this);
  this.apiKey = apiKey;
  this.apiSecret = apiSecret;
  this.available_pairs = [];
  this.pairs = [];
  this.balances_in_pockets = {};
  this.balances_on_orders = {};
  this.balances_all = {};
  this._nonce = Math.floor(Date.now() / 1000);
  this.initialize = function () {
    this.emit('before_initialize');
    this.initFees();
    this.emit('after_initialize');
  };
  this.initFees = function (args) {
    args = _.merge({
      pair_index: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args);
    var self = this;
    self.emit('before_init_fees');
    self._initFees(args);
    self.emit('after_init_fees');
  };
  this.getMyBalances = function (args) {
    args = _.merge({
      pair_index: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args);
    var self = this;
    self.emit('before_get_balances');
    self._getMyBalances(args);
    self.emit('after_get_balances');
  };
  this.getMyOrders = function (args) {
    args = _.merge({
      pair_index: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args);
    var self = this;
    self.emit('before_get_orders');
    if (_.isNull(args.currency1)) {
      _.each(self.pairs, function (pair, pair_index) {
        self._getMyOrders({
          pair_index: pair_index,
          currency1: pair.currency1,
          currency2: pair.currency2,
          currency2Decimal: pair.currency2Decimal
        });
      });
    } else {
      if (_.isNull(args.pair_index)) {
        args.pair_index = self.getPairIndex(args.currency1, args.currency2);
      }
      if (_.isNull(args.currency2Decimal)) {
        args.currency2Decimal = self.pairs[args.pair_index].currency2Decimal;
      }
      self._getMyOrders(args);
    }
    self.calculateOrderBalances();
    self.calculateTotalBalances();
    self.emit('after_get_orders');
  };
  this.getMyTrades = function (args) {
    args = _.merge({
      pair_index: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args);
    var self = this;
    self.emit('before_get_my_trades');
    if (_.isNull(args.currency1)) {
      _.each(self.pairs, function (pair, pair_index) {
        self._getMyTrades({
          pair_index: pair_index,
          currency1: pair.currency1,
          currency2: pair.currency2,
          currency2Decimal: pair.currency2Decimal
        });
      });
    } else {
      if (_.isNull(args.pair_index)) {
        args.pair_index = self.getPairIndex(args.currency1, args.currency2);
      }
      if (_.isNull(args.currency2Decimal)) {
        args.currency2Decimal = self.pairs[args.pair_index].currency2Decimal;
      }
      self._getMyTrades(args);
    }
    self.emit('after_get_my_trades');
  };
  this.getPublicTrades = function (args) {
    args = _.merge({
      pair_index: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args);
    var self = this;
    self.emit('before_get_public_trades');
    if (_.isNull(args.currency1)) {
      _.each(self.pairs, function (pair, pair_index) {
        self._getPublicTrades({
          pair_index: pair_index,
          currency1: pair.currency1,
          currency2: pair.currency2,
          currency2Decimal: pair.currency2Decimal
        });
      });
    } else {
      if (_.isNull(args.pair_index)) {
        args.pair_index = self.getPairIndex(args.currency1, args.currency2);
      }
      if (_.isNull(args.currency2Decimal)) {
        args.currency2Decimal = self.pairs[args.pair_index].currency2Decimal;
      }
      self._getPublicTrades(args);
    }
    self.emit('after_get_public_trades');
  };
  this.getDepths = function (args) {
    args = _.merge({
      pair_index: null,
      currency1: null,
      currency2: null,
      currency2Decimal: null
    }, args);
    var self = this;
    self.emit('before_get_depths');
    if (_.isNull(args.currency1)) {
      _.each(self.pairs, function (pair, pair_index) {
        self._getDepths({
          pair_index: pair_index,
          currency1: pair.currency1,
          currency2: pair.currency2,
          currency2Decimal: pair.currency2Decimal
        });
        self.pairs[pair_index].calculateDepthTills();
      });
    } else {
      if (_.isNull(args.pair_index)) {
        args.pair_index = self.getPairIndex(args.currency1, args.currency2);
      }
      if (_.isNull(args.currency2Decimal)) {
        args.currency2Decimal = self.pairs[args.pair_index].currency2Decimal;
      }
      self._getDepths(args);
      self.pairs[args.pair_index].calculateDepthTills();
    }
    self.emit('after_get_depths');
  };
  this.getNonce = function () {
    this._nonce++;
    return this._nonce;
  };
  this.getPairIndex = function (currency1, currency2) {
    return _.findIndex(this.pairs, {
      currency1: currency1,
      currency2: currency2
    });
  };
  this.isPairExist = function (currency1, currency2) {
    if (currency1 instanceof Pair) {
      currency2 = currency1.currency2;
      currency1 = currency1.currency1;
    }
    return _.findIndex(this.pairs, {
      currency1: currency1.toLowerCase(),
      currency2: currency2.toLowerCase()
    }) > -1
  };
  this.getMyPairCurrencies = function () {
    var pairs = [];
    var self = this;
    _.each(self.pairs, function (pair_) {
      pairs.push(pair_.currency1);
      pairs.push(pair_.currency2);
    });
    return _.uniq(pairs);
  };
  this.addPair = function (currency1, currency2, args) {
    args = _.merge({
      programmed: false
    }, args);
    var self = this;
    var pair = null;
    if (currency1 instanceof Pair) {
      pair = currency1;
    } else if (_.isString(currency1) && _.isString(currency2)) {
      var pair_ = _.find(self.available_pairs, {
        currency1: currency1.toUpperCase(),
        currency2: currency2.toUpperCase()
      });
      pair = new Pair(pair_.currency1, pair_.currency2, pair_.currency1Decimal !== undefined ? pair_.currency1Decimal : 8, pair_.currency2Decimal !== undefined ? pair_.currency2Decimal : 8);
    } else {
      self.emit('error', (typeof currency1) + ' -- ' + (typeof currency2));
    }
    if (this.isPairExist(pair.currency1, pair.currency2)) {
      self.emit('error', 'Pair ' + pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + ' is already added');
      self.emit('pair_not_added', pair);
      return false;
    }
    pair.on('tick', function (pair) {
      args = {
        currency1: pair.currency1,
        currency2: pair.currency2,
        currency2Decimal: pair.currency2Decimal
      }
      args.pair_index = self.getPairIndex(args.currency1, args.currency2);
      self.getMyOrders(args);
      self.getMyTrades(args);
      self.getMyBalances(args);
      self.getPublicTrades(args);
      self.getDepths(args);
      self.emit('pair_tick', pair);
    });
    pair.startTimer();
    self.pairs.push(pair);
    self.emit('pair_added', pair, args);
    if (!args.programmed) {
      self.initialize();
    }
    return true;
  };
  this.removePairAtIndex = function (index) {
    self.pairs[index].stopTimer();
    self.pairs.splice(index, 1);
    self.emit('pair_removed');
    self.initialize();
  };
  this.calculateOrderBalances = function () {
    var self = this;
    var currencies = self.getMyPairCurrencies();
    _.each(currencies, function (currency) {
      self.balances_on_orders[currency.toLowerCase()] = 0;
    });
    _.each(self.pairs, function (pair) {
      var total = 0;
      _.each(pair.my_orders, function (order) {
        total += order.total;
      });
      self.balances_on_orders[pair.currency2.toLowerCase()] += total;
    });
  };
  this.calculateTotalBalances = function () {
    var self = this;
    var currencies = self.getMyPairCurrencies();
    _.each(currencies, function (currency) {
      self.balances_all[currency] = parseFloat(self.balances_in_pockets[currency]) + parseFloat(self.balances_on_orders[currency]);
    });
  };
}
market.prototype.__proto__ = EventEmitter.prototype;
module.exports = market;
