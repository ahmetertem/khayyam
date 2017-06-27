var Markets = require('./markets.js')
var _ = require('lodash')
var fs = require('fs')
var glob = require('glob')
var path = require('path')
module.exports = {
  markets: null,
  availablePlugins: [],
  activePlugins: [],
  applicationDataFolder: 'application_data/',
  pluginsFolder: 'plugins/',
  log: function (log) {
    console.log(log)
  },
  prerequisite: function () {
    var self = this
    self.markets = new Markets()
    //
    // check application data folder is exists
    // if not exist create it
    //
    if (!fs.existsSync(self.applicationDataFolder)) {
      fs.mkdirSync(self.applicationDataFolder)
    }
    //
    // set property value to absolute path for
    // future references
    //
    self.applicationDataFolder = fs.realpathSync(self.applicationDataFolder)
    self.markets.settingsFilePath = path.join(self.applicationDataFolder, 'markets.json')
    if (!fs.existsSync(self.markets.settingsFilePath)) {
      //
      // create file
      //
      fs.openSync(self.markets.settingsFilePath, 'w+')
      //
      // save empty array to new created file
      //
      self.markets.save()
    }
    if (!fs.existsSync(path.join(self.applicationDataFolder, 'plugins.json'))) {
      self.writePlugins()
    }
    self.markets.settingsFilePath = fs.realpathSync(self.markets.settingsFilePath)
    if (!fs.existsSync(self.pluginsFolder)) {
      fs.mkdirSync(self.pluginsFolder)
    }
  },
  initializePlugins: function (onOk, onChange) {
    var self = this
    var files = glob.sync(self.pluginsFolder + '*.js', {
      cwd: __dirname
    })
    var hasNewPlugin = false
    self.readPlugins()
    var olds = self.activePlugins
    self.activePlugins = []
    self.availablePlugins = []
    files.forEach(file => {
      var filePath = path.join(__dirname, file)
      var x = require(filePath)
      var willCall = true
      var index = _.findIndex(olds, function (o) {
        return o.name === x.name
      })

      if (index === -1) {
        hasNewPlugin = true
      } else {
        if (olds[index].enabled === false) {
          willCall = false
        }
      }
      if (willCall) {
        self.activePlugins.push({
          file: file,
          name: x.name,
          enabled: true
        })
        x.call(self, null, self)
      } else {
        self.availablePlugins.push({
          file: file,
          name: x.name
        })
      }
    })
    if (hasNewPlugin) {
      console.log('New plugin(s) detected. Saving plugins')
      this.writePlugins()
    }
  },
  readPlugins: function () {
    var self = this
    self.activePlugins = JSON.parse(fs.readFileSync(path.join(self.applicationDataFolder, 'plugins.json'), 'utf-8'))
  },
  writePlugins: function () {
    var self = this
    fs.writeFileSync(path.join(self.applicationDataFolder, 'plugins.json'), JSON.stringify(self.activePlugins))
  },
  init: function () {
    var self = this
    self.markets.init()
    self.markets.load()
  }
}
