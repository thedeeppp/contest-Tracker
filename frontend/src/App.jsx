import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ContestTracker from './components/ContestTracker';
import Auth from './pages/Auth';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<ContestTracker />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;