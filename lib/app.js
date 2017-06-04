var Markets = require('./markets.js')
var fs = require('fs')
var glob = require('glob')
module.exports = {
  markets: null,
  plugins: {},
  applicationDataFolder: 'application_data/',
  pluginsFolder: 'plugins/',
  log: function (log) {
    console.log(log)
  },
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
    if (!fs.existsSync(this.pluginsFolder)) {
      fs.mkdirSync(this.pluginsFolder)
    }
  },
  initializePlugins: function (onOk, onChange) {
    var self = this
    var files = glob.sync(self.pluginsFolder + '*.js', {
      cwd: __dirname
    })
    files.forEach(file => {
      var path = __dirname + '/' + file
      var x = require(path)
      x.call(self, null, self)
    })
  },
  init: function () {
    this.markets.init()
    this.markets.load()
  }
}
