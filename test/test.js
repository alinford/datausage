var request = require('supertest');
var express = require('express');
var should = require('should');

var app = require('../app.js');

var cached_pin = "";

describe('GET /datausage', function() {
	it('responds with unauthorized', function (done) {
		request(app).get('/api/v1/datausage')
			.set('Accept', 'application/json')
			.set('token', 'a6d6s6f5d')
			.expect(401, done);
	});
});

describe('POST /auth/request', function() {
	it('responds with error if no gsm number present', function(done) {
		request(app).post('/api/v1/auth/request')
			.set('Content-Type', 'application/json')
			.send({foo: 'bar'})
			.expect(400)
			.end(function(err, res) {
				should.not.exist(err);
				res.body.should.have.property("msg", "missing GSM number in request");
				done();
			});
	});

	it ('responds with 200 if gsm number is present', function(done) {
		request(app).post('/api/v1/auth/request')
			.set('Content-Type', 'application/json')
			.send({gsmnumber: 447408867211})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err);
				res.body.should.have.property("pin");
				cached_pin = res.body.pin;
				done();
			});
	});
});

describe('POST /auth/verify', function() {
	it('responds with error if no PIN present in request', function(done) {
		request(app).post('/api/v1/auth/verify')
			.set('Content-Type', 'application/json')
			.send({foo: 'bar'})
			.expect(400)
			.end(function(err, res) {
				should.not.exist(err);
				res.body.should.have.property('msg', "missing PIN in request");
				done();
			});
	});

	it('responds with 200 if PIN is verified correctly', function(done) {
		request(app).post('/api/v1/auth/verify')
			.set('Content-Type', 'application/json')
			.send({gsmnumber: 447408867211, pin: cached_pin})
			.expect(200)
			.end(function(err, res) {
				should.not.exist(err);
				res.body.should.have.property("token");
				done();
			});
	});
});