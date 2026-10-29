import { useState } from 'react'

const services = ['AI Automation', 'Web & Mobile Development', 'Cloud Systems', 'Technical SEO', 'BitElevate Training', 'Other']
const budgets = ['Under 50k', '50k-2L', '2L-10L', '10L+', 'Not sure']
const timelines = ['ASAP', '1-3 months', '3-6 months', 'Just exploring']
const initial = { name: '', email: '', phone: '', service: 'Other', budget: 'Not sure', timeline: 'Just exploring', message: '', website: '' }

function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2 || values.name.trim().length > 80) errors.name = 'Enter a name between 2 and 80 characters.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.trim().length > 254) errors.email = 'Enter a valid email address.'
  const digits = (values.phone.match(/\d/g) || []).length
  if (values.phone && (!/^[\d+\-\s]+$/.test(values.phone) || digits < 7 || digits > 15)) errors.phone = 'Use 7 to 15 digits; +, - and spaces are also allowed.'
  if (!services.includes(values.service)) errors.service = 'Choose a service from the list.'
  if (!budgets.includes(values.budget)) errors.budget = 'Choose a budget range from the list.'
  if (!timelines.includes(values.timeline)) errors.timeline = 'Choose a timeline from the list.'
  if (values.message.trim().length < 10 || values.message.trim().length > 1000) errors.message = 'Enter a message between 10 and 1,000 characters.'
  return errors
}

function Field({ id, label, error, children, hint }) {
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    {children}
    {hint && <span className="field-hint">{hint}</span>}
    {error && <span className="field-error" id={`${id}-error`} role="alert">{error}</span>}
  </div>
}

export default function ContactForm() {
  const requestedService = new URLSearchParams(window.location.search).get('service')
  const [values, setValues] = useState({ ...initial, service: services.includes(requestedService) ? requestedService : initial.service })
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function update(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setNotice('')
  }

  async function submit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setNotice('')
    if (Object.keys(nextErrors).length) return

    setSending(true)
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
      let result = {}
      try {
        result = await response.json()
      } catch {
        // A proxy or server error may not include a JSON response body.
      }
      if (response.status === 400 && result.errors) {
        setErrors(result.errors)
        setNotice('Please correct the highlighted fields and try again.')
      } else if (response.status === 429) {
        setNotice('Too many attempts. Please try again in 15 minutes.')
      } else if (response.status === 503) {
        setNotice('The contact service is not reachable right now. Please try again shortly.')
      } else if (!response.ok) {
        setNotice(result.error || 'We could not send your message. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setNotice('The contact service is not reachable right now. Please try again shortly.')
    } finally {
      setSending(false)
    }
  }

  function reset() {
    setValues({ ...initial, service: services.includes(requestedService) ? requestedService : initial.service })
    setErrors({})
    setNotice('')
    setSent(false)
  }

  if (sent) return <section className="success-card" aria-live="polite">
    <span className="success-mark" aria-hidden="true">✓</span>
    <p className="eyebrow">Message received</p>
    <h2>Thanks for reaching out.</h2>
    <p>We’ve received your message and will follow up soon.</p>
    <button className="button button-secondary" type="button" onClick={reset}>Send another</button>
  </section>

  const described = (name) => errors[name] ? `${name}-error` : undefined
  return <form className="contact-form" onSubmit={submit} noValidate>
    <div className="form-grid">
      <Field id="name" label="Your name" error={errors.name}><input id="name" name="name" autoComplete="name" value={values.name} onChange={update} required aria-invalid={Boolean(errors.name)} aria-describedby={described('name')} /></Field>
      <Field id="email" label="Email address" error={errors.email}><input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={update} required aria-invalid={Boolean(errors.email)} aria-describedby={described('email')} /></Field>
      <Field id="phone" label="Phone number (optional)" error={errors.phone}><input id="phone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={update} aria-invalid={Boolean(errors.phone)} aria-describedby={described('phone')} /></Field>
      <Field id="service" label="What can we help with?" error={errors.service}><select id="service" name="service" value={values.service} onChange={update} aria-invalid={Boolean(errors.service)} aria-describedby={described('service')}>{services.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field id="budget" label="Budget range" error={errors.budget}><select id="budget" name="budget" value={values.budget} onChange={update} aria-invalid={Boolean(errors.budget)} aria-describedby={described('budget')}>{budgets.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field id="timeline" label="When are you looking to start?" error={errors.timeline}><select id="timeline" name="timeline" value={values.timeline} onChange={update} aria-invalid={Boolean(errors.timeline)} aria-describedby={described('timeline')}>{timelines.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <div className="field-wide"><Field id="message" label="Tell us a little about your project" error={errors.message} hint={`${values.message.length}/1,000 characters`}><textarea id="message" name="message" rows="5" maxLength="1000" value={values.message} onChange={update} required aria-invalid={Boolean(errors.message)} aria-describedby={described('message')} /></Field></div>
      <div className="website-field" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" tabIndex="-1" autoComplete="off" value={values.website} onChange={update} /></div>
    </div>
    {notice && <p className="form-notice" role="alert">{notice}</p>}
    <div className="form-actions"><button className="button button-primary" type="submit" disabled={sending}>{sending ? <><span className="spinner" aria-hidden="true" /> Sending…</> : 'Send message'}</button><p>We’ll only use your details to reply to your enquiry.</p></div>
  </form>
}
