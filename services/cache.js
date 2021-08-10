const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const redisUrl = 'redis://localhost:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key || '');
	return this;
};

mongoose.Query.prototype.exec = async function () {
	if (!this.useCache) {
		return exec.apply(this, arguments);
	}

	const key = JSON.stringify(
		Object.assign({}, this.getQuery(), {
			collection: this.mongooseCollection.name,
		})
	);

	// See if we have a value for a key in redis
	const cachedValue = await client.hget(this.hashKey, key);

	// If we do, return that
	if (cachedValue) {
		return JSON.parse(cachedValue);
	}
	// Otherwise, issue the query to the mongoDB and store the result in the redis

	const result = await exec.apply(this, arguments);
	client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);
	return result;
};

module.exports = {
	clearHash(hashKey) {
		client.del(JSON.stringify(hashKey));
	},
};
