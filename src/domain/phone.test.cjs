const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizePalestinianPhone } = require('./phone.cjs')

test('normalizes supported Palestinian mobile formats', () => {
  assert.equal(normalizePalestinianPhone('0599 123 456'), '+970599123456')
  assert.equal(normalizePalestinianPhone('+970 599 123 456'), '+970599123456')
  assert.equal(normalizePalestinianPhone('00970-599-123-456'), '+970599123456')
})

test('rejects unsupported and malformed phone numbers', () => {
  assert.throws(() => normalizePalestinianPhone('1234'), /valid Palestinian mobile/)
  assert.throws(() => normalizePalestinianPhone('0521234567'), /valid Palestinian mobile/)
})
