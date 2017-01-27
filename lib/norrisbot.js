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
	this.on('start', this._onStart);
	this.on('message', this._onMessage);
};

// _onStart
// ==============================================
NorrisBot.prototype._onStart = function() {
	this._loadBotUser();
	this._connectDb();
	this._firstRunCheck();
};


// Download list of Slack group users. Save as an array of objects called "users"
NorrisBot.prototype._loadBotUser = function() {
	
	// Find object inside array with same username as Chuck Norris bot
	var self = this;
	this.user = this.users.filter(function(user) {
		return user.name === self.name;
	})[0];
};


NorrisBot.prototype._connectDb = function() {

	// Check if database file exists
	if (!fs.existsSync(this.dbPath)) {
		console.error('Database path ' + '"' + this.dbPath + '" does not exist or it\'s not readable.');
		process.exit(1);
	}
	// Create new SQLite database instance
	this.db = new SQLite.Database(this.dbPath);
};


NorrisBot.prototype._firstRunCheck = function() {
	var self = this;
	self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function(err, record) {
		if (err) {
			return console.error('DATABASE ERROR:', err);
		}

		var currentTime = (new Date()).toJSON();

		// This is a first run
		if (!record) {
			self._welcomeMessage();
			return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
		}

		// Updates with new last running time
		self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
	});
};

NorrisBot.prototype._welcomeMessage = function() {
	this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
};


// _onMessage
// ==============================================
NorrisBot.prototype._onMessage = function(message) {
	if (this._isChatMessage(message) &&
		this._isChannelConversation(message) &&
		!this._isFromNorrisBot(message) &&
		this._isMentioningChuckNorris(message)
		) {
		this._replyWithRandomJoke(message);
	}
};

// Real time API messages include any events within Slack group, not just chat messages
NorrisBot.prototype._isChatMessage = function(message) {
	return message.type === 'message' && Boolean(message.text); // Check if API message is a chat message containing text
};

// Channels include any communication, not just public chat channels
NorrisBot.prototype._isChannelConversation = function(message) {
	return typeof message.channel === 'string' &&
		message.channel[0] === 'C'; // Check if channel is a "C," or a chat channel
};

// Check if message is from Norris bot. Avoid infinite loop of jokes, since many jokes contain string "Chuck Norris." 
NorrisBot.prototype._isFromNorrisBot = function(message) {
	return message.user === this.user.id;
};

// Check if message mentions Chuck Norris or the bot's name
NorrisBot.prototype._isMentioningChuckNorris = function(message) {
	return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
		message.text.toLowerCase().indexOf(this.name) > -1;
};

// Get random joke from database
NorrisBot.prototype._replyWithRandomJoke = function(originalMessage) {
	var self = this;
	self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function(err, record) {
		if (err) {
			return console.error('DATABASE ERROR:', err);
		}

		var channel = self._getChannelById(originalMessage.channel);
		self.postMessageToChannel(channel.name, record.joke, {as_user: true});
		self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
	});
};

// Get channel name given its ID
NorrisBot.prototype._getChannelById = function(channelId) {
	return this.channels.filter(function(item) {
		return item.id === channelId;
	})[0];
};

module.exports = NorrisBot;