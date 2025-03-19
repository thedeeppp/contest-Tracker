import { format } from 'date-fns';
import { BsBookmarkStar, BsBookmarkStarFill, BsYoutube } from "react-icons/bs";

const ContestCard = ({ contest, isBookmarked, onToggleBookmark, darkMode, timeRemaining }) => {
  if (!contest) {
    return null; // Don't render anything if contest is null
  }
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };
  
  return (
    <div
      className={`p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
    >
      <div className="flex flex-col space-y-3">
        {/* Contest Name with Link */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">
            <a
              href={contest.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {contest.name}
            </a>
          </h3>
          <button
            onClick={() => onToggleBookmark(contest)}
            className="text-xl text-yellow-500 hover:text-yellow-600"
            aria-label={isBookmarked(contest._id) ? "Remove bookmark" : "Add bookmark"}
          >
            {isBookmarked(contest._id) ? <BsBookmarkStarFill /> : <BsBookmarkStar />}
          </button>
        </div>
        
        {/* Grid layout for details */}
        <div className="grid grid-cols-2 gap-3">
          {/* Platform */}
          <div className="flex items-center">
            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Platform:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{contest.platform}</span>
          </div>
          
          {/* Date */}
          <div className="flex items-center">
            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{formatDate(contest.date)}</span>
          </div>
          
          {/* Time Remaining */}
          {timeRemaining[contest._id] && (
            <div className="flex items-center col-span-2">
              <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Time Remaining:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{timeRemaining[contest._id]}</span>
            </div>
          )}
        </div>
        
        {/* Solution Link if available */}
        {contest.solutionLink && (
          <div className="flex justify-end">
            <a
              href={contest.solutionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:text-red-600 flex items-center"
            >
              <span className="mr-1">Solution</span>
              <BsYoutube size={20} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestCard;