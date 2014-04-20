var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.send('index');
});

router.get('/datausage', function(req, res) {
	var db = req.db;
	var collection = db.get('datausage');
	collection.find({},{},function(e,docs) {
		res.send('datausage', {
			"datausage": docs
		});
	});
});

module.exports = router;
