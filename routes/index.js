var express = require('express');
var router = express.Router();
var debug = require('debug')('datausage:routes');


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
		res.send(400, {error: "missing GSM number in request"})
	} else {
		// generate pin and send nexmo sms POST
		// store pin and gsm number and timestamp if successful. cascade error/success reports
		res.send("success");
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
})

module.exports = router;
