var express = require('express');
var router = express.Router();
var debug = require('debug')('datausage:routes');
var request = require('superagent');
var Chance = require('chance');


router.get('/', function(req, res) {
	debug('getting summary');
	var db = req.db;
	var collection = db.get('datausage');
	collection.find({},{},function(e,docs) {
		if(e) {
			res.send(e);
		}
		res.json(docs);
	});
});

router.post('/auth/request', function(req, res) {
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
				}
			})
		res.send(200, {msg: "PIN sent"});
	}

});

router.post('/auth/verify', function(req, res) {
	if(!req.body.pin) {
		res.send(new Error());
	} else {
		// search for all entries for gsm number from awaitingVerification table.
		// compare submitted pin with all pin's generated for that gsm number.
		// Error() or oauth2ify() with passport.js bearer token if any pin's match.
		// remove all entries for that gsm number from awaitingVerification collection.
		res.send(req.body.pin);
	}
});

module.exports = router;
