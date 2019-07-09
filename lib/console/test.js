var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
var asciichart = require ('asciichart')
module.exports = function (vorpal, app) {
  vorpal.command('test', 'test')
    .action(function (args, callback) {
        var s0 = new Array (120)
for (var i = 0; i < s0.length; i++)
    s0[i] = 15 * Math.sin (i * ((Math.PI * 4) / s0.length))
console.log (asciichart.plot (s0, {height: 10}))
    })
}
