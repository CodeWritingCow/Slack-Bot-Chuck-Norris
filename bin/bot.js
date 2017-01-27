'use strict';

var NorrisBot = require('../lib/norrisbot');

var token = process.env.BOT_API_KEY || require('../token');
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var norrisbot = new NorrisBot({
	token: token,
	dbPath: dbPath,
	name: name
});

console.log('Running Norris Bot');
norrisbot.run();
console.log('Ran Norris Bot');