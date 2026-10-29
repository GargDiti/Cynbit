import mongoose from 'mongoose'

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, maxlength: 80, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: '', trim: true },
  service: { type: String, required: true },
  budget: { type: String, required: true },
  timeline: { type: String, required: true },
  message: { type: String, required: true, minlength: 10, maxlength: 1000, trim: true },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
}, { timestamps: { createdAt: true, updatedAt: false } })

export default mongoose.model('Lead', leadSchema)
