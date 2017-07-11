var Markets = require('./markets.js')
var _ = require('lodash')
var anydbsql = require('anydb-sql')
var fs = require('fs')
var glob = require('glob')
var path = require('path')
module.exports = {
  markets: null,
  database: null,
  databaseConnected: false,
  databaseSettings: {
    engine: null, // mysql, postgresql, sqlite (or sqlite3) etc.
    host: null, // localhost, 127.0.0.1
    database: null, // database_name
    username: null, // user name
    password: null, // password
    port: 0 // port
  },
  availablePlugins: [],
  activePlugins: [],
  applicationDataFolder: 'application_data/',
  pluginsFolder: 'plugins/',
  pluginsDataPath: null,
  databaseSettingsDataPath: null,
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
    self.pluginsDataPath = path.join(self.applicationDataFolder, 'plugins.json')
    self.databaseSettingsDataPath = path.join(self.applicationDataFolder, 'database_settings.json')
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
    if (!fs.existsSync(self.pluginsDataPath)) {
      self.writePlugins()
    }
    if (!fs.existsSync(self.databaseSettingsDataPath)) {
      self.writeDatabaseSettings()
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
      self.log('New plugin(s) detected. Saving plugins')
      self.writePlugins()
    }
  },
  initializeDatabase: function () {
    var self = this
    self.readDatabaseSettings()
    var driver = null
    switch (self.databaseSettings.engine) {
    case 'mysql':
      driver = 'mysql://' + self.databaseSettings.username
      if (!_.isNull(self.databaseSettings.password)) {
        driver += ':' + self.databaseSettings.password
      }
      driver += '@' + self.databaseSettings.host
      if (self.databaseSettings.port !== 3306) {
        driver += ':' + self.databaseSettings.port
      }
      driver += '/' + self.databaseSettings.database
      break
    default:
      self.log('Please correct database settings')
      return false
    }
    self.database = anydbsql({
      url: driver
    });
    self.databaseConnected = self.checkDatabaseConnection()
  },
  checkDatabaseConnection: function () {
    var self = this
    var testTable = self.database.define({
      name: 'test',
      columns: {
        id: {
          dataType: 'int'
        }
      }
    })
    self.database.query(testTable.create().ifNotExists().toQuery().text, function (err, result) {
      if (err !== null) {
        if (err.errno === 'ECONNREFUSED' || err.errno === 'ETIMEDOUT') {
          return false
        }
        self.log(err)
      }
    })
    return true
  },
  readPlugins: function () {
    var self = this
    self.activePlugins = JSON.parse(fs.readFileSync(self.pluginsDataPath, 'utf-8'))
  },
  writePlugins: function () {
    var self = this
    fs.writeFileSync(self.pluginsDataPath, JSON.stringify(self.activePlugins))
  },
  readDatabaseSettings: function () {
    var self = this
    self.databaseSettings = JSON.parse(fs.readFileSync(self.databaseSettingsDataPath, 'utf-8'))
  },
  writeDatabaseSettings: function () {
    var self = this
    fs.writeFileSync(self.databaseSettingsDataPath, JSON.stringify(self.databaseSettings))
  },
  init: function () {
    var self = this
    self.initializePlugins()
    self.initializeDatabase()
    self.markets.init()
    if (self.databaseConnected) {
      self.markets.on('market_pair_added', function (market, pair) {
        var publicTrades = self.database.define({
          name: _.kebabCase(market.name) + '_pt_' + pair.currency1.toLowerCase() + '_' + pair.currency2.toLowerCase(),
          columns: {
            date: {
              dataType: 'timestamp',
              notNull: true
            },
            tradeType: {
              dataType: 'int',
              notNull: true
            },
            rate: {
              dataType: 'double',
              notNull: true
            },
            amount: {
              dataType: 'double',
              notNull: true
            },
            total: {
              dataType: 'double',
              notNull: false
            }
          }
        })
        self.database.query(publicTrades.create().ifNotExists().toQuery().text)
      })
      self.markets.on('market_pair_tick', function (market, pair) {
        var publicTrades = self.database.define({
          name: _.kebabCase(market.name) + '_pt_' + pair.currency1.toLowerCase() + '_' + pair.currency2.toLowerCase(),
          columns: {
            date: {
              dataType: 'timestamp',
              notNull: true
            },
            tradeType: {
              dataType: 'int',
              notNull: true
            },
            rate: {
              dataType: 'double',
              notNull: true
            },
            amount: {
              dataType: 'double',
              notNull: true
            },
            total: {
              dataType: 'double',
              notNull: false
            }
          }
        })
        var tx = self.database.begin()
        _.each(pair.publicTrades, function (order) {
          publicTrades.insert(publicTrades.date.value(order.timestamp), publicTrades.tradeType.value(order.tradeType === 'sell' ? 0 : 1), publicTrades.rate.value(order.rate), publicTrades.amount.value(order.amount), publicTrades.total.value(order.total)).execWithin(tx)
        })
        tx.commit()
      })
    }
    self.markets.load()
  }
}
