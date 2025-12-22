import { useState } from 'react';
import { Clock, Check, CheckCircle2, Smile, Meh, Frown, MessageSquare, Send, Loader2, Trash2, Calendar } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import type { Database } from '../../types/database.types';
import {
  addMilestoneComment,
  deleteMilestoneComment,
  saveMilestoneFeedback,
  type MilestoneFeedback,
  type MilestoneComment,
  type FeedbackScore,
} from '../../services/feedback.service';

type WeeklyMilestone = Database['public']['Tables']['weekly_milestones']['Row'] & {
  subtasks?: { text: string; completed: boolean }[];
  category?: string;
};

// Category configuration for colored tags
const CATEGORY_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
  foundation: { label: 'Foundation', bgColor: 'bg-blue-100', textColor: 'text-blue-700', dotColor: 'bg-blue-500' },
  skill_development: { label: 'Skill Development', bgColor: 'bg-green-100', textColor: 'text-green-700', dotColor: 'bg-green-500' },
  networking: { label: 'Networking', bgColor: 'bg-purple-100', textColor: 'text-purple-700', dotColor: 'bg-purple-500' },
  job_search: { label: 'Job Search', bgColor: 'bg-orange-100', textColor: 'text-orange-700', dotColor: 'bg-orange-500' },
};

// Map week number to category
const getWeekCategory = (weekNumber: number): string => {
  if (weekNumber <= 3) return 'foundation';
  if (weekNumber <= 6) return 'skill_development';
  if (weekNumber <= 9) return 'networking';
  return 'job_search';
};

// Helper to get week dates (Monday to Sunday)
const getWeekDates = (planStartDate: string | undefined, weekNumber: number) => {
  if (!planStartDate) return null;

  const startDate = new Date(planStartDate);
  // Get the Monday of the first week (adjust to Monday if not already)
  const firstMonday = startOfWeek(startDate, { weekStartsOn: 1 });

  // Calculate the Monday of this specific week
  const weekStart = addDays(firstMonday, (weekNumber - 1) * 7);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  return {
    start: format(weekStart, 'MMM d'),
    end: format(weekEnd, 'MMM d'),
  };
};

// Status configuration for display
const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: Check,
  },
};

// Score options for mentor feedback
const SCORE_OPTIONS: { value: FeedbackScore; icon: typeof Smile; label: string; color: string; bgColor: string; selectedBg: string }[] = [
  { value: 'happy', icon: Smile, label: 'Great progress', color: 'text-green-600', bgColor: 'bg-gray-50 hover:bg-green-50', selectedBg: 'bg-green-100 ring-2 ring-green-500' },
  { value: 'neutral', icon: Meh, label: 'On track', color: 'text-yellow-600', bgColor: 'bg-gray-50 hover:bg-yellow-50', selectedBg: 'bg-yellow-100 ring-2 ring-yellow-500' },
  { value: 'sad', icon: Frown, label: 'Needs attention', color: 'text-red-600', bgColor: 'bg-gray-50 hover:bg-red-50', selectedBg: 'bg-red-100 ring-2 ring-red-500' },
];

