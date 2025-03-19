// models/Contest.js
import mongoose from 'mongoose';

const ContestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['Codeforces', 'CodeChef', 'LeetCode']
  },
  date: {
    type: Date,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  solutionLink: {
    type: String,
    default: null
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

// Compound index for uniqueness
ContestSchema.index({ name: 1, platform: 1 }, { unique: true });

const Contest = mongoose.model('Contest', ContestSchema);

export default Contest;

