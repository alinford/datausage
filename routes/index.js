var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.send('token: ' + req.query.t);
});

router.get('/datausage', function(req, res) {
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
