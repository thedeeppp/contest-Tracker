// models/Bookmark.js
import mongoose from 'mongoose';

const BookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate bookmarks
BookmarkSchema.index({ user: 1, contest: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', BookmarkSchema);

export default Bookmark;