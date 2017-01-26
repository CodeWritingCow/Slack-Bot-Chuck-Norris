'use strict';

var util = require('util'),
	path = require('path'),
	fs = require('fs'),
	SQLite = require('sqlite3').verbose,
	Bot = require('slackbots');

var NorrisBot = function Constructor(settings) {
	
	this.settings = settings;
	this.settings.name = this.settings.name || 'norrisbot';
	this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'norrisbot.db') ;
	this.user = null;
	this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(NorrisBot, Bot);

NorrisBot.prototype.run = function() {
	NorrisBot.super_.call(this, this.settings);
	
	// TODO: Write _onStart and _onMessage
	this.on('start', this._onStart);
	this.on('message', this._onMessage);
};

module.exports = NorrisBot;