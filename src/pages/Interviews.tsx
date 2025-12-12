import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInterviews } from '../hooks/useInterview';
import { useToast } from '../components/shared/Toast';
import Button from '../components/shared/Button';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import InterviewList from '../components/interview/InterviewList';
import InterviewForm from '../components/interview/InterviewForm';
import InterviewCalendar from '../components/interview/InterviewCalendar';
import type { InterviewFormData } from '../components/interview/InterviewForm';
import type { Interview } from '../services/interview.service';
import { Calendar, List, CheckCircle } from 'lucide-react';

type TabType = 'upcoming' | 'past' | 'calendar';
type FilterType = 'all' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export default function Interviews() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    interviews,
    isLoading,
    createInterview,
    updateInterview,
    deleteInterview,
  } = useInterviews(user?.id);

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const handleAddInterview = () => {
    setEditingInterview(null);
    setIsFormOpen(true);
  };

  const handleEditInterview = (interview: Interview) => {
    setEditingInterview(interview);
    setIsFormOpen(true);
  };

  const handleDeleteInterview = async (interview: Interview) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the interview with ${interview.company_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteInterview(interview.id);
      showToast('Interview deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting interview:', error);
      showToast('Failed to delete interview', 'error');
    }
  };

  const handleSubmitForm = async (formData: InterviewFormData) => {
    try {
      if (editingInterview) {
        await updateInterview({ id: editingInterview.id, updates: formData });
        showToast('Interview updated successfully', 'success');
      } else {
        await createInterview(formData);
        showToast('Interview added successfully', 'success');
      }
      setIsFormOpen(false);
      setEditingInterview(null);
    } catch (error) {
      console.error('Error saving interview:', error);
      showToast('Failed to save interview', 'error');
      throw error;
    }
  };

  const filteredInterviews = useMemo(() => {
    let filtered = interviews;

    // Filter by tab
    const now = new Date();
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(interview => {
        if (!interview.scheduled_at) return interview.status === 'scheduled';
        return new Date(interview.scheduled_at) >= now && interview.status === 'scheduled';
      });
    } else if (activeTab === 'past') {
      filtered = filtered.filter(interview => {
        if (interview.status === 'completed' || interview.status === 'cancelled') return true;
        if (!interview.scheduled_at) return false;
        return new Date(interview.scheduled_at) < now;
      });
    }

    // Filter by status
    if (filterType !== 'all') {
      filtered = filtered.filter(interview => interview.status === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        interview =>
          interview.company_name.toLowerCase().includes(query) ||
          interview.position.toLowerCase().includes(query) ||
          interview.prep_notes?.toLowerCase().includes(query) ||
          interview.feedback?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [interviews, activeTab, filterType, searchQuery]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = interviews.filter(
      i => i.scheduled_at && new Date(i.scheduled_at) >= now && i.status === 'scheduled'
    );
    const thisWeek = interviews.filter(i => {
      if (!i.scheduled_at || i.status !== 'scheduled') return false;
      const date = new Date(i.scheduled_at);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return date >= now && date <= weekFromNow;
    });
    const completed = interviews.filter(i => i.status === 'completed');

    return { upcoming: upcoming.length, thisWeek: thisWeek.length, completed: completed.length };
  }, [interviews]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Prep Tracker</h1>
          <p className="text-gray-600">
            Track interviews, prep notes, and follow-ups
          </p>
        </div>

        {/* Stats */}
        {interviews.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.thisWeek}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search interviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ marginTop: '-2.5rem', marginLeft: '0.75rem' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filter and Add Button */}
          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>

            <Button onClick={handleAddInterview} variant="primary" className="whitespace-nowrap">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Interview
              </span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'upcoming'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('past')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'past'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Past
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'calendar'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
          </nav>
        </div>

        {/* Results count */}
        {(searchQuery || filterType !== 'all') && activeTab !== 'calendar' && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredInterviews.length} of {interviews.length} interviews
            {(searchQuery || filterType !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="ml-2 text-primary-500 hover:text-primary-600 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === 'calendar' ? (
          <InterviewCalendar interviews={filteredInterviews} onEdit={handleEditInterview} />
        ) : (
          <InterviewList
            interviews={filteredInterviews}
            onEdit={handleEditInterview}
            onDelete={handleDeleteInterview}
          />
        )}

        {/* Interview Form Modal */}
        <InterviewForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingInterview(null);
          }}
          onSubmit={handleSubmitForm}
          interview={editingInterview}
        />
      </div>
    </div>
  );
}
