import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['Codeforces', 'CodeChef', 'Leetcode']
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'past'],
    required: true
  },
  youtubeLink: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Index for faster queries
contestSchema.index({ platform: 1, startTime: 1 });
contestSchema.index({ status: 1 });

const Contest = mongoose.model('Contest', contestSchema);

export default Contest;

console.log('Contest model created successfully');