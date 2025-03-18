import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  }
}, { timestamps: true });

// Compound index to ensure a user can bookmark a contest only once
bookmarkSchema.index({ userId: 1, contestId: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;

console.log('Bookmark model created successfully');