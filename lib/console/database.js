var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
module.exports = function (vorpal, app) {
  vorpal.command('database', 'Initialize database settings')
    .action(function (args, callback) {
      var engines = [{
        name: 'SQLite3',
        value: 'sqlite3'
    }, {
        name: 'MySQL',
        value: 'mysql'
    }, {
        name: 'PostgreSQL',
        value: 'postgresql'
      }]
      inquirer.prompt([{
        type: 'list',
        name: 'engine',
        message: 'Select engine of your database',
        default: app.databaseSettings.engine,
        choices: engines
      }]).then(function (answers) {
        if (answers.engine === 'mysql' || answers.engine == 'postgresql') {
          inquirer.prompt([{
            type: 'input',
            name: 'host',
            message: 'Enter your host',
            default: app.databaseSettings.host
        }, {
            type: 'input',
            name: 'username',
            message: 'Enter your user name',
            default: app.databaseSettings.username
        }, {
            type: 'password',
            name: 'password',
            message: 'Enter your user password',
            default: app.databaseSettings.password
        }, {
            type: 'input',
            name: 'database',
            message: 'Enter your database schema name',
            default: app.databaseSettings.database
        }, {
            type: 'input',
            name: 'port',
            message: 'Enter your host port',
            default: app.databaseSettings.port
        }]).then(function (answers2) {
            app.databaseSettings.engine = answers.engine
            app.databaseSettings.host = answers2.host
            app.databaseSettings.username = answers2.username
            app.databaseSettings.password = answers2.password
            app.databaseSettings.database = answers2.database
            app.databaseSettings.port = answers2.port
            app.writeDatabaseSettings()
            app.log('Please re-start the application')
            process.exit(0)
          })
        } else {

        }
      })
    })
}
