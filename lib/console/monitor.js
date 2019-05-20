/*global clean:true */
var lib = require('../lib.js')
var stringWidth = require('string-width')
var _ = require('lodash')
var chalk = require('chalk')
var {
  table,
  getBorderCharacters
} = require('table')

var cb, vorp, app_
var nl = '\n'
var interval = 1000
var timer = null
var market_index = 0
var pair_index = 0
var in_mode = 0

function monitorKeypress(ch, key) {
  switch (key.name) {
  case 'c':
    stopTimer()
    process.stdin.removeListener('keypress', monitorKeypress)
    // vorp.ui.delimiter('Calculate:')
    // vorp.ui.redraw.done()
    in_mode = 1
    vorp.show()
    vorp.exec('calc')
      .then(function (a) {
        console.log('aaaa' + a);
      })
    cb()

    break;
  case 'escape':
    switch (in_mode) {
    case 1:
      in_mode = 0
      startTimer()
      draw()
      break;
    case 0:
      process.stdin.removeListener('keypress', monitorKeypress)
      stopTimer()
      vorp.ui.redraw.clear()
      vorp.ui.redraw.done()
      vorp.show()
      cb()
    }
    break
  case 'm':
    market_index++
    if (market_index >= app_.markets.markets.length) {
      market_index = 0
    }
    pair_index = 0
    break
  case 'p':
    pair_index++
    if (pair_index >= app_.markets.markets[market_index].pairs.length) {
      pair_index = 0
    }
    break

  }
  switch (key.sequence) {
  case '[':
    if (interval > 1000) {
      interval -= 1000
      stopTimer()
      startTimer()
      draw()
    }
    break
  case ']':
    if (interval < 10000) {
      interval += 1000
      stopTimer()
      startTimer()
      draw()
    }
    break
  }
}

function drawHorizontal(index, size) {
  return index === 0 || index === 1 || index === size
}

function draw() {
  // vorp.ui.redraw.clear()
  // vorp.ui.redraw.done()
  var out = ''
  // clean()
  var orders = []
  var balances = []
  var asks = []
  var bids = []
  _.forEach(app_.markets.markets, function (market, mi) {
    _.forEach(market.pairs, function (pair, pi) {
      _.forEach(pair.myOrders, function (order) {
        var o = []
        o.push(market.name)
        o.push(pair.currency2.toUpperCase() + '/' + pair.currency1.toUpperCase())
        o.push(order.id)
        o.push(order.rate)
        o.push(order.amount)
        o.push(order.tradeType)
        orders.push(o)
      })
      if (mi == market_index && pi == pair_index) {
        var oi, max
        max = pair.depthAsks.length
        if (max > 10) {
          max = 10
        }
        oi = 0
        while (oi < max) {
          var order = pair.depthAsks[oi]
          asks.push([oi + 1, order.rate, order.amount, order.total])
          oi++
        }
        oi = 0
        max = pair.depthBids.length
        if (max > 10) {
          max = 10
        }
        while (oi < max) {
          order = pair.depthBids[oi]
          bids.push([oi + 1, order.rate, order.amount, order.total])
          oi++
        }
        asks = arrayPrefixate(asks, 3, pair)
        asks = arrayPrefixate(asks, 1, pair)
        asks = arrayPrefixate(asks, 2, pair)
        bids = arrayPrefixate(bids, 3, pair)
        bids = arrayPrefixate(bids, 1, pair)
        bids = arrayPrefixate(bids, 2, pair)
        // bids = arrayPrefixate(bids, 2)
      }
    })
    var currencies = market.getMyPairCurrencies()
    var hidezero = true
    _.each(currencies, function (currency) {
      if (!hidezero || (hidezero && market.balancesAll[currency] > 0)) {
        var n = []
        n.push(market.name)
        n.push(currency.toUpperCase())
        n.push(lib.toSatoshi(market.balancesInPockets[currency]))
        n.push(lib.toSatoshi(market.balancesOnOrders[currency]))
        n.push(lib.toSatoshi(market.balancesAll[currency]))
        balances.push(n)
      }
    })
  })
  var config = {
    drawHorizontalLine: drawHorizontal
  }
  orders.unshift(['Market', 'Pair', 'Order ID', 'Rate', 'Amount', 'Type'])
  var table1 = headerTable(table(orders, config), 'ACTIVE ORDERS')
  balances.unshift(['Market', 'Currency', 'Available', 'On Orders', 'Total'])
  var table2 = headerTable(table(balances, config), 'BALANCES')
  asks.unshift(['#', 'Rate', 'Amount', 'Total'])
  var table3 = headerTable(table(asks, config), 'ASKS')
  bids.unshift(['#', 'Rate', 'Amount', 'Total'])
  var table4 = headerTable(table(bids, config), 'BIDS')

  out += chalk.redBright('ESC') + ': Exit from monitor.' + nl
  if (app_.markets.markets.length > 1) {
    out += chalk.redBright('M') + ': Change market.' + chalk.yellow('(Current: ' + app_.markets.markets[market_index].name + ')') + nl
  }
  if (app_.markets.markets[market_index].pairs.length > 1) {
    out += chalk.redBright('P') + ': Change pair.' + chalk.yellow('(Current: ' + app_.markets.markets[market_index].pairs[pair_index].currency2.toUpperCase() + '/' + app_.markets.markets[market_index].pairs[pair_index].currency1.toUpperCase() + ')') + nl
  }
  if (interval > 1000) {
    out += chalk.redBright('[') + ': Decrease interval.' + chalk.yellow('(Current: ' + (interval / 1000) + 's)') + nl
  }
  if (interval < 10000) {
    out += chalk.redBright(']') + ': Increase interval.' + chalk.yellow('(Current: ' + (interval / 1000) + 's)') + nl
  }
  out += chalk.redBright('C') + ': Calculate' + nl
  out += nl
  out += mergeTables(table1, table2)
  out += mergeTables(table3, table4)

  vorp.ui.redraw(out)
}

