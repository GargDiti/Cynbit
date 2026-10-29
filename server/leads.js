import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import Lead from './models/Lead.js'
import { sendLeadConfirmation } from './mail.js'

export const services = [
  'AI Automation', 'Web & Mobile Development', 'Cloud Systems',
  'Technical SEO', 'BitElevate Training', 'Other',
]
export const budgets = ['Under 50k', '50k-2L', '2L-10L', '10L+', 'Not sure']
export const timelines = ['ASAP', '1-3 months', '3-6 months', 'Just exploring']
const allowedFields = new Set(['name', 'email', 'phone', 'service', 'budget', 'timeline', 'message', 'website'])

export function validateLead(input = {}) {
  const errors = {}
  const data = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === 'string' ? value.trim().normalize('NFC') : value]))

  for (const key of Object.keys(data)) {
    if (!allowedFields.has(key)) errors[key] = 'This field is not accepted.'
  }

  const name = typeof data.name === 'string' ? data.name : ''
  if (name.length < 2 || name.length > 80) errors.name = 'Enter a name between 2 and 80 characters.'

  const email = typeof data.email === 'string' ? data.email.toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = 'Enter a valid email address.'

  const phone = typeof data.phone === 'string' ? data.phone : ''
  if (data.phone !== undefined && typeof data.phone !== 'string') errors.phone = 'Enter a phone number as text.'
  else if (phone && (!/^[\d+\-\s]+$/.test(phone) || (phone.match(/\d/g) || []).length < 7 || (phone.match(/\d/g) || []).length > 15)) {
    errors.phone = 'Use 7 to 15 digits; +, - and spaces are also allowed.'
  }

  if (!services.includes(data.service)) errors.service = 'Choose a service from the list.'
  if (!budgets.includes(data.budget)) errors.budget = 'Choose a budget range from the list.'
  if (!timelines.includes(data.timeline)) errors.timeline = 'Choose a timeline from the list.'
  const message = typeof data.message === 'string' ? data.message : ''
  if (message.length < 10 || message.length > 1000) errors.message = 'Enter a message between 10 and 1,000 characters.'
  if (data.website !== undefined && typeof data.website !== 'string') errors.website = 'This field must be text.'

  return { errors, value: { name, email, phone, service: data.service, budget: data.budget, timeline: data.timeline, message } }
}

export const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
})

const router = Router()
router.post('/', leadLimiter, async (request, response, next) => {
  try {
    if (typeof request.body?.website === 'string' && request.body.website.trim()) {
      return response.status(200).json({ ok: true })
    }

    if (mongoose.connection.readyState !== 1) {
      return response.status(503).json({ error: 'The contact service is temporarily unavailable. Please try again shortly.' })
    }

    const { errors, value } = validateLead(request.body)
    if (Object.keys(errors).length) return response.status(400).json({ errors })

    const lead = await Lead.create(value)
    await sendLeadConfirmation(value).catch((error) => console.error('Confirmation email failed:', error.message))
    return response.status(201).json({ message: 'Thanks — your message has been received.', id: lead.id })
  } catch (error) {
    return next(error)
  }
})

export default router
