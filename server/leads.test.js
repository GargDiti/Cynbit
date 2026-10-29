import test from 'node:test'
import assert from 'node:assert/strict'
import { budgets, services, timelines, validateLead } from './leads.js'

const validLead = {
  name: '  Asha Mehta  ',
  email: ' ASHA@EXAMPLE.COM ',
  phone: '+91 98765 43210',
  service: services[0],
  budget: budgets[0],
  timeline: timelines[0],
  message: '  I need help with an automation project.  ',
}

test('trims fields and normalizes email', () => {
  const result = validateLead(validLead)
  assert.deepEqual(result.errors, {})
  assert.equal(result.value.name, 'Asha Mehta')
  assert.equal(result.value.email, 'asha@example.com')
  assert.equal(result.value.message, 'I need help with an automation project.')
})

test('requires name, valid email, service, budget, timeline, and message lengths', () => {
  const result = validateLead({ ...validLead, name: 'A', email: 'bad', message: 'short' })
  assert.deepEqual(Object.keys(result.errors).sort(), ['email', 'message', 'name'])
  assert.match(result.errors.email, /valid email/)
  assert.match(result.errors.message, /10 and 1,000/)
})

test('allows empty phone and checks phone character and digit limits', () => {
  assert.equal(validateLead({ ...validLead, phone: '' }).errors.phone, undefined)
  assert.match(validateLead({ ...validLead, phone: 'call me 1234567' }).errors.phone, /7 to 15 digits/)
  assert.match(validateLead({ ...validLead, phone: '123456' }).errors.phone, /7 to 15 digits/)
  assert.match(validateLead({ ...validLead, phone: '1234567890123456' }).errors.phone, /7 to 15 digits/)
})

test('rejects unexpected fields and invalid select values', () => {
  const result = validateLead({ ...validLead, extra: 'no', service: 'Consulting', budget: '$$$', timeline: 'Later' })
  assert.match(result.errors.extra, /not accepted/)
  assert.match(result.errors.service, /Choose a service/)
  assert.match(result.errors.budget, /Choose a budget/)
  assert.match(result.errors.timeline, /Choose a timeline/)
})

test('enforces name and message upper bounds', () => {
  const result = validateLead({ ...validLead, name: 'n'.repeat(81), message: 'm'.repeat(1001) })
  assert.ok(result.errors.name)
  assert.ok(result.errors.message)
})

test('returns field errors for values that are not text', () => {
  const result = validateLead({ ...validLead, name: 17, email: 123, phone: 42, message: null })
  assert.ok(result.errors.name)
  assert.ok(result.errors.email)
  assert.ok(result.errors.phone)
  assert.ok(result.errors.message)
})
