var express = require('express');
var router = express.Router();
var debug = require('debug')('datausage:routes');
var passport = require('passport');


router.get('/', passport.authenticate('bearer', {session: false}), function(req, res) {
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

module.exports = router;
