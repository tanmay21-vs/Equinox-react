import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { auth } from '../src/middleware/auth.js';

function invokeAuth(authorization) {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  let nextCalled = false;
  auth(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}

test('rejects a missing bearer token', () => {
  const { res, nextCalled } = invokeAuth(undefined);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(nextCalled, false);
});

test('rejects malformed and expired/invalid tokens', () => {
  process.env.JWT_SECRET = 'unit-test-secret';
  for (const header of ['Basic abc', 'Bearer not-a-jwt', `Bearer ${jwt.sign({ sub: 'user-1' }, 'different-secret')}`]) {
    const { res, nextCalled } = invokeAuth(header);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(nextCalled, false);
  }
});

test('accepts a valid bearer token and attaches its claims', () => {
  process.env.JWT_SECRET = 'unit-test-secret';
  const token = jwt.sign({ sub: 'user-123' }, process.env.JWT_SECRET, { expiresIn: '1m' });
  const { req, res, nextCalled } = invokeAuth(`Bearer ${token}`);
  assert.equal(nextCalled, true);
  assert.equal(req.user.sub, 'user-123');
  assert.equal(res.statusCode, 200);
});
