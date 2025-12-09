import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';
import type { Database } from '../../types/database.types';

type WeeklyMilestone = Database['public']['Tables']['weekly_milestones']['Row'];

interface MilestoneCardProps {
  milestone: WeeklyMilestone;
  onUpdate: (id: string, updates: Partial<WeeklyMilestone>) => void;
  isDragDisabled?: boolean;
}

const MAX_GOAL_LENGTH = 200;

const statusOptions = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
] as const;

export default function MilestoneCard({ milestone, onUpdate, isDragDisabled = false }: MilestoneCardProps) {
  const [goal, setGoal] = useState(milestone.goal || '');
  const [notes, setNotes] = useState(milestone.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: milestone.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_GOAL_LENGTH) {
      setGoal(newValue);
    }
  };

  const handleGoalBlur = async () => {
    if (goal !== milestone.goal) {
      setIsSaving(true);
      try {
        await onUpdate(milestone.id, { goal });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleNotesBlur = async () => {
    if (notes !== milestone.notes) {
      setIsSaving(true);
      try {
        await onUpdate(milestone.id, { notes });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as WeeklyMilestone['status'];
    onUpdate(milestone.id, { status: newStatus });
  };

  const currentStatus = statusOptions.find(s => s.value === milestone.status) || statusOptions[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {!isDragDisabled && (
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 space-y-3">
            {/* Week Badge and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                  {milestone.week_number}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Week {milestone.week_number}
                </span>
              </div>

              {/* Status Dropdown */}
              <select
                value={milestone.status}
                onChange={handleStatusChange}
                className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 ${currentStatus.color}`}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Goal Textarea */}
            <div>
              <label htmlFor={`goal-${milestone.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                Goal
              </label>
              <textarea
                id={`goal-${milestone.id}`}
                value={goal}
                onChange={handleGoalChange}
                onBlur={handleGoalBlur}
                placeholder="What do you want to achieve this week?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                maxLength={MAX_GOAL_LENGTH}
              />
              <div className="flex justify-between items-center mt-1">
                <span className={`text-xs ${goal.length >= MAX_GOAL_LENGTH ? 'text-red-600' : 'text-gray-500'}`}>
                  {goal.length}/{MAX_GOAL_LENGTH} characters
                </span>
                {isSaving && (
                  <span className="text-xs text-gray-500">Saving...</span>
                )}
              </div>
            </div>

            {/* Notes Textarea */}
            <div>
              <label htmlFor={`notes-${milestone.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id={`notes-${milestone.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Additional notes, resources, or action items..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
