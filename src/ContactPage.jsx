import ContactForm from './ContactForm.jsx'

export default function ContactPage() {
  return <main className="contact-page">
    <section className="contact-card" aria-labelledby="contact-title">
      <header className="form-heading">
        <p className="eyebrow">Contact</p>
        <h1 id="contact-title">Tell us about your project.</h1>
        <p>Complete the form and we’ll get back to you.</p>
      </header>
      <ContactForm />
    </section>
  </main>
}
