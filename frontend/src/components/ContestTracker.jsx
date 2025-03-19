import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSignInAlt, FaSignOutAlt, FaUser, FaSun, FaMoon } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

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

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

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

  const fetchBookmarks = async () => {
    if (!user) return;

    try {
      const { data } = await axios.get('/api/bookmarks');
      setBookmarks(data);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    }
  };

  const isBookmarked = (contestId) => {
    return bookmarks.some((b) => b.contest?._id === contestId);
  };

  // Helper to format date and time
  const formatDateTime = (date) => {
    const d = new Date(date);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? "dark bg-gray-900 text-gray-100" 
        : "bg-gray-50 text-gray-900"
    }`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <header className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-8 border-b pb-4 dark:border-gray-700">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Coding Contest Tracker
          </h1>
          <div className="flex items-center justify-end gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <FaUser className="text-blue-500" /> 
                  <span className="font-medium">{user.username}</span>
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaSignInAlt /> Login
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-600" />}
            </button>
          </div>
        </header>

        {/* Filter Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-lg">Filter:</label>
            <select
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full md:w-auto p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
              value={platformFilter}
            >
              <option value="all">All Platforms</option>
              <option value="Codeforces">Codeforces</option>
              <option value="CodeChef">CodeChef</option>
              <option value="LeetCode">LeetCode</option>
            </select>
          </div>
          <div className="md:col-start-3">
            <button
              onClick={fetchContests}
              className="w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>Refresh</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </section>

        {/* Contests Section */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-0 w-8 h-8 m-2 border-4 border-gray-300 rounded-full border-t-purple-500 animate-spin -reverse"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Contests Table */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded"></span>
                Upcoming Contests
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="p-3 text-left font-semibold">Platform</th>
                      <th className="p-3 text-left font-semibold">Name</th>
                      <th className="p-3 text-left font-semibold">Start</th>
                      <th className="p-3 text-left font-semibold">Time Remain</th>
                      <th className="p-3 text-left font-semibold">Bookmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contests.upcoming
                      .filter(c => platformFilter === "all" || c.platform === platformFilter)
                      .map((contest, index) => (
                        <tr
                          key={contest._id}
                          className={`border-b dark:border-gray-700 ${
                            index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"
                          } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                        >
                          <td className="p-3">
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              {contest.platform || "N/A"}
                            </span>
                          </td>
                          <td className="p-3">
                            <a 
                              href={contest.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-500 hover:underline"
                            >
                              {contest.name}
                            </a>
                          </td>
                          <td className="p-3">{formatDateTime(contest.date)}</td>
                          <td className="p-3 text-gray-500 dark:text-gray-400">
                            {timeRemaining[contest._id]}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => toggleBookmark(contest)}
                              className={`p-2 rounded-full ${
                                isBookmarked(contest._id)
                                  ? "bg-yellow-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              } hover:bg-yellow-400 transition-colors`}
                            >
                              {isBookmarked(contest._id) ? "★" : "☆"}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Past Contests Table */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-purple-500 rounded"></span>
                Past Contests
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="p-3 text-left font-semibold">Platform</th>
                      <th className="p-3 text-left font-semibold">Name</th>
                      <th className="p-3 text-left font-semibold">Start</th>
                      <th className="p-3 text-left font-semibold">Time Remain</th>
                      <th className="p-3 text-left font-semibold">Bookmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contests.past
                      .filter(c => platformFilter === "all" || c.platform === platformFilter)
                      .map((contest, index) => (
                        <tr
                          key={contest._id}
                          className={`border-b dark:border-gray-700 ${
                            index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"
                          } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                        >
                          <td className="p-3">
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              {contest.platform || "N/A"}
                            </span>
                          </td>
                          <td className="p-3">
                            <a 
                              href={contest.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-500 hover:underline"
                            >
                              {contest.name}
                            </a>
                          </td>
                          <td className="p-3">{formatDateTime(contest.date)}</td>
                          <td className="p-3 text-gray-500 dark:text-gray-400">
                            Ended
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => toggleBookmark(contest)}
                              className={`p-2 rounded-full ${
                                isBookmarked(contest._id)
                                  ? "bg-yellow-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              } hover:bg-yellow-400 transition-colors`}
                            >
                              {isBookmarked(contest._id) ? "★" : "☆"}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestTracker;