var fs = require('fs');
var markets = require('./markets.js');
module.exports = {
  markets: null,
  application_data_folder: 'application_data/',
  prerequisite: function () {
    this.markets = new markets();
    if (!fs.existsSync(this.application_data_folder)) {
      fs.mkdirSync(this.application_data_folder);
    }
    this.application_data_folder = fs.realpathSync(this.application_data_folder);
    this.markets.settingsFilePath = this.application_data_folder + '/markets.json';
    if (!fs.existsSync(this.markets.settingsFilePath)) {
      //
      // create file
      //
      fs.openSync(this.markets.settingsFilePath, 'w+');
      //
      // save empty array to new created file
      //
      this.markets.save();
    }
    this.markets.settingsFilePath = fs.realpathSync(this.markets.settingsFilePath);
  },
  init: function () {
    this.markets.init();
    this.markets.load();
  }
};
