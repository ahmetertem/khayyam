var _ = require('lodash')
var chalk = require('chalk')
var endOfLine = require('os').EOL
var fs = require('fs')
var inquirer = require('inquirer')
var notifier = require('node-notifier')
var path = require('path')

function Watcher(config, app) {
  if (!app) {
    return false
  }
  var self = this
  var history = {}
  app.markets.on('market_added', function (market) {
    market.on('market_pair_my_orders_set', function (market, pair, count) {
      var key = pair.currency1 + '_' + pair.currency2
      if (history[market.index] === undefined) {
        history[market.index] = {}
      }
      if (history[market.index][key] !== undefined) {
        if (history[market.index][key] !== count) {
          if (self.prototype.settings.consoleNotifications) {
            app.log(chalk.bold(market.name) + ', ' + pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + ' count changed from ' + history[market.index][key] + ' to ' + count)
          }
          if (self.prototype.settings.desktopNotifications) {
            notifier.notify({
              title: 'Khayyam',
              message: market.name + ', ' + pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase() + ' count changed from ' + history[market.index][key] + ' to ' + count,
              sound: true,
              wait: false
            },
  function(error, response, metadata) {
    // console.log(error, response, metadata);
  })
          }
        }
      }
      history[market.index][key] = count
    })
  })
}
Watcher.prototype.name = 'Watcher'
Watcher.prototype.version = '0.0.1'
Watcher.prototype.hasSettings = true
Watcher.prototype.settings = {
  desktopNotifications: true,
  consoleNotifications: true,
  ping: null
}
Watcher.prototype.readSettings = function (app) {
  var filePath = path.join(app.applicationDataFolder, 'plugin_' + Watcher.prototype.name + '.json')
  if (!fs.existsSync(filePath)) {
    Watcher.prototype.writeSettings(app)
    return false
  }
  Watcher.prototype.settings = _.merge(Watcher.prototype.settings, JSON.parse(fs.readFileSync(filePath, 'utf-8')))
}
Watcher.prototype.writeSettings = function (app) {
  var filePath = path.join(app.applicationDataFolder, 'plugin_' + Watcher.prototype.name + '.json')
  fs.writeFileSync(filePath, JSON.stringify(Watcher.prototype.settings))
}
Watcher.prototype.showSettings = function (app, callback, question_index) {
  var q_index = question_index === undefined ? -1 : parseInt(question_index)
  var self = this
  var settings = []
  var questions = []
  var choices = []
  settings.push({
    type: 'confirm',
    name: 'desktopNotifications',
    message: 'Show desktop notifications',
    default: self.settings.desktopNotifications
  })
  settings.push({
    type: 'confirm',
    name: 'consoleNotifications',
    message: 'Show console log',
    default: self.settings.consoleNotifications
  })
  settings.push({
    // sepBefore:true,
    type: 'input',
    name: 'ping',
    message: 'Send a ping data to http(s) URL',
    default: self.settings.ping,
    filter: function(input) {
      input = input.toLowerCase()
      if(input == ' ' || input == 'none') {
        input = null
      }
      return input
    },
    validate: function(input) {
      var done = this.async()
      var isValid = false
      if(input === null) {
        isValid = true
      } else {
        var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
        var regex = new RegExp(expression)
        isValid = input.match(regex)
      }
      if(isValid) {
        done(null, true)
      } else {
        done('Please enter a valid URL. Space or `none` for disable.'+endOfLine+'Ex: http://domain.com/folder/file.php' + endOfLine + 'Ex: none')
      }
    }
  })
  if (q_index == -1) {
    _.each(settings, function (q, i) {
      var name_ = q.message
      switch(q.type) {
      case 'confirm':
        name_ += chalk.gray.italic(' (Current: ' + (q.default ? 'Yes' : 'No') + ')')
        break
      case 'input':
        name_ += chalk.gray(' (Current: ' + (_.isEmpty(q.default) ? 'None' : q.default) + ')')
        break
      }
      if(q.sepBefore) {
        choices.push(new inquirer.Separator())
      }
      choices.push({
        value: i,
        name: name_
      })
    })
    choices.push(new inquirer.Separator())
    choices.push({
      value: -2,
      name: 'Save and exit'
    })
    questions.push({
      type: 'list',
      name: 'index',
      message: 'Select to set',
      choices: choices
    })
  } else if (q_index == -2) {
    self.writeSettings(app)
    callback()
    return
  } else {
    questions.push(settings[q_index])
  }
  inquirer.prompt(questions)
    .then(function (answers) {
      if (answers.index !== undefined) {
        self.showSettings(app, callback, answers.index)
      } else {
        _.each(answers, function (value, key) {
          self.settings[key] = value
          self.showSettings(app, callback)
        })
      }
    })
}
module.exports = Watcher
