const fs = require('fs');
const glob = require('glob');
module.exports = {
	markets: [],
	markets_folder: './markets/',
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
		//
		// cwd option must be set because
		// glob's default cwd is process's
		// directory
		//
		var files = glob.sync(this.markets_folder + "*.js",
		{
			cwd: __dirname
		});
		files.forEach(file =>
		{
			var market_ = require(file);
			console.log('Market `' + market_.prototype.constructor.name + '` loaded');
			mf.markets.available_markets.push(market_);
		});
		this.markets.load();
	}
};
