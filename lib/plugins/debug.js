var chalk = require('chalk')

function Debug (config, app) {
  if (!app) {
    return false
  }
  var self = this
  app.markets.on('add_available_market', function (a) {
    self.debug('add_available_market ' + a)
  })
  app.markets.on('market_removed', function () {
    self.debug('market_removed')
  })
  app.markets.on('saved', function () {
    self.debug('saved')
  })
  app.markets.on('loaded', function () {
    self.debug('loaded')
  })
  app.markets.on('error', function (message) {
    self.debug('error ' + message)
  })
  app.markets.on('market_pair_added', function (market, pair) {
    self.debug('market_pair_added') // + market + ' ' + JSON.stringify(pair))
  })
  app.markets.on('market_pair_removed', function (market) {
    self.debug('market_pair_removed ' + JSON.stringify(market))
  })
  app.markets.on('market_added', function (market) {
    market.on('before_initialize', function () {
      self.debug('before_initialize')
    })
    market.on('after_initialize', function () {
      self.debug('after_initialize')
    })
    market.on('before_init_fees', function () {
      self.debug('before_init_fees')
    })
    market.on('after_init_fees', function () {
      self.debug('after_init_fees')
    })
    market.on('before_get_balances', function () {
      self.debug('before_get_balances')
    })
    market.on('after_get_balances', function () {
      self.debug('after_get_balances')
    })
    market.on('before_get_orders', function () {
      self.debug('before_get_orders')
    })
    market.on('after_get_orders', function () {
      self.debug('after_get_orders')
    })
    market.on('before_get_public_trades', function () {
      self.debug('before_get_public_trades')
    })
    market.on('after_get_public_trades', function () {
      self.debug('after_get_public_trades')
    })
    market.on('before_get_my_trades', function () {
      self.debug('before_get_my_trades')
    })
    market.on('after_get_my_trades', function () {
      self.debug('after_get_my_trades')
    })
    self.debug('market_added')
  })
  app.markets.on('market_removed', function () {
    self.debug('market_removed')
  })
  app.markets.on('market_pair_tick', function (market, pair) {
    self.debug('market_pair_tick ' + market.name)
  })
  this.debug = function (log) {
    var d = new Date()
    app.log(chalk.bold.magenta(d.toJSON() + ' : ' + log))
  }
}
Debug.prototype.version = '0.0.2'
module.exports = Debug
