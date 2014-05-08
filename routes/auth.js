var express = require('express');
var router = express.Router();
var debug = require('debug')('datausage:routes');
var request = require('superagent');
var Chance = require('chance');
var chance = new Chance();
var crypto = require('crypto');


router.post('/request', function(req, res) {
	if(!req.body.gsmnumber) {
		res.send(400, {msg: "missing GSM number in request"})
	} else {
		// generate pin and send nexmo sms POST
		// store pin and gsm number and timestamp if successful. cascade error/success reports
		// store gsm number in msisn collection with .save() - for POC only
		var pin = chance.pad(chance.integer({min: 0001, max: 9999}), 4);
		var payload = {
			api_key: "0276452d",
			api_secret: "e31d139a",
			from: "Truphone",
			to: req.body.gsmnumber,
			text: pin
		};
		request.post('https://rest.nexmo.com/sms/json')
			.set('Content-Type', 'application/json')
			.send(payload)
			.end(function(post_res){
				if (post_res.error) {
					debug('error contacting nexmo: '+post_res.error.message);
					res.send(400, {msg: "error sending SMS"});
				} else {
					var db = req.db;
					var collection = db.get('awaitingVerification');
					var p = collection.insert({gsmnumber: req.body.gsmnumber, pin: pin, date: new Date()});
					p.on('error', function(err) {
						debug('cannot insert PIN to db!');
						res.send(400, {msg: "cannot insert PIN to DB"});
					});
					p.on('success', function(doc) {
						debug('PIN stored in db');
						res.send(200, {msg: "PIN sent", pin: pin});
					});
				}
			});
		var db = req.db;
		var userCollection = db.get('msisdns');
		userCollection.update(
			{ msisdn: req.body.gsmnumber },
			{
				msisdn: req.body.gsmnumber,
				token: "none"
			},
			{ upsert: true }
		)
			.error(function(err) {
				debug('could not execute findAndModify the user collection for gsmnumber: ' + req.body.gsmnumber);
			})
			.success(function(doc) {
				debug('found and updated ' + doc + ' document');
			});
	}

});

router.post('/verify', function(req, res) {
	if(!req.body.pin) {
		res.send(400, {msg: "missing PIN in request"});
	} else if(!req.body.gsmnumber) {
		res.send(400, {msg: "missing GSM number in request"});
	} else {
		// search for all entries for gsm number from awaitingVerification table.
		// compare submitted pin with all pin's generated for that gsm number.
		// issue token and store token in user collection if there is a match.
		// remove all entries for that gsm number from awaitingVerification collection.
		var db = req.db;
		var pinCollection = db.get('awaitingVerification');
		var p = pinCollection.findOne({pin: req.body.pin, gsmnumber: req.body.gsmnumber});
		p.on('success', function(doc) {
			if(!doc) {
				debug('PIN not found');
				res.send(400, {msg: "no recent PIN found for that GSM number"});
			} else {
				debug('PIN found! ' + doc.pin);
				//TODO: enforce recent matches only
				try {
					var buf = crypto.randomBytes(32);
					debug('have %d of random data: %s', buf.length, buf);
				} catch (ex) {
					// TODO handle error
				}
				var token = buf.toString('hex');
				res.send(200, {msg: "verified", token: token});
				var p2 = pinCollection.remove({gsmnumber: req.body.gsmnumber});
				p2.on('success', function (doc) {
					debug('removed all entries for gsmnumber: ' + req.body.gsmnumber + ' from awaitingVerification collection');
				});
				p2.on('error', function(err) {
					debug('could not remove PIN from db');
				});
				var userCollection = db.get('msisdns');
				userCollection.update(
					{ msisdn: req.body.gsmnumber },
					{
						msisdn: req.body.gsmnumber,
						token: token
					}
				)
					.error(function(err) {
						debug('could not execute update() on the user collection for gsmnumber: ' + req.body.gsmnumber);
					})
					.success(function(doc) {
						debug('found and updated ' + doc + ' document');
					});

				// clean db, generate test data, and write to db
				var usageCollection = db.get('datausage');
				usageCollection.remove(
					{unique_id: req.body.gsmnumber.toString()}
				)
					.error(function(err) {
						debug("could not remove test data from db");
					})
					.success(function(wr) {
						debug("found and removed " + wr + " documents");
					});

				var testData = makeTestData(req.body.gsmnumber);
				debug("test data is: " + JSON.stringify(testData));
				usageCollection.insert(
					testData
				)
					.error(function(err) {
						debug("could not insert test data");
					})
					.success(function(wr) {
						debug("inserted " + wr + " documents");
					});
			}
		});
		p.on('error', function(err) {
			debug('Could not query db for PIN');
			res.send(400, {msg: "Service unavailable, try again soon"});
		});
	}
});

function makeTestData(gsmnumber) {
	var template = {};
	var res = [];
	for (var i = 90; i > 0; i--) {

		// build variable data
		var date = new Date();
		date.setDate(date.getDate() - i);
		var bundle = chance.floating({min: 0, max: 200, fixed: 2});
		var roaming = chance.floating({min: 0, max: 30, fixed: 2});
		var out_of_bundle = chance.floating({min: 0, max: 50, fixed: 2});

		var billing_start_date = new Date(date.getFullYear(), date.getMonth(), 1);
		var billing_end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);

		// populate template
		template.date = date;
		template.unique_id = gsmnumber;
		template.usage = {
			"bundle": bundle,
			"roaming": roaming,
			"out_of_bundle": out_of_bundle
		};
		template.bundle_limit = 5000;
		template.billing_start_date = billing_start_date;
		template.billing_end_date = billing_end_date;
		template.out_of_bundle_limit = 250;
		template.roaming_limit = 250;

		// complete pass on loop
		res.unshift(template);
		template = {};
	}
	return res;
}

module.exports = router;