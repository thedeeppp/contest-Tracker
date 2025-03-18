import axios from "axios";
import * as cheerio from "cheerio";

const fetchLeetCodeContests = async () => {
  try {
    // Using LeetCode's GraphQL API instead of scraping the webpage
    const url = "https://leetcode.com/graphql";
    console.log("Fetching LeetCode contests via GraphQL API...");
    
    const response = await axios.post(url, {
      // GraphQL query for contests
      query: `
        query {
          allContests {
            title
            titleSlug
            startTime
            duration
            description
          }
        }
      `
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Origin': 'https://leetcode.com',
        'Referer': 'https://leetcode.com/contest/'
      }
    });
    
    if (!response.data || !response.data.data || !response.data.data.allContests) {
      console.log("LeetCode API request failed or returned unexpected data structure");
      return [];
    }
    
    const now = Date.now();
    let contests = [];
    
    response.data.data.allContests.forEach(contest => {
      const startTime = contest.startTime * 1000; // Convert to milliseconds
      const endTime = startTime + (contest.duration * 1000); // Convert duration to milliseconds
      
      // Only include contests that haven't ended yet
      if (endTime > now) {
        const status = startTime > now ? "UPCOMING" : "ONGOING";
        
        contests.push({
          name: contest.title,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          link: `https://leetcode.com/contest/${contest.titleSlug}`,
          platform: "LeetCode",
          status: status
        });
      }
    });
    
    console.log(`Total LeetCode contests found: ${contests.length}`);
    return contests;
  } catch (error) {
    console.error("Error fetching LeetCode contests:", error.message);
    
    // Try alternative method if GraphQL fails
    return await fetchLeetCodeContestsAlternative();
  }
};

// Alternative method using public API endpoint
const fetchLeetCodeContestsAlternative = async () => {
  try {
    // Alternative API endpoint (more reliable but may have CORS protection)
    const url = "https://leetcode.com/contest/api/list/";
    console.log("Attempting alternative API method for LeetCode...");
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://leetcode.com/contest/'
      }
    });
    
    if (!response.data || !response.data.contests) {
      console.log("LeetCode alternative API request failed or returned unexpected data");
      return [];
    }
    
    const now = Date.now();
    let contests = [];
    
    response.data.contests.forEach(contest => {
      const startTime = new Date(contest.start_time).getTime();
      const endTime = startTime + (contest.duration * 1000);
      
      // Only include contests that haven't ended yet
      if (endTime > now) {
        const status = startTime > now ? "UPCOMING" : "ONGOING";
        
        contests.push({
          name: contest.title,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          link: `https://leetcode.com/contest/${contest.title_slug}`,
          platform: "LeetCode",
          status: status
        });
      }
    });
    
    console.log(`Total LeetCode contests found via alternative API: ${contests.length}`);
    return contests;
  } catch (error) {
    console.error("Error fetching LeetCode contests via alternative API:", error.message);
    
    // As a last resort, try a simple proxy approach
    return await fetchLeetCodeContestsViaProxy();
  }
};

// Last resort method using a CORS proxy (for server-side use)
const fetchLeetCodeContestsViaProxy = async () => {
  try {
    // Using a server-side approach that bypasses CORS
    // In a Node.js environment, you don't need an actual proxy
    console.log("Attempting proxy method for LeetCode...");
    
    // For server-side Node.js, you can use a different User-Agent or pass special headers
    const response = await axios.get("https://leetcode.com/contest/api/list/", {
      headers: {
        // Different user agent might help
        'User-Agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
        'Accept': 'application/json'
      },
      // Increase timeout for potentially slow response
      timeout: 10000
    });
    
    if (!response.data || !response.data.contests) {
      return [];
    }
    
    const now = Date.now();
    let contests = [];
    
    response.data.contests.forEach(contest => {
      const startTime = new Date(contest.start_time).getTime();
      const endTime = startTime + (contest.duration * 1000);
      
      if (endTime > now) {
        const status = startTime > now ? "UPCOMING" : "ONGOING";
        
        contests.push({
          name: contest.title,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          link: `https://leetcode.com/contest/${contest.title_slug}`,
          platform: "LeetCode",
          status: status
        });
      }
    });
    
    return contests;
  } catch (error) {
    console.error("All methods to fetch LeetCode contests failed:", error.message);
    return [];
  }
};

// Main function to get LeetCode contests
const getLeetCodeContests = async () => {
  return await fetchLeetCodeContests();
};


