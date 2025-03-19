import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";

const API_URL = "http://localhost:5000/api";

const AdminPanel = ({ refreshContests }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    platform: "Codeforces",
    date: "",
    link: "",
    description: "",
    videoUrl: "",
  });
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [currentContestId, setCurrentContestId] = useState(null);

  useEffect(() => {
    if (showPanel) {
      fetchContests();
    }
  }, [showPanel]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/contests/all`);
      setContests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching contests:", error);
      setError("Failed to fetch contests");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      platform: "Codeforces",
      date: "",
      link: "",
      description: "",
      videoUrl: "",
    });
    setEditMode(false);
    setCurrentContestId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Format date properly for submission
      const formattedData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      };

      if (editMode) {
        await axios.put(`${API_URL}/contests/${currentContestId}`, formattedData);
        setSuccess("Contest updated successfully");
      } else {
        await axios.post(`${API_URL}/contests`, formattedData);
        setSuccess("Contest added successfully");
      }

      resetForm();
      fetchContests();
      refreshContests(); // Refresh main contest list
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save contest");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contest) => {
    setFormData({
      name: contest.name,
      platform: contest.platform,
      date: format(new Date(contest.date), "yyyy-MM-dd'T'HH:mm"),
      link: contest.link,
      description: contest.description || "",
      videoUrl: contest.videoUrl || "",
    });
    setEditMode(true);
    setCurrentContestId(contest._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contest?")) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axios.delete(`${API_URL}/contests/${id}`);
      setSuccess("Contest deleted successfully");
      fetchContests();
      refreshContests(); // Refresh main contest list
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete contest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-700 mt-8">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="mb-6 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        {showPanel ? "Hide Admin Panel" : "Show Admin Panel"}
      </button>

      {showPanel && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Admin Panel</h2>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Add/Edit Contest Form */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 dark:text-white">
              {editMode ? "Edit Contest" : "Add New Contest"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Contest Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Platform
                  </label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="Codeforces">Codeforces</option>
                    <option value="CodeChef">CodeChef</option>
                    <option value="LeetCode">LeetCode</option>
                    <option value="HackerRank">HackerRank</option>
                    <option value="AtCoder">AtCoder</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Contest Link
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Video Tutorial URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editMode
                    ? "Update Contest"
                    : "Add Contest"}
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Contest List */}
          <div>
            <h3 className="text-xl font-semibold mb-4 dark:text-white">
              Manage Contests
            </h3>
            {loading && !contests.length ? (
              <div className="flex justify-center items-center h-32">
                <div className="loader border-4 border-gray-200 rounded-full border-t-4 border-t-blue-500 h-8 w-8 animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="py-2 px-4 border-b text-left">Name</th>
                      <th className="py-2 px-4 border-b text-left">Platform</th>
                      <th className="py-2 px-4 border-b text-left">Date</th>
                      <th className="py-2 px-4 border-b text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contests.map((contest) => (
                      <tr
                        key={contest._id}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="py-2 px-4">
                          <a
                            href={contest.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {contest.name}
                          </a>
                        </td>
                        <td className="py-2 px-4">{contest.platform}</td>
                        <td className="py-2 px-4">
                          {format(new Date(contest.date), "PPP p")}
                        </td>
                        <td className="py-2 px-4">
                          <button
                            onClick={() => handleEdit(contest)}
                            className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(contest._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;