const winston = require('winston');
var pmongo = require('promised-mongo');
const MongoClient = require('mongodb').MongoClient;
const Promise = require('bluebird');
const request = require('request');
const ObjectID = require('mongodb').ObjectID;

var runWait = 5000;

function sendScenarioRequests(dbUrl, sidList) {
	winston.info(`Play Now Request on ${dbUrl}`);

	return new Promise(function (resolve, reject) {
		// var db = pmongo(dbUrl);
		var scenarioIdList = [];

		// docs is an array of all the documents in mycollection 
		var req_num = 0;

		return synchronousLoop(function () {
			// Condition for stopping
			return req_num < sidList.length;
		}, function () {
			// The function to run, should return a promise
			return new Promise(function (resolve, reject) {
				// Arbitrary 250ms async method to simulate async process
				setTimeout(function () {

					var obj = sidList[req_num];
					console.log(obj);

					request('http://localhost:8090/playNow/' + obj, function (error, response, body) {
						if (!error) {
							console.log("body" + body);
							scenarioIdList.push(obj);
							resolve(obj);
						}
					});
					req_num++;

				}, 1000);
			});
		}).then(() => {
			console.log("finish send all requests");
			resolve(scenarioIdList);
		});

	})
}

function waitAllRuns(dbUrl, scenarioIdList) {
	winston.info(`Play Now Request on ${dbUrl}`);

	return new Promise(function (resolve, reject) {
		var db = pmongo(dbUrl);

		// generate object id list
		var objectIdList = [];
		for (var i = 0; i < scenarioIdList.length; i++) {
			var id = new ObjectID(scenarioIdList[i].toString());
			objectIdList.push(id);
		}

		var run_num = 0;
		var runs;
		return synchronousLoop(function () {
			// Condition for stopping
			console.log("run_num: " + run_num);
			return run_num < objectIdList.length;
		}, function () {
			// The function to run, should return a promise
			return new Promise(function (resolve, reject) {

				// Arbitrary 5000ms async method to simulate async process
				setTimeout(function () {

					// get first elements for ids in objectIdList
					MongoClient.connect(dbUrl)
						.then(db => {
							db.collection('run', (err, runCollection) => {
								if (err) {
									db.close();
									winston.error(err);
								} else {
									runCollection.find({ sid: { $in: objectIdList } }).toArray()
										.then(function (founds) {
											// docs is an array of all the documents in mycollection 
											console.log("find " + founds.length + " runs.");
											console.log(founds);

											run_num = founds.length;
											runs = founds;
											db.close();
											resolve();
										}).catch((err) => {
											console.log(err);
											console.log("not yet find all runs");
											run_num = 0;
											reject("not yet find all runs");
											db.close();
										})
								}
							});
						}).catch(err => {
							winston.error(err);
						});

				}, runWait);
			});
		}).then(() => {
			console.log("finish run now");

			resolve(runs);
		});;


	})
}

function synchronousLoop(condition, action) {
	var resolver = Promise.defer();

	var loop = function () {
		if (!condition()) return resolver.resolve();
		return Promise.cast(action())
			.then(loop)
			.catch(resolver.reject);
	};

	process.nextTick(loop);

	return resolver.promise;
};

exports.sendScenarioRequests = sendScenarioRequests;
exports.waitAllRuns = waitAllRuns;