module.exports = function (vorpal, app) {
  vorpal.command('monitor', 'Monitorize')
    .action(function (args, callback) {
      app_ = app
      clean()
      vorp = vorpal
      vorp.hide()
      cb = callback
      startTimer()

      process.stdin.on('keypress', monitorKeypress)
      process.stdin.setRawMode(true)
      process.stdin.resume()
    })
}

function arrayPrefixate(arr, index, pair) {
  var ml = 0
  var tl
  _.forEach(arr, function (v) {
    tl = stringWidth(_.toString(_.floor(v[index])))
    if (tl > ml) {
      ml = tl
    }
  })
  _.forEach(arr, function (v, vi) {
    tl = stringWidth(_.toString(_.floor(v[index])))
    var n = _.toString(parseFloat(v[index]))
    var t = n.split('.')
    if (tl < ml) {
      n = chalk.gray(_.repeat('0', ml - tl)) + n
    }
    if (t.length == 1) {
      if (parseInt(t[1]) > 0) {
        n += '.'
      } else {
        n += chalk.gray('.')
      }
    }
    // t[1] = t[1].trimEnd(0)
    n += chalk.gray(_.repeat('0', t.length == 1 ? 8 : (8 - stringWidth(t[1]))))
    arr[vi][index] = n
  })
  return arr
}

function stopTimer() {
  clearInterval(timer)
}

function startTimer() {
  timer = setInterval(draw, interval)
}

function mergeTables(table1, table2) {
  var table1w = stringWidth(table1.split(nl)[0])
  var table2w = stringWidth(table2.split(nl)[0])
  var maxw = process.stdout.columns
  if (table1w + table2w + 2 < maxw) {
    var ret = ''
    var table1l = table1.split(nl)
    var table2l = table2.split(nl)
    var table1ll = table1l.length - 1
    var table2ll = table2l.length - 1
    var isTable1g = table1ll > table2ll
    var maxl = isTable1g ? table1l.length : table2l.length
    var li = 0
    for (li = 0; li < maxl; li++) {
      var l = ''
      if (li < table1ll) {
        l += table1l[li]
        l += _.repeat(' ', 2)
      } else {
        l += _.repeat(' ', table1w + 2)
      }
      if (li < table2ll) {
        l += table2l[li]
      }
      ret += l + nl
    }
    return ret
  } else {
    return table1 + nl + table2
  }
}

function headerTable(table_string, title) {
  var def = getBorderCharacters('honeywell')
  var tablew = stringWidth(table_string.split(nl)[0])
  var titlew = stringWidth(title)
  var lines = []
  var leftSpace = _.floor((tablew - titlew - stringWidth(def.bodyLeft)) / 2)
  var rightSpace = _.floor((tablew - titlew - stringWidth(def.bodyLeft) - stringWidth(def.bodyRight)) / 2)

  var line = ''
  line += def.topLeft
  line += _.repeat(def.topBody, tablew - stringWidth(def.topLeft) - stringWidth(def.topRight))
  line += def.topRight
  lines.push(line)

  line = def.bodyLeft
  if (false) {
    line += ' '
    line += chalk.black.bgWhite.bold(_.repeat(' ', leftSpace - 1))
  } else {
    line += _.repeat(' ', leftSpace - 1)
  }
  if (false) {
    line += chalk.black.bgWhite.bold(title)
  } else {
    line += chalk.black.bgWhite.bold(' ' + title + ' ')
  }
  if (false) {
    line += chalk.black.bgWhite.bold(_.repeat(' ', rightSpace - 1))
    line += ' '
  } else {
    line += _.repeat(' ', rightSpace - 1)
  }
  line += def.bodyRight
  lines.push(line)

  line = def.bottomLeft
  line += _.repeat(def.bottomBody, tablew - stringWidth(def.bottomLeft) - stringWidth(def.bottomRight))
  line += def.bottomRight
  lines.push(line)

  return _.join(lines, nl) + nl + table_string
}