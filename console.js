#!/usr/bin/env node

var glob = require('glob')
var vorpal = require('vorpal')()
var inquirer = require('inquirer')
var chalk = require('chalk')

var app = require('./lib/app.js')
app.prerequisite()
// app.markets.on('add_available_market', function (a) {
//   app.log(chalk.blue('Market `' + a + '` added to available markets'))
// })
app.markets.on('market_removed', function () {
  app.log(chalk.green('Market removed'))
})
app.markets.on('saved', function () {
  app.log(chalk.blue('Markets saved'))
})
app.markets.on('error', function (message) {
  app.log(chalk.red(message))
})
// app.markets.on('market_pair_added', function (market, pair) {
//   app.log(chalk.green('Pair `' + pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + '` added to ' + market.name))
// })
app.markets.on('market_pair_removed', function (market) {
  app.log(chalk.green('Pair is removed from ' + market.name))
})
var files = glob.sync('./lib/console/*.js', {
  cwd: __dirname
})
files.forEach(file => {
  vorpal.use(require(file), app)
})
inquirer.prompt([{
    type: 'password',
    name: 'pass',
    message: 'Enter your password if you have, otherwise just press enter to continue...'
}])
  .then(function (answers) {
    app.init(answers.pass)
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
  });
// console.log(process.argv)

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/*global clean:true */
clean = function () {
  var blank = ''
  for (var i = 0; i < process.stdout.rows; ++i) {
    blank += '\n'
  }
  vorpal.ui.redraw(blank)
  vorpal.ui.redraw('')
}
/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/*global declean:true */
declean = function () {
  vorpal.ui.redraw.clear()
}