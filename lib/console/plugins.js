var _ = require('lodash')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('plugins', 'Enable / disable plugins')
    .action(function (args, callback) {
      var plugins = []
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
    })
}
