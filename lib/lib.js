var _ = require('lodash')
var CryptoJS = require('crypto-js')
module.exports = {
  toSatoshi: function (number) {
    return parseFloat(number).toFixed(8)
  },
  calcBuyable: function (rate, fund, currencyDecimal) {
    return _.round(fund / rate, 8) - (1 / Math.pow(10, currencyDecimal))
  },
  calcBuyable2: function (amount, fee, currencyDecimal) {
    return _.round(amount - (amount / 100 * fee), currencyDecimal)
  },
  aesEncrypt: function(text, salt) {
    return CryptoJS.AES.encrypt(text, salt).toString()
  },
  aesDecrypt: function(text, salt) {
    return CryptoJS.AES.decrypt(text, salt).toString(CryptoJS.enc.Utf8)
  }
}
