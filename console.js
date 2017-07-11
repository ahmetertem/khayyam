#!/usr/bin/env node

var glob = require('glob')
var vorpal = require('vorpal')()
var chalk = require('chalk')
var app = require('./lib/app.js')
app.prerequisite()
app.markets.on('add_available_market', function (a) {
  app.log(chalk.blue('Market `' + a + '` added to available markets'))
})
app.markets.on('market_removed', function () {
  app.log(chalk.green('Market removed'))
})
app.markets.on('saved', function () {
  app.log(chalk.blue('Markets saved'))
})
app.markets.on('error', function (message) {
  app.log(chalk.red(message))
})
app.markets.on('market_pair_added', function (market, pair) {
  app.log(chalk.green('Pair `' + pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + '` added to ' + market.name))
})
app.markets.on('market_pair_removed', function (market) {
  app.log(chalk.green('Pair is removed from ' + market.name))
})
var files = glob.sync('./lib/console/*.js', {
  cwd: __dirname
})
files.forEach(file => {
  vorpal.use(require(file), app)
})
app.init()
vorpal.find('exit')
  .remove()
vorpal.command('exit', 'Exits application.')
  .alias('quit')
  .action(function () {
    process.exit(0)
  })
vorpal.history('bitcoinbot')
  .delimiter('$')
  .show()
