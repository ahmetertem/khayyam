const fs = require('fs');
module.exports = {
	markets: [],
	application_data_folder: '../application_data/',
	markets: null,
	init: function()
	{
		var mf = this;
		this.markets = require('./markets.js');
		this.application_data_folder = fs.realpathSync('application_data');
		this.markets.settings_file_path = fs.realpathSync(this.application_data_folder + '/markets.json');
		if (!fs.existsSync(this.application_data_folder))
		{
			fs.mkdirSync(this.application_data_folder);
		}
		if (!fs.existsSync(this.markets.settings_file_path))
		{
			// create file
			fs.openSync(this.markets.settings_file_path, 'w+');
			// save empty array to new created file
			this.markets.save();
		}
		this.markets.init();
		this.markets.load();
	}
};
