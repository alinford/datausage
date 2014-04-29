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

module.exports = router;
