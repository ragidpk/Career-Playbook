import { useState, useEffect } from 'react';
import { Smile, Meh, Frown, MessageSquare, Send, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  saveMilestoneFeedback,
  addMilestoneComment,
  deleteMilestoneComment,
  type FeedbackScore,
  type MilestoneFeedback as FeedbackType,
  type MilestoneComment,
} from '../../services/feedback.service';

interface MilestoneFeedbackProps {
  milestoneId: string;
  existingFeedback?: FeedbackType | null;
  existingComments?: MilestoneComment[];
  onFeedbackSaved?: (feedback: FeedbackType) => void;
  onCommentAdded?: (comment: MilestoneComment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

const SCORE_OPTIONS: { value: FeedbackScore; icon: typeof Smile; label: string; color: string; bgColor: string; selectedBg: string }[] = [
  { value: 'happy', icon: Smile, label: 'Great progress', color: 'text-green-600', bgColor: 'bg-gray-50 hover:bg-green-50', selectedBg: 'bg-green-100 ring-2 ring-green-500' },
  { value: 'neutral', icon: Meh, label: 'On track', color: 'text-yellow-600', bgColor: 'bg-gray-50 hover:bg-yellow-50', selectedBg: 'bg-yellow-100 ring-2 ring-yellow-500' },
  { value: 'sad', icon: Frown, label: 'Needs attention', color: 'text-red-600', bgColor: 'bg-gray-50 hover:bg-red-50', selectedBg: 'bg-red-100 ring-2 ring-red-500' },
];

export default function MilestoneFeedback({
  milestoneId,
  existingFeedback,
  existingComments = [],
  onFeedbackSaved,
  onCommentAdded,
  onCommentDeleted,
}: MilestoneFeedbackProps) {
  const { user } = useAuth();
  const [score, setScore] = useState<FeedbackScore | null>(existingFeedback?.score || null);
  const [comments, setComments] = useState<MilestoneComment[]>(existingComments);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(existingComments.length > 0);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (existingFeedback) {
      setScore(existingFeedback.score);
    }
  }, [existingFeedback]);

  useEffect(() => {
    setComments(existingComments);
    if (existingComments.length > 0) {
      setShowComments(true);
    }
  }, [existingComments]);

  const handleScoreClick = async (newScore: FeedbackScore) => {
    const previousScore = score;
    setScore(newScore);

    setIsSavingScore(true);
    try {
      const feedback = await saveMilestoneFeedback({
        milestone_id: milestoneId,
        reviewer_type: 'mentor',
        score: newScore,
      });
      onFeedbackSaved?.(feedback);
    } catch (error) {
      console.error('Failed to save score:', error);
      setScore(previousScore);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const comment = await addMilestoneComment(milestoneId, newComment);
      setComments(prev => [...prev, comment]);
      setNewComment('');
      onCommentAdded?.(comment);
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
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCommentDeleted?.(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Score Selection */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-500 mr-2">Rate progress:</span>
        <div className="flex gap-1">
          {SCORE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = score === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleScoreClick(option.value)}
                disabled={isSavingScore}
                className={`p-2 rounded-lg transition-all ${
                  isSelected
                    ? `${option.selectedBg} ${option.color}`
                    : `${option.bgColor} text-gray-400`
                } disabled:opacity-50`}
                title={option.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
        {score && (
          <span className="text-xs text-gray-500 ml-2">
            {SCORE_OPTIONS.find(o => o.value === score)?.label}
          </span>
        )}
        {isSavingScore && <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-2" />}
      </div>

      {/* Comments Section */}
      <div>
        {!showComments ? (
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {comments.length > 0 ? `View ${comments.length} comment${comments.length > 1 ? 's' : ''}` : 'Add comment'}
          </button>
        ) : (
          <div className="space-y-3">
            {/* Comment Thread */}
            {comments.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((comment) => {
                  const isOwnComment = comment.user_id === user?.id;
                  const displayName = comment.user_name || comment.user_email?.split('@')[0] || 'User';
                  const initials = displayName.charAt(0).toUpperCase();

                  return (
                    <div
                      key={comment.id}
                      className={`flex gap-2 p-2 rounded-lg ${
                        isOwnComment ? 'bg-primary-50' : 'bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                          isOwnComment
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-400 text-white'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-700 truncate">
                            {displayName}
                            {isOwnComment && <span className="text-gray-400 ml-1">(you)</span>}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 break-words">{comment.comment}</p>
                      </div>
                      {isOwnComment && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Delete comment"
                        >
                          {deletingCommentId === comment.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Comment Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={isAddingComment || !newComment.trim()}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Collapse button */}
            {comments.length === 0 && (
              <button
                onClick={() => setShowComments(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
