/*global clean:true */
var _ = require('lodash')
var chalk = require('chalk')
var inquirer = require('inquirer')
var md5 = require('md5')

var cb

module.exports = function (vorpal, app) {
  vorpal
    .command('passwd')
    .action(function (command, callback) {
      cb = callback
      var questions = []
      if (!_.isNull(app.settings.password)) {
        questions.push({
          type: 'password',
          name: 'old',
          message: 'Enter old password'
        });
      }
      questions.push({
        type: 'password',
        name: 'new1',
        message: 'Enter new password'
      });
      questions.push({
        type: 'password',
        name: 'new2',
        message: 'Confirm new password'
      });

      inquirer.prompt(questions)
        .then(function (answers) {
          if (answers.old !== undefined) {
            if (app.settings.password != md5(answers.old)) {
              app.log(chalk.red('Old password is incorrect'))
              callback()
              return
            }
          }
          if (answers.new1 != answers.new2) {
            app.log(chalk.red('New passwords are not matching'))
            callback()
            return
          }
          app.changePassword(answers.new1)
          // console.log(answers)
          callback()
        });
    });
}