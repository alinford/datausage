var express = require('express');
var router = express.Router();
var debug = require('debug')('datausage:routes');
var request = require('superagent');
var Chance = require('chance');
var crypto = require('crypto');


router.post('/request', function(req, res) {
	if(!req.body.gsmnumber) {
		res.send(400, {msg: "missing GSM number in request"})
	} else {
		// generate pin and send nexmo sms POST
		// store pin and gsm number and timestamp if successful. cascade error/success reports
		var chance = new Chance();
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
		// Error() or oauth2ify() with passport.js bearer token if any pin's match.
		// remove all entries for that gsm number from awaitingVerification collection.
		var db = req.db;
		var collection = db.get('awaitingVerification');
		var p = collection.findOne({pin: req.body.pin, gsmnumber: req.body.gsmnumber});
		p.on('success', function(doc) {
			debug('PIN found! ' + doc.pin);
			//TODO: enforce recent matches only
			var token = "";
			try {
				var buf = crypto.randomBytes(32);
				debug('have %d of random data: %s', buf.length, buf);
			} catch (ex) {
				// TODO handle error
			}
			token = buf.toString('hex');
			res.send(200, {token: token});
		});
		p.on('error', function(err) {
			debug('PIN not found');
			res.send(400, {msg: "no recent PIN found for that GSM number"});
		});
	}
});

module.exports = router;