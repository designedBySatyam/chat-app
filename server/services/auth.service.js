const crypto = require('crypto');

const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_DIGEST = 'sha512';

function createPasswordSecret(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString('hex');

  return {
    passwordSalt: salt,
    passwordHash: hash,
  };
}

function verifyPassword(password, salt, hash) {
  if (!password || !salt || !hash) return false;

  const expected = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(hash, 'hex');
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  createPasswordSecret,
  verifyPassword,
  createSessionToken,
};
