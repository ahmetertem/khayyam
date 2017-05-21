const fs = require('fs');
const markets = require('./markets.js');
module.exports = {
	markets: null,
	application_data_folder: 'application_data/',
	prerequisite: function() {
		this.markets = new markets();
		if (!fs.existsSync(this.application_data_folder)) {
			fs.mkdirSync(this.application_data_folder);
		}
		this.application_data_folder = fs.realpathSync(this.application_data_folder);
		this.markets.settings_file_path = this.application_data_folder + '/markets.json';
		if (!fs.existsSync(this.markets.settings_file_path)) {
			//
			// create file
			//
			fs.openSync(this.markets.settings_file_path, 'w+');
			//
			// save empty array to new created file
			//
			this.markets.save();
		}
		this.markets.settings_file_path = fs.realpathSync(this.markets.settings_file_path);
	},
	init: function() {
		this.markets.init();
		this.markets.load();
	}
};
