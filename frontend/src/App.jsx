import { useState, useEffect } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

const API_URL = "http://localhost:5000/contests";

const ContestTracker = () => {
  const [contests, setContests] = useState({ upcoming: [], past: [] });
  const [bookmarks, setBookmarks] = useState([]);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchContests();
    const savedBookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
    setBookmarks(savedBookmarks);
    setDarkMode(localStorage.getItem("theme") === "dark");
  }, []);

  const fetchContests = async () => {
    try {
      const { data } = await axios.get(API_URL);
      setContests(data);
    } catch (error) {
      console.error("Error fetching contests:", error);
    }
  };

  const toggleBookmark = (contest) => {
    let updatedBookmarks = bookmarks.some((b) => b.name === contest.name)
      ? bookmarks.filter((b) => b.name !== contest.name)
      : [...bookmarks, contest];
    setBookmarks(updatedBookmarks);
    localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
  };

  const toggleTheme = () => {
    const newTheme = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className={darkMode ? "dark bg-gray-900 text-white" : "bg-white text-black"}>
      <button onClick={toggleTheme} className="p-2 bg-blue-500 text-white rounded m-4">
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
      <select onChange={(e) => setPlatformFilter(e.target.value)} className="m-4 p-2 border">
        <option value="all">All Platforms</option>
        <option value="Codeforces">Codeforces</option>
        <option value="CodeChef">CodeChef</option>
        <option value="LeetCode">LeetCode</option>
      </select>
      
      <h2 className="text-xl font-bold p-4">Upcoming Contests</h2>
      <div>
        {contests.upcoming.filter(c => platformFilter === "all" || c.platform === platformFilter).map((contest) => (
          <div key={contest.name} className="p-4 border rounded m-2 flex justify-between">
            <div>
              <a href={contest.link} target="_blank" rel="noopener noreferrer" className="text-blue-500">{contest.name}</a>
              <p>{contest.platform} - {formatDistanceToNow(new Date(contest.date), { addSuffix: true })}</p>
            </div>
            <button onClick={() => toggleBookmark(contest)} className="p-2 bg-yellow-400 rounded">
              {bookmarks.some((b) => b.name === contest.name) ? "Unbookmark" : "Bookmark"}
            </button>
          </div>
        ))}
      </div>
      
      <h2 className="text-xl font-bold p-4">Past Contests</h2>
      <div>
        {contests.past.filter(c => platformFilter === "all" || c.platform === platformFilter).map((contest) => (
          <div key={contest.name} className="p-4 border rounded m-2 flex justify-between">
            <div>
              <a href={contest.link} target="_blank" rel="noopener noreferrer" className="text-blue-500">{contest.name}</a>
              <p>{contest.platform} - {new Date(contest.date).toLocaleDateString()}</p>
              {contest.solutionLink && (
                <a href={contest.solutionLink} target="_blank" rel="noopener noreferrer" className="text-green-500">Solution Video</a>
              )}
            </div>
            <button onClick={() => toggleBookmark(contest)} className="p-2 bg-yellow-400 rounded">
              {bookmarks.some((b) => b.name === contest.name) ? "Unbookmark" : "Bookmark"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContestTracker;
