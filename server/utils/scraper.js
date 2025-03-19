// contestFetchers.js
import axios from "axios";

// LeetCode contests fetcher - optimized
const fetchLeetCodeContests = async () => {
  try {
    const url = "https://leetcode.com/graphql";
    const { data } = await axios.post(url, {
      query: `
        query {
          allContests {
            title
            titleSlug
            startTime
            duration
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://leetcode.com',
        'Referer': 'https://leetcode.com/contest/'
      }
    });

    if (!data?.data?.allContests) return [];
    
    const now = Date.now();
    
    return data.data.allContests
      .filter(contest => {
        const startTime = contest.startTime * 1000;
        const endTime = startTime + (contest.duration * 1000);
        return endTime > now - (30 * 24 * 60 * 60 * 1000); // Include contests from last 30 days
      })
      .map(contest => {
        const startTime = contest.startTime * 1000;
        return {
          name: contest.title,
          platform: "LeetCode",
          date: new Date(startTime),
          link: `https://leetcode.com/contest/${contest.titleSlug}`
        };
      });
  } catch (error) {
    console.error("Error fetching LeetCode contests:", error.message);
    return [];
  }
};

// CodeChef contests fetcher - optimized
const fetchCodeChefContests = async () => {
  try {
    const url = "https://www.codechef.com/api/list/contests/all";
    const { data } = await axios.get(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!data) return [];
    
    const contests = [];
    
    // Process ongoing contests
    if (data.present_contests) {
      Object.values(data.present_contests).forEach(contest => {
        contests.push({
          name: contest.contest_name || contest.name,
          platform: "CodeChef",
          date: new Date(contest.contest_start_date_iso || contest.start_date),
          link: `https://www.codechef.com/${contest.contest_code}`
        });
      });
    }
    
    // Process upcoming contests
    if (data.future_contests) {
      Object.values(data.future_contests).forEach(contest => {
        contests.push({
          name: contest.contest_name || contest.name,
          platform: "CodeChef",
          date: new Date(contest.contest_start_date_iso || contest.start_date),
          link: `https://www.codechef.com/${contest.contest_code}`
        });
      });
    }
    
    // Also include recently finished contests
    if (data.past_contests) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      Object.values(data.past_contests)
        .filter(contest => {
          const endDate = new Date(contest.contest_end_date_iso || contest.end_date);
          return endDate > thirtyDaysAgo;
        })
        .slice(0, 10) // Limit to recent 10 past contests
        .forEach(contest => {
          contests.push({
            name: contest.contest_name || contest.name,
            platform: "CodeChef",
            date: new Date(contest.contest_start_date_iso || contest.start_date),
            link: `https://www.codechef.com/${contest.contest_code}`
          });
        });
    }
    
    return contests;
  } catch (error) {
    console.error("Error fetching CodeChef contests:", error.message);
    return [];
  }
};

// Codeforces contests fetcher
const fetchCodeforcesContests = async () => {
  try {
    const url = "https://codeforces.com/api/contest.list";
    const { data } = await axios.get(url);

    if (!data?.result) return [];
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    return data.result
      .filter(contest => {
        // Include upcoming contests and recent past contests
        const contestTime = contest.startTimeSeconds * 1000;
        return contest.phase === "BEFORE" || 
              (contest.phase === "FINISHED" && contestTime > thirtyDaysAgo);
      })
      .map(contest => ({
        name: contest.name,
        platform: "Codeforces",
        date: new Date(contest.startTimeSeconds * 1000),
        link: `https://codeforces.com/contest/${contest.id}`
      }));
  } catch (error) {
    console.error("Error fetching Codeforces contests:", error.message);
    return [];
  }
};

export {
  fetchLeetCodeContests,
  fetchCodeChefContests,
  fetchCodeforcesContests
};