// Score icon component for display
const ScoreIcon = ({ score }: { score: FeedbackScore | null | undefined }) => {
  if (!score) return null;

  const config = {
    happy: { Icon: Smile, color: 'text-green-500', bg: 'bg-green-100' },
    neutral: { Icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    sad: { Icon: Frown, color: 'text-red-500', bg: 'bg-red-100' },
  };

  const { Icon, color, bg } = config[score];
  return (
    <div className={`p-1 rounded-full ${bg}`} title={score === 'happy' ? 'Great progress' : score === 'neutral' ? 'On track' : 'Needs attention'}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
  );
};

interface MilestoneGridProps {
  planTitle?: string;
  planStartDate?: string;
  milestones: WeeklyMilestone[];
  feedbackMap?: Record<string, MilestoneFeedback>;
  commentsMap?: Record<string, MilestoneComment[]>;
  onToggleComplete?: (milestoneId: string, currentStatus: string) => void;
  onFeedbackSaved?: (milestoneId: string, feedback: MilestoneFeedback) => void;
  onCommentAdded?: (milestoneId: string, comment: MilestoneComment) => void;
  onCommentDeleted?: (milestoneId: string, commentId: string) => void;
  readOnly?: boolean;
  showFeedback?: boolean;
  isMentor?: boolean;
  currentUserId?: string;
}

interface WeekCardProps {
  milestone: WeeklyMilestone;
  planStartDate?: string;
  feedback?: MilestoneFeedback | null;
  comments?: MilestoneComment[];
  onToggleComplete?: (milestoneId: string, currentStatus: string) => void;
  onFeedbackSaved?: (milestoneId: string, feedback: MilestoneFeedback) => void;
  onCommentAdded?: (milestoneId: string, comment: MilestoneComment) => void;
  onCommentDeleted?: (milestoneId: string, commentId: string) => void;
  readOnly?: boolean;
  showFeedback?: boolean;
  isMentor?: boolean;
  currentUserId?: string;
}

function WeekCard({
  milestone,
  planStartDate,
  feedback,
  comments = [],
  onToggleComplete,
  onFeedbackSaved,
  onCommentAdded,
  onCommentDeleted,
  readOnly,
  showFeedback,
  isMentor,
  currentUserId,
}: WeekCardProps) {
  const [showComments, setShowComments] = useState(comments.length > 0);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState<FeedbackScore | null>(feedback?.score || null);

  // Use category from database or derive from week number
  const categoryKey = milestone.category || getWeekCategory(milestone.week_number);
  const category = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.foundation;
  const weekDates = getWeekDates(planStartDate, milestone.week_number);
  const statusConfig = STATUS_CONFIG[milestone.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_started;

  // Get subtasks from database or fall back to parsing goal
  const subtasks = milestone.subtasks || [];

  // Get title from goal field
  const title = milestone.goal || `Week ${milestone.week_number}`;

  const handleToggle = () => {
    if (!readOnly && onToggleComplete) {
      onToggleComplete(milestone.id, milestone.status);
    }
  };

  const handleScoreClick = async (newScore: FeedbackScore) => {
    const previousScore = currentScore;
    setCurrentScore(newScore);
    setIsSavingScore(true);

    try {
      const savedFeedback = await saveMilestoneFeedback({
        milestone_id: milestone.id,
        reviewer_type: 'mentor',
        score: newScore,
      });
      onFeedbackSaved?.(milestone.id, savedFeedback);
    } catch (error) {
      console.error('Failed to save score:', error);
      setCurrentScore(previousScore);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const comment = await addMilestoneComment(milestone.id, newComment);
      setNewComment('');
      onCommentAdded?.(milestone.id, comment);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await deleteMilestoneComment(commentId);
      onCommentDeleted?.(milestone.id, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const hasFeedbackOrComments = feedback?.score || comments.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      {/* Header: Week Number + Category Tag */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-600">Week {milestone.week_number}</span>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${category.bgColor} ${category.textColor}`}>
          {category.label}
        </span>
      </div>

      {/* Week Dates */}
      {weekDates && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>{weekDates.start} - {weekDates.end}</span>
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Subtasks */}
      {subtasks.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {subtasks.map((subtask, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${subtask.completed ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={subtask.completed ? 'line-through text-gray-400' : ''}>{subtask.text}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Status Toggle (for mentee view) */}
      {!readOnly && !isMentor && (
        <button
          onClick={handleToggle}
          className={`w-full mt-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            milestone.status === 'completed'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : milestone.status === 'in_progress'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {milestone.status === 'completed' ? (
            <>
              <Check className="w-4 h-4" />
              Completed
            </>
          ) : milestone.status === 'in_progress' ? (
            <>
              <Clock className="w-4 h-4" />
              In Progress
            </>
          ) : (
            'Not Started'
          )}
        </button>
      )}

      {/* Read-only Status Display for Mentor */}
      {isMentor && (
        <div className={`w-full mt-2 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${statusConfig.bgColor} ${statusConfig.textColor}`}>
          {milestone.status === 'completed' && <Check className="w-4 h-4" />}
          {milestone.status === 'in_progress' && <Clock className="w-4 h-4" />}
          {statusConfig.label}
        </div>
      )}

      {/* Mentor Feedback Input Section */}
      {isMentor && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {/* Score Selection */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-gray-500">Rate:</span>
            <div className="flex gap-1">
              {SCORE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = currentScore === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleScoreClick(option.value)}
                    disabled={isSavingScore}
                    className={`p-1.5 rounded-lg transition-all ${
                      isSelected
                        ? `${option.selectedBg} ${option.color}`
                        : `${option.bgColor} text-gray-400`
                    } disabled:opacity-50`}
                    title={option.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
            {isSavingScore && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
          </div>

          {/* Comment Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add feedback..."
              className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <button
              onClick={handleAddComment}
              disabled={isAddingComment || !newComment.trim()}
              className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isAddingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          {/* Comments List */}
          {comments.length > 0 && (
            <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
              {comments.map((comment) => {
                const isOwn = comment.user_id === currentUserId;
                const displayName = comment.user_name || comment.user_email?.split('@')[0] || 'User';

                return (
                  <div
                    key={comment.id}
                    className={`p-2 rounded-lg text-sm ${isOwn ? 'bg-primary-50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{displayName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                        {isOwn && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            {deletingCommentId === comment.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600">{comment.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Read-only Feedback Display (for mentee view) */}
      {showFeedback && !isMentor && hasFeedbackOrComments && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {/* Score Display */}
          {feedback?.score && (
            <div className="flex items-center gap-2 mb-2">
              <ScoreIcon score={feedback.score} />
              <span className="text-xs text-gray-500">
                Mentor rating: {feedback.score === 'happy' ? 'Great progress' : feedback.score === 'neutral' ? 'On track' : 'Needs attention'}
              </span>
            </div>
          )}

          {/* Comments Toggle */}
          {comments.length > 0 && (
            <>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {showComments ? 'Hide' : 'Show'} {comments.length} comment{comments.length > 1 ? 's' : ''}
              </button>

              {/* Comments List */}
              {showComments && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {comments.map((comment) => {
                    const isOwn = comment.user_id === currentUserId;
                    const displayName = comment.user_name || comment.user_email?.split('@')[0] || 'User';

                    return (
                      <div
                        key={comment.id}
                        className={`p-2 rounded-lg text-sm ${isOwn ? 'bg-primary-50' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{displayName}</span>
                          <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-gray-600">{comment.comment}</p>
                      </div>
                    );
                  })}

                  {/* Mentee can add comments too */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Reply..."
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={isAddingComment || !newComment.trim()}
                      className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isAddingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function MilestoneGrid({
  planTitle,
  planStartDate,
  milestones,
  feedbackMap = {},
  commentsMap = {},
  onToggleComplete,
  onFeedbackSaved,
  onCommentAdded,
  onCommentDeleted,
  readOnly = false,
  showFeedback = false,
  isMentor = false,
  currentUserId,
}: MilestoneGridProps) {
  // Group milestones by month
  const weeks1to4 = milestones.filter(m => m.week_number >= 1 && m.week_number <= 4).sort((a, b) => a.week_number - b.week_number);
  const weeks5to8 = milestones.filter(m => m.week_number >= 5 && m.week_number <= 8).sort((a, b) => a.week_number - b.week_number);
  const weeks9to12 = milestones.filter(m => m.week_number >= 9 && m.week_number <= 12).sort((a, b) => a.week_number - b.week_number);

  return (
    <div className="space-y-6">
      {/* Title */}
      {planTitle && (
        <h2 className="text-xl font-bold text-gray-900">{planTitle}</h2>
      )}

      {/* Category Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
            <span className="text-sm text-gray-600">{config.label}</span>
          </div>
        ))}
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weeks 1-4 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-700">Weeks 1-4</h3>
          </div>
          <div className="space-y-4">
            {weeks1to4.map((milestone) => (
              <WeekCard
                key={milestone.id}
                milestone={milestone}
                planStartDate={planStartDate}
                feedback={feedbackMap[milestone.id]}
                comments={commentsMap[milestone.id]}
                onToggleComplete={onToggleComplete}
                onFeedbackSaved={onFeedbackSaved}
                onCommentAdded={onCommentAdded}
                onCommentDeleted={onCommentDeleted}
                readOnly={readOnly}
                showFeedback={showFeedback}
                isMentor={isMentor}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>

        {/* Weeks 5-8 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-700">Weeks 5-8</h3>
          </div>
          <div className="space-y-4">
            {weeks5to8.map((milestone) => (
              <WeekCard
                key={milestone.id}
                milestone={milestone}
                planStartDate={planStartDate}
                feedback={feedbackMap[milestone.id]}
                comments={commentsMap[milestone.id]}
                onToggleComplete={onToggleComplete}
                onFeedbackSaved={onFeedbackSaved}
                onCommentAdded={onCommentAdded}
                onCommentDeleted={onCommentDeleted}
                readOnly={readOnly}
                showFeedback={showFeedback}
                isMentor={isMentor}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>

        {/* Weeks 9-12 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-700">Weeks 9-12</h3>
          </div>
          <div className="space-y-4">
            {weeks9to12.map((milestone) => (
              <WeekCard
                key={milestone.id}
                milestone={milestone}
                planStartDate={planStartDate}
                feedback={feedbackMap[milestone.id]}
                comments={commentsMap[milestone.id]}
                onToggleComplete={onToggleComplete}
                onFeedbackSaved={onFeedbackSaved}
                onCommentAdded={onCommentAdded}
                onCommentDeleted={onCommentDeleted}
                readOnly={readOnly}
                showFeedback={showFeedback}
                isMentor={isMentor}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
