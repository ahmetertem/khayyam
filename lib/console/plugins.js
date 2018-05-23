var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('plugins', 'Enable / disable plugins')
    .option('-c, --configure', 'Configure plugin')
    .action(function (args, callback) {
      var plugins = []
      if (args.options.configure !== undefined) {
        _.each(app.activePlugins, function (value, index) {
          if (app.activePlugins[index].instance.prototype.hasSettings !== undefined && app.activePlugins[index].instance.prototype.hasSettings) {
            plugins.push({
              value: index,
              name: value.name
            })
          }
        })

        if (plugins.length === 0) {
          console.log(chalk.red('You do not have any plugin to configure.'))
          callback()
          return false
        }
		/*global clean:true */
        clean()
        app.output = false
        inquirer.prompt([{
          type: 'list',
          name: 'plugin',
          message: 'Select plugin to change settings',
          paginated: true,
          choices: plugins
        }])
          .then(function (answers) {
            app.activePlugins[answers.plugin].instance.prototype.showSettings(app, function () {
              app.output = true
              callback()
            })
          })
        return false
      } else {
        _.each(app.availablePlugins, function (value) {
          plugins.push({
            value: value.file,
            name: value.name,
            checked: false
          })
        })
        _.each(app.activePlugins, function (value) {
          plugins.push({
            value: value.file,
            name: value.name,
            checked: true
          })
        })
        inquirer.prompt([{
          type: 'checkbox',
          name: 'plugins',
          message: 'Enable or disable plugins. Checked=enabled',
          paginated: true,
          choices: plugins
        }])
          .then(function (answers) {
            var oldPlugins = _.union(app.activePlugins, app.availablePlugins)
            var newPlugins = []
            _.each(answers.plugins, function (pluginPath) {
              var index = _.findIndex(plugins, function (o) {
                return o.value === pluginPath
              })
              newPlugins.push({
                name: plugins[index].name
              })
            })
            _.each(oldPlugins, function (value, key) {
              oldPlugins[key].enabled = _.findIndex(newPlugins, function (o) {
                return o.name === value.name
              }) !== -1
            })

            app.activePlugins = oldPlugins
            app.writePlugins()
            console.log('Please restart the console application')
            callback()
          })
      }
    })
}
