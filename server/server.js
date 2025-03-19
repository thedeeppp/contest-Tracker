// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { fetchLeetCodeContests, fetchCodeChefContests, fetchCodeforcesContests } from './utils/scraper.js';
import User from './models/User.js';
import Contest from './models/contest.js';
import Bookmark from './models/Bookmark.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/contest-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// YouTube API setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Routes

// User registration
app.post('/api/users/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const user = new User({ username, email, password: hashedPassword });
      await user.save();
  
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error" });
    }
});

// User login
app.post('/api/users/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
});

// Fetch all contests
app.get('/api/contests', async (req, res) => {
  try {
    // Check if we have recent contests in the database
    const lastUpdate = await Contest.findOne().sort({ updatedAt: -1 });
    const shouldFetchNew = !lastUpdate || 
                          Date.now() - new Date(lastUpdate.updatedAt).getTime() > 3600000; // 1 hour

    if (shouldFetchNew) {
      console.log('Fetching fresh contest data...');
      // Fetch contests from all platforms
      const [leetcodeContests, codechefContests, codeforcesContests] = await Promise.all([
        fetchLeetCodeContests(),
        fetchCodeChefContests(),
        fetchCodeforcesContests()
      ]);

      // Process and save contests
      const allContests = [...leetcodeContests, ...codechefContests, ...codeforcesContests];
      
      // Update or insert contests
      for (const contest of allContests) {
        await Contest.findOneAndUpdate(
          { name: contest.name, platform: contest.platform },
          {
            ...contest,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      }
    }

    // Fetch YouTube solution links if available
    const fetchSolutionLinks = await fetchYouTubeSolutionLinks();
    
    // Get all contests from database
    const now = new Date();
    const upcomingContests = await Contest.find({ date: { $gte: now } })
                                      .sort({ date: 1 });
    const pastContests = await Contest.find({ date: { $lt: now } })
                                  .sort({ date: -1 })
                                  .limit(50); // Limit past contests

    // Add solution links to past contests
    pastContests.forEach(contest => {
      const solution = fetchSolutionLinks.find(
        s => s.contestName.toLowerCase().includes(contest.name.toLowerCase()) ||
             contest.name.toLowerCase().includes(s.contestName.toLowerCase())
      );
      
      if (solution) {
        contest.solutionLink = solution.videoUrl;
      }
    });

    res.json({
      upcoming: upcomingContests,
      past: pastContests
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bookmark a contest
app.post('/api/bookmarks', auth, async (req, res) => {
  try {
    const { contestId } = req.body;
    
    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({ 
      user: req.user._id, 
      contest: contestId 
    });

    if (existingBookmark) {
      return res.status(400).json({ message: 'Contest already bookmarked' });
    }

    // Create new bookmark
    const bookmark = new Bookmark({
      user: req.user._id,
      contest: contestId
    });

    await bookmark.save();
    
    res.status(201).json(bookmark);
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookmarks
app.get('/api/bookmarks', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
                                .populate('contest');
    
    res.json(bookmarks);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a bookmark
app.delete('/api/bookmarks/:id', auth, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({ 
      _id: req.params.id,
      user: req.user._id
    });

    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark removed' });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin route to add YouTube solution link manually
app.post('/api/solutions', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { contestId, videoUrl } = req.body;
    
    const contest = await Contest.findByIdAndUpdate(
      contestId,
      { solutionLink: videoUrl },
      { new: true }
    );

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.json(contest);
  } catch (error) {
    console.error('Add solution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Function to fetch YouTube solution links
async function fetchYouTubeSolutionLinks() {
  try {
    const playlists = {
      'LeetCode': process.env.LEETCODE_PLAYLIST_ID || 'YOUR_LEETCODE_PLAYLIST_ID',
      'Codeforces': process.env.CODEFORCES_PLAYLIST_ID || 'YOUR_CODEFORCES_PLAYLIST_ID',
      'CodeChef': process.env.CODECHEF_PLAYLIST_ID || 'YOUR_CODECHEF_PLAYLIST_ID'
    };
    
    let allVideos = [];
    
    for (const [platform, playlistId] of Object.entries(playlists)) {
      const response = await youtube.playlistItems.list({
        part: 'snippet',
        playlistId: playlistId,
        maxResults: 50
      });
      
      const videos = response.data.items.map(item => ({
        platform,
        contestName: item.snippet.title,
        videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        publishedAt: item.snippet.publishedAt
      }));
      
      allVideos = [...allVideos, ...videos];
    }
    
    return allVideos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});