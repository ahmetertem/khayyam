"use strict";
const _ = require('lodash');
const fs = require('fs');
const glob = require('glob');
const Pair = require('./pair.js');
var EventEmitter = require('events')
	.EventEmitter;
/*
 *	- Available Events:
 *		- add_available_market
 *		- initialized
 *		- saved
 *		- loaded
 *		- error (*fireable from market and self*)
 *		- market_pair_added (*fires from market*)
 *		- market_added
 *		- market_removed
 */
function markets() {
	EventEmitter.call(this);
	this.markets = [];
	this.available_markets = [];
	this.markets_directory = './markets/';
	this.settings_file_path = null;
	this.init = function() {
		//
		// cwd option must be set because
		// glob's default cwd is process's
		// directory
		//
		let files = glob.sync(this.markets_directory + "*.js", {
			cwd: __dirname
		});
		files.forEach(file => {
			let market = require(file);
			this.available_markets.push(market);
			this.emit('add_available_market', market.prototype.constructor.name);
		});
		this.emit('initialized');
	};
	this.load = function() {
		let json = JSON.parse(fs.readFileSync(this.settings_file_path, 'utf-8'))
		let self = this;
		_.forEach(json, function(value) {
			if (self.add(value.name, value.api_key, value.api_secret, {
					save: false
				})) {
				let market_last_index = self.markets.length - 1;
				_.forEach(value.pairs, function(pair) {
					self.markets[market_last_index].add_pair(pair.currency1, pair.currency2, {
						programmed: true
					});
					let pair_last_index = self.markets[market_last_index].pairs.length - 1;
					self.markets[market_last_index].pairs[pair_last_index].settings = _.merge(self.markets[market_last_index].pairs[pair_last_index].settings, pair.settings);
				});
			}
		});
		this.emit('loaded');
	};
	this.save = function() {
		var list = [];
		_.forEach(this.markets, function(value, key) {
			let pairs = [];
			_.forEach(value.pairs, function(pair) {
				// let pair_new = pair;
				let pair_new = {};
				pair_new.currency1 = pair.currency1;
				pair_new.currency2 = pair.currency2;
				pair_new.settings = pair.settings;
				pairs.push(pair_new);
			});
			list.push({
				name: value.name,
				api_key: value.api_key,
				api_secret: value.api_secret,
				pairs: pairs
			});
		});
		fs.writeFileSync(this.settings_file_path, JSON.stringify(list));
		this.emit('saved');
	};
	this.add = function(market_name, api_key, api_secret, args) {
		args = _.merge({
			save: true
		}, args);
		market_name = _.trim(market_name);
		api_key = _.trim(api_key);
		api_secret = _.trim(api_secret);
		let market = _.find(this.available_markets, function(o) {
			let x = new o();
			return x.name.toLowerCase() === market_name.toLowerCase();
		});
		if (market === undefined) {
			this.emit('error', 'Market is not found named with `' + market_name + '`');
			return false;
		}
		var self = this;
		let market_ = new market(api_key, api_secret);
		market_.on('error', function(error) {
			self.emit('error', error);
		});
		market_.on('pair_added', function(pair, args) {
			if (!args.programmed) {
				self.save();
			}
			self.emit('market_pair_added', this, pair, args);
		});
		//
		// initialize pairs' JSON files
		//
		let files = glob.sync(this.markets_directory + market_name + "/*.json", {
			cwd: __dirname
		});
		files.forEach(file => {
			let pair = require(file);
			if (_.isArray(pair)) {
				_.forEach(pair, function(value) {
					market_.available_pairs.push(value);
				});
			} else {
				market_.available_pairs.push(pair);
			}
		});
		this.markets.push(market_);
		if (args.save) {
			this.save();
		}
		this.emit('market_added');
		return true;
	};
	this.remove_at_index = function(index) {
		this.markets = _.remove(this.markets, index);
		this.save();
		this.emit('market_removed');
	};
}
markets.prototype.__proto__ = EventEmitter.prototype;
module.exports = markets;
