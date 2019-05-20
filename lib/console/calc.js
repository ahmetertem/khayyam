/*global clean:true */
var chalk = require('chalk')
var vorpal = require('vorpal')

var calc_cb = null
var calc_instance = new vorpal()
var vorp = null;
calc_instance.delimiter('calc>')

calc_instance.find('exit')
  .remove()
calc_instance.command('exit', 'Exits calculate mode.')
  .alias('quit')
  .action(function () {
    calc_instance.hide()
    vorp.show()
    calc_cb()
  })
calc_instance.command('buy', 'Calculate buy')
  .option('-r', 'Rate')
  .option('-a', 'Amount')
  .action(function (args, cb) {
    cb()
  })
module.exports = function (vorpal, app) {
  vorpal
    .mode('calc')
    .delimiter('calc>')
    .init(function (args, callback) {
      this.log(chalk.cyan('Calculate mode started.\nFor exit type `exit`'));
      calc_instance.show()
      vorp = vorpal
      calc_cb = callback
      // callback()
    })
    .action(function (command, callback) {
      calc_cb = callback
      callback()
    });
}