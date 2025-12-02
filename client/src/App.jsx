import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Toaster } from './components/ui/Toaster';
import Home from './pages/Home';
import ArticlePage from './pages/Article';
import AdminDashboard from './pages/AdminDashboard';
import Bookmarks from './pages/Bookmarks';
import NotFound from './pages/NotFound';
import VoiceAssistant from './components/VoiceAssistant';
import BugReportButton from './components/BugReportButton';

// Component to sync notifications when user is already logged in
function NotificationSync() {
  const { isAuthenticated, token } = useAuth();
  const { syncWithUserPreference } = useNotifications();

  useEffect(() => {
    if (isAuthenticated && token) {
      syncWithUserPreference(token);
    }
  }, [isAuthenticated, token, syncWithUserPreference]);

  return null;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <NotificationSync />
            <Toaster />
            <VoiceAssistant />
            <BugReportButton />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;

