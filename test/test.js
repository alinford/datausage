var request = require('supertest');
var express = require('express');
var should = require('should');

var app = require('../app.js');

describe('GET /datausage', function() {
	it('responds with json', function (done) {
		request(app).get('/api/v1/datausage')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200, done);
	});
});

describe('POST /auth/request', function() {
	it('responds with error if no gsm number present', function(done) {
		request(app).post('/api/v1/datausage/auth/request')
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
		request(app).post('/api/v1/datausage/auth/request')
			.set('Content-Type', 'application/json')
			.send({gsmnumber: 07408867211})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err);
				done();
			});
	});
});