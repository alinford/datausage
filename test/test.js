var request = require('supertest');
var express = require('express');

var app = require('../app.js');

describe('GET /', function() {
	it('respond with plain text', function(done) {
		request(app).get('/').expect(200, done);
	});
});