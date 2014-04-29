var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mainRoute = require('./routes/index');
var authRoute = require('./routes/auth');
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;

var monk = require('monk');
var db = monk('localhost/datausagetest1');

passport.use(new BearerStrategy(
	function(token, done) {
		/* User.findOne({ token: token}, function (err, user) {
			if (err) {return done(err);}
			if (!user) {return done(null, false);}
			return done(null, user, {scope: 'read'});
		});
		 */
	}
));

var app = express();

app.use(logger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next) {
	req.db=db;
	next();
});

app.use('/api/v1/datausage', mainRoute);
app.use('/api/v1/auth', authRoute);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send('error', {
            message: err.message,
            error: err
        });
    });
} else {
	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.send('error', {
			message: err.message,
			error: {}
		});
	});
}

module.exports = app;
