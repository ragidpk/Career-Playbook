// MentorView Page
// Mentor dashboard showing mentee's Canvas and Plan in read-only mode

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCanvas } from '../hooks/useCanvas';
import { usePlan } from '../hooks/usePlan';
import { getMentees } from '../services/mentor.service';
import type { Mentee } from '../services/mentor.service';
import MenteeSelector from '../components/mentor/MenteeSelector';
import ReadOnlyOverlay from '../components/mentor/ReadOnlyOverlay';
import Card from '../components/shared/Card';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import CanvasSection from '../components/canvas/CanvasSection';
import CanvasProgress from '../components/canvas/CanvasProgress';

const CANVAS_SECTIONS = [
  { key: 'section_1_helpers', label: 'Who do you help?' },
  { key: 'section_2_activities', label: 'What activities do you do?' },
  { key: 'section_3_value', label: 'What value do you create?' },
  { key: 'section_4_interactions', label: 'How do customers interact?' },
  { key: 'section_5_convince', label: 'How do you convince them?' },
  { key: 'section_6_skills', label: 'What skills are needed?' },
  { key: 'section_7_motivation', label: 'What motivates you?' },
  { key: 'section_8_sacrifices', label: 'What are you willing to sacrifice?' },
  { key: 'section_9_outcomes', label: 'What outcomes do you expect?' },
] as const;

export default function MentorView() {
  const { user } = useAuth();
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'canvas' | 'plan'>('canvas');

  const { canvas, isLoading: canvasLoading } = useCanvas(selectedMenteeId || '');
  const { plan, milestones, isLoading: planLoading } = usePlan(selectedMenteeId || '');

  useEffect(() => {
    loadMentees();
  }, []);

  const loadMentees = async () => {
    if (!user) return;

    try {
      const menteesData = await getMentees(user.id);
      setMentees(menteesData);

      // Auto-select first mentee
      if (menteesData.length > 0) {
        setSelectedMenteeId(menteesData[0].job_seeker_id);
      }
    } catch (error) {
      console.error('Failed to load mentees:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedMentee = mentees.find((m) => m.job_seeker_id === selectedMenteeId);
  const menteeName = selectedMentee?.profiles.full_name || selectedMentee?.profiles.email;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (mentees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Mentees Yet</h2>
              <p className="text-gray-600">
                You don't have any mentees yet. Wait for a job seeker to invite you as their mentor.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Read-only banner */}
      <ReadOnlyOverlay menteeName={menteeName} />

      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with mentee selector */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
              <MenteeSelector
                selectedMenteeId={selectedMenteeId}
                onSelect={setSelectedMenteeId}
              />
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('canvas')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'canvas'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Your Career Plans
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'plan'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  90-Day Plan
                </button>
              </nav>
            </div>
          </div>

          {/* Canvas Tab */}
          {activeTab === 'canvas' && (
            <>
              {canvasLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  {/* Progress Bar */}
                  <Card className="mb-6">
                    <CanvasProgress percentage={canvas?.completion_percentage || 0} />
                  </Card>

                  {/* Canvas Sections Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {CANVAS_SECTIONS.map((section, index) => (
                      <Card key={section.key} className={index === 8 ? 'lg:col-span-2' : ''}>
                        <CanvasSection
                          label={section.label}
                          value={(canvas?.[section.key] as string) || ''}
                          onChange={() => {}}
                          onBlur={() => {}}
                          readOnly
                        />
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Plan Tab */}
          {activeTab === 'plan' && (
            <>
              {planLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : plan ? (
                <div className="space-y-6">
                  {/* Plan Header */}
                  <Card>
                    <h2 className="text-xl font-semibold mb-2">{plan.title}</h2>
                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Start: {new Date(plan.start_date).toLocaleDateString()}</span>
                      <span>End: {new Date(plan.end_date).toLocaleDateString()}</span>
                    </div>
                  </Card>

                  {/* Milestones */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Weekly Milestones</h3>
                    {milestones && milestones.length > 0 ? (
                      milestones.map((milestone, index) => (
                        <Card key={milestone.id}>
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{milestone.goal}</h4>
                              {milestone.notes && (
                                <p className="mt-1 text-sm text-gray-600">{milestone.notes}</p>
                              )}
                              <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                                <span>Week {milestone.week_number}</span>
                                {milestone.status === 'completed' && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                    Completed
                                  </span>
                                )}
                                {milestone.status === 'in_progress' && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                    In Progress
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <p className="text-center text-gray-500 py-8">No milestones created yet</p>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <Card>
                  <p className="text-center text-gray-500 py-8">No plan created yet</p>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
