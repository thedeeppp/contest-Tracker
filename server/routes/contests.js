import express from "express";
import {
  fetchLeetCodeContests,
  fetchCodeChefContests,
  fetchCodeforcesContests,
  fetchPastContests,
} from "../utils/scraper.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [leetCode, codeChef, codeforces, past] = await Promise.all([
      fetchLeetCodeContests(),
      fetchCodeChefContests(),
      fetchCodeforcesContests(),
      fetchPastContests(),
    ]);

    const allContests = [...leetCode, ...codeChef, ...codeforces];

    const currentTime = new Date();
    const upcomingContests = allContests.filter((c) => new Date(c.date) > currentTime);
    const sortedUpcoming = upcomingContests.sort((a, b) => new Date(a.date) - new Date(b.date));

    const sortedPast = past.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ upcoming: sortedUpcoming, past: sortedPast });
  } catch (error) {
    console.error("Error fetching contests:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
