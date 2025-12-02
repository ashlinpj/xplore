import mongoose from 'mongoose';

const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Bug title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Bug description is required'],
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['UI/UX', 'Performance', 'Functionality', 'Security', 'Other'],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reporterEmail: {
    type: String,
    required: [true, 'Email is required'],
    trim: true
  },
  reporterName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  page: {
    type: String,
    trim: true
  },
  browser: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

bugSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Bug = mongoose.model('Bug', bugSchema);

export default Bug;