const fetchCodeChefContests = async () => {
  try {
    const url = "https://www.codechef.com/api/list/contests/all";
    console.log("Fetching CodeChef contests via API...");
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.data || response.status !== 200) {
      console.log(`CodeChef API request failed or returned empty data. Status: ${response.status}`);
      return [];
    }
    
    let contests = [];
    
    // Process ongoing contests
    if (response.data.present_contests) {
      console.log(`Found ${Object.keys(response.data.present_contests).length} ongoing contests`);
      
      Object.values(response.data.present_contests).forEach(contest => {
        contests.push({
          name: contest.contest_name || contest.name,
          startTime: contest.contest_start_date_iso || contest.start_date,
          endTime: contest.contest_end_date_iso || contest.end_date,
          link: `https://www.codechef.com/${contest.contest_code}`,
          platform: "CodeChef",
          status: "ONGOING"
        });
      });
    }
    
    // Process upcoming contests
    if (response.data.future_contests) {
      console.log(`Found ${Object.keys(response.data.future_contests).length} upcoming contests`);
      
      Object.values(response.data.future_contests).forEach(contest => {
        contests.push({
          name: contest.contest_name || contest.name,
          startTime: contest.contest_start_date_iso || contest.start_date,
          endTime: contest.contest_end_date_iso || contest.end_date,
          link: `https://www.codechef.com/${contest.contest_code}`,
          platform: "CodeChef",
          status: "UPCOMING"
        });
      });
    }
    
    console.log(`Total CodeChef contests found: ${contests.length}`);
    return contests;
  } catch (error) {
    console.error("Error fetching CodeChef contests:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
    }
    return [];
  }
};

// Fallback method using trending API - only use if main API fails
const fetchCodeChefContestsViaTrendingAPI = async () => {
  try {
    const url = "https://www.codechef.com/api/trending/home";
    console.log("Attempting trending API method for CodeChef...");
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.data) {
      return [];
    }
    
    let contests = [];
    
    // Process contests from trending API
    if (response.data.upcomingContests) {
      response.data.upcomingContests.forEach(contest => {
        contests.push({
          name: contest.name,
          startTime: contest.startDate,
          endTime: contest.endDate,
          link: contest.url || `https://www.codechef.com/${contest.code}`,
          platform: "CodeChef",
          status: "UPCOMING"
        });
      });
    }
    
    if (response.data.ongoingContests) {
      response.data.ongoingContests.forEach(contest => {
        contests.push({
          name: contest.name,
          startTime: contest.startDate,
          endTime: contest.endDate,
          link: contest.url || `https://www.codechef.com/${contest.code}`,
          platform: "CodeChef",
          status: "ONGOING"
        });
      });
    }
    
    return contests;
  } catch (error) {
    console.error("Error fetching CodeChef contests via trending API:", error.message);
    return [];
  }
};

// Main function to get CodeChef contests
const getCodeChefContests = async () => {
  try {
    // Try main API first
    const contests = await fetchCodeChefContests();
    
    // If main API works, return results
    if (contests.length > 0) {
      return contests;
    }
    
    // If main API fails, try trending API
    console.log("Main API returned no contests, trying trending API...");
    return await fetchCodeChefContestsViaTrendingAPI();
  } catch (error) {
    console.error("Failed to fetch CodeChef contests:", error.message);
    return [];
  }
};


const fetchCodeforcesContests = async () => {
  try {
    const url = "https://codeforces.com/api/contest.list";
    const { data } = await axios.get(url);

    let contests = data.result
      .filter((c) => c.phase === "BEFORE" || c.phase === "FINISHED")
      .map((c) => ({
        name: c.name,
        date: new Date(c.startTimeSeconds * 1000).toISOString(),
        link: `https://codeforces.com/contest/${c.id}`,
        platform: "Codeforces",
      }));

    return contests;
  } catch (error) {
    console.error("Error fetching Codeforces contests:", error.message);
    return [];
  }
};

const fetchPastContests = async () => {
  try {
    const url = "https://clist.by/";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let pastContests = [];
    $(".contest-card").each((_, el) => {
      pastContests.push({
        name: $(el).find(".title").text().trim(),
        date: new Date($(el).find(".end-time").text().trim()).toISOString(),
        link: $(el).find("a").attr("href"),
        platform: $(el).find(".platform").text().trim(),
      });
    });

    return pastContests;
  } catch (error) {
    console.error("Error fetching past contests:", error.message);
    return [];
  }
};

export {
  fetchLeetCodeContests,
  fetchCodeChefContests,
  fetchCodeforcesContests,
  fetchPastContests,
};
