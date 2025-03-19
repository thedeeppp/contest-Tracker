import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSignInAlt, FaSignOutAlt, FaUser, FaSun, FaMoon } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import ContestCard from "./ContestCard";

const ContestTracker = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [contests, setContests] = useState({ upcoming: [], past: [] });
  const [bookmarks, setBookmarks] = useState([]);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({});

  // Memoized fetchContests function
  const fetchContests = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/contests');
      if (data && data.upcoming && data.past) {
        setContests(data);

        // Initialize time remaining for each contest
        const now = new Date();
        const initialTimeRemaining = {};

        data.upcoming.forEach((contest) => {
          if (!contest) return;
          
          const contestDate = new Date(contest.date);
          const diff = contestDate - now;

          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            initialTimeRemaining[contest._id] = `${days}d ${hours}h ${minutes}m`;
          } else {
            initialTimeRemaining[contest._id] = "Started";
          }
        });

        setTimeRemaining(initialTimeRemaining);
      } else {
        console.error('Invalid data format received:', data);
      }
    } catch (error) {
      console.error("Error fetching contests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch contests on component mount
  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  // Set up timer for updating time remaining
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const updatedTimeRemaining = {};

      contests.upcoming.forEach((contest) => {
        if (!contest) return;

        const contestDate = new Date(contest.date);
        const diff = contestDate - now;

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          updatedTimeRemaining[contest._id] = `${days}d ${hours}h ${minutes}m`;
        } else {
          updatedTimeRemaining[contest._id] = "Started";
        }
      });

      setTimeRemaining(updatedTimeRemaining);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [contests.upcoming]);

  // Effect to fetch bookmarks when user changes
  useEffect(() => {
    if (user) {
      fetchBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  // Toggle bookmark function
  const toggleBookmark = async (contest) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const existingBookmark = bookmarks.find((b) => b.contest?._id === contest._id);

      if (existingBookmark) {
        await axios.delete(`/api/bookmarks/${existingBookmark._id}`);
        setBookmarks(bookmarks.filter((b) => b._id !== existingBookmark._id));
      } else {
        const { data } = await axios.post('/api/bookmarks', { contestId: contest._id });
        setBookmarks([...bookmarks, data]);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  // Fetch bookmarks for the logged-in user
  const fetchBookmarks = async () => {
    if (!user) return;

    try {
      const { data } = await axios.get('/api/bookmarks');
      setBookmarks(data);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    }
  };

  // Check if a contest is bookmarked
  const isBookmarked = (contestId) => {
    return bookmarks.some((b) => b.contest?._id === contestId);
  };

  return (
    <div className={`${darkMode ? "dark bg-gray-900 text-white" : "bg-white text-black"} min-h-screen transition-colors duration-300`}> 
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Coding Contest Tracker</h1>
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <FaUser /> <span>{user.username}</span>
                </span>
                <button
                  onClick={logout}
                  className="flex items-center bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                <FaSignInAlt /> Login
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="ml-4 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap justify-between items-center">
          <label className="font-semibold">Filter by Platform:</label>
          <select 
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="p-2 border rounded bg-gray-100 dark:bg-gray-800"
            value={platformFilter}
          >
            <option value="all">All Platforms</option>
            <option value="Codeforces">Codeforces</option>
            <option value="CodeChef">CodeChef</option>
            <option value="LeetCode">LeetCode</option>
          </select>
          <button onClick={fetchContests} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Refresh Contests
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader border-4 border-gray-200 rounded-full border-t-4 border-t-blue-500 h-12 w-12 animate-spin"></div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">Upcoming Contests</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {contests.upcoming
                .filter(c => platformFilter === "all" || c.platform === platformFilter)
                .map(contest => (
                  <ContestCard 
                    key={contest._id} 
                    contest={contest} 
                    darkMode={darkMode} 
                    isBookmarked={isBookmarked} 
                    onToggleBookmark={toggleBookmark} 
                    timeRemaining={timeRemaining}
                  />
                ))}
            </div>
            <h2 className="text-2xl font-bold mt-8 mb-4">Past Contests</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {contests.past
                .filter(c => platformFilter === "all" || c.platform === platformFilter)
                .map(contest => (
                  <ContestCard 
                    key={contest._id} 
                    contest={contest} 
                    darkMode={darkMode} 
                    isBookmarked={isBookmarked} 
                    onToggleBookmark={toggleBookmark} 
                    timeRemaining={timeRemaining}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestTracker; 