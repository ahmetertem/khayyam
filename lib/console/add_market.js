const _ = require('lodash');
const chalk = require('chalk');
const inquirer = require('inquirer');
module.exports = function(vorpal, app) {
	vorpal.command('add_market', 'Initialize new market instance')
		.action(function(args, callback) {
			var market_names = [];
			_.forEach(app.markets.available_markets, function(value, key) {
				market_names.push(value.name);
			});
			inquirer.prompt([{
					type: 'list',
					name: 'market_name',
					message: 'Which market do you want to initialize?',
					paginated: true,
					choices: market_names
	}, {
					type: 'input',
					name: 'api_key',
					message: 'Enter your API key'
	}, {
					type: 'input',
					name: 'api_secret',
					message: 'Enter your API Secret'
	}])
				.then(function(answers) {
					app.markets.add(answers.market_name, answers.api_key, answers.api_secret);
					callback();
				});
		});
}
