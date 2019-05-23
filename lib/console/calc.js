/*global clean:true */
var chalk = require('chalk')
var vorpal = require('vorpal')
var _ = require('lodash')
// import { set, push } from 'immutadot'
const {
  set,
  push,
  get
} = require('immutadot')

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
  gs: null,
  level: 0,
  reset: function () {
    this.gs = {
      l: []
    }
  },
  levelIn: function () {

  },
  levelUp: function () {
    this.gs = push(this.gs, 'l', [])
    this.level++
  },
  add: function (v) {
    // this.gs = dot.object(this.gs,{'l[0]':1})
    // dot.object(this.gs,{'l[1]':1})
    this.gs = push(this.gs, 'l', v)
  }
}

function parseCommand(command) {
  command = command.trim()
  var temp = ''
  grouping.reset()
  var groups = []
  var c;
  var openGroups = 0
  var groupIndexes = ''
  for (var i = 0; i <= command.length; i++) {
    c = command[i]
    if (c == ' ') {
      grouping.add(temp)
      temp = ''
    } else if (c == '+' || c == '-' || c == '*' || c == '/') {
      grouping.add(c)
      temp = ''
    } else if (c == '(') {
      grouping.levelUp()
    } else {
      temp += c
      if (i + 1 == command.length) {
        console.log(i + 1)
        grouping.add(temp)
      }
    }
  }
  console.log(grouping.gs)
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