var request = require('supertest');
var express = require('express');

var app = require('../app.js');

describe('GET /', function() {
	it('respond with plain text', function(done) {
		request(app).get('/api/v1').expect(200, done);
	});
});

describe('GET /datausage', function() {
	it('respond with json', function(done) {
		request(app).get('/api/v1/datausage')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200,done);
	});
});