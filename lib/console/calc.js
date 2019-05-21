/*global clean:true */
var chalk = require('chalk')
var vorpal = require('vorpal')
var set = require('set-value');
const get = require('get-value');
var _ = require('lodash')

var calc_cb = null
var calc_instance = new vorpal()
var vorp = null;
// calc_instance.delimiter('calc>')
//
// calc_instance.find('exit')
//   .remove()
// calc_instance.command('exit', 'Exits calculate mode.')
//   .alias('quit')
//   .action(function () {
//     calc_instance.hide()
//     vorp.exec('exit')
//     vorp.show()
//     calc_cb()
//   })
// calc_instance.command('buy', 'Calculate buy')
//   .option('-r', 'Rate')
//   .option('-a', 'Amount')
//   .action(function (args, cb) {
//     cb()
//   })
var grouping = {
  text: '',
  gs: [],
  level: 0,
  newLevel: function () {
    var t = this.text.split('.')
    var i = _.slice(t, this.level, 1)
    i++
    var n = _.slice(t, 0, t.length - 1)
    n.push(i)
    this.text = _.join(n)
  },
  levelUp: function () {

  },
  add: function (v) {
    set(this.gs, this.text, v)
    console.log(this.gs)
  }
}

function parseCommand(command) {
  command = command.trim()
  var temp = ''
  grouping.text = '-1'
  var groups = []
  var c;
  var openGroups = 0
  var groupIndexes = ''
  for (var i = 0; i < command.length; i++) {
    c = command[i]
    if (c == ' ') {
      grouping.add(temp)
      console.log(grouping.text)
      console.log(grouping.gs)
      // groups.push(temp)
      // groupIndexes
      temp = ''
    } else if (c == '+' || c == '-' || c == '*' || c == '/') {
      // groups.push(c)
    } else if (c == '(') {
      grouping.newLevel()
      console.log(grouping.text)
      console.log(grouping.gs)
      // openGroups++
    } else {
      temp += c
    }
    // console.log(command[i])
  }
}

module.exports = function (vorpal, app) {
  vorpal
    .mode('calc')
    .delimiter('calc>')
    .init(function (args, callback) {
      this.log(chalk.cyan('Calculate mode started.\nFor exit type `exit`'));
      // calc_instance.show()
      vorpal.show()
      vorp = vorpal
      calc_cb = callback
      callback()
    })
    .action(function (command, callback) {
      calc_cb = callback
      // console.log('aa' + command)
      parseCommand(command)
      callback()
    });
}