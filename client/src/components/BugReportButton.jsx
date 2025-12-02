import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../lib/api';

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    priority: 'Medium',
    reporterName: '',
    reporterEmail: '',
    page: ''
  });

  const handleOpen = () => {
    setIsOpen(true);
    setIsSubmitted(false);
    // Pre-fill user info if logged in
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        reporterName: user.username || '',
        reporterEmail: user.email || ''
      }));
    }
    // Set current page
    setFormData(prev => ({
      ...prev,
      page: window.location.pathname
    }));
  };

  const handleClose = () => {
    setIsOpen(false);
    if (isSubmitted) {
      setFormData({
        title: '',
        description: '',
        category: 'Other',
        priority: 'Medium',
        reporterName: '',
        reporterEmail: '',
        page: ''
      });
      setIsSubmitted(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(getApiUrl('/api/bugs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          browser: navigator.userAgent
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to submit bug report');
      }
    } catch (error) {
      console.error('Bug report error:', error);
      alert('Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Bug Report Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        title="Report a Bug"
      >
        <Bug className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      {/* Bug Report Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-heading font-bold text-foreground">Report a Bug</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSubmitted ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-bold mb-2">Thank You!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your bug report has been submitted successfully. We'll look into it soon.
                  </p>
                  <Button onClick={handleClose}>Close</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.reporterName}
                      onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      value={formData.reporterEmail}
                      onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Bug Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm resize-none"
                      placeholder="Please describe the bug in detail. What happened? What did you expect to happen?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      >
                        <option value="UI/UX">UI/UX</option>
                        <option value="Performance">Performance</option>
                        <option value="Functionality">Functionality</option>
                        <option value="Security">Security</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Page: {formData.page || 'Unknown'}
                  </p>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default BugReportButton;
