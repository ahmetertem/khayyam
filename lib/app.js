var fs = require('fs')
var Markets = require('./markets.js')
module.exports = {
  markets: null,
  applicationDataFolder: 'application_data/',
  prerequisite: function () {
    this.markets = new Markets()
    if (!fs.existsSync(this.applicationDataFolder)) {
      fs.mkdirSync(this.applicationDataFolder)
    }
    this.applicationDataFolder = fs.realpathSync(this.applicationDataFolder)
    this.markets.settingsFilePath = this.applicationDataFolder + '/markets.json'
    if (!fs.existsSync(this.markets.settingsFilePath)) {
      //
      // create file
      //
      fs.openSync(this.markets.settingsFilePath, 'w+')
      //
      // save empty array to new created file
      //
      this.markets.save()
    }
    this.markets.settingsFilePath = fs.realpathSync(this.markets.settingsFilePath)
  },
  init: function () {
    this.markets.init()
    this.markets.load()
  }
}
