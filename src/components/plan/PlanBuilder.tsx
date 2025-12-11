import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';
import { usePlan } from '../../hooks/usePlan';
import MilestoneCard from './MilestoneCard';
import type { Database } from '../../types/database.types';

type WeeklyMilestone = Database['public']['Tables']['weekly_milestones']['Row'];

interface PlanBuilderProps {
  planId: string;
}

export default function PlanBuilder({ planId }: PlanBuilderProps) {
  const { plan, milestones, updateMilestone, updateOrder, isLoading, isReordering } = usePlan(planId);
  const [localMilestones, setLocalMilestones] = useState<WeeklyMilestone[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [milestonesKey, setMilestonesKey] = useState(0);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync local state with fetched milestones using key-based reset
  // This avoids the setState-in-effect pattern
  const milestonesId = milestones.map(m => m.id).join(',');
  if (milestones.length > 0 && localMilestones.length === 0) {
    setLocalMilestones(milestones);
  } else if (milestonesId && milestonesKey === 0 && milestones.length > 0) {
    setLocalMilestones(milestones);
    setMilestonesKey(1);
  }

  // Configure drag sensor for better UX
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Guard against null - CRITICAL for stability
    if (!over?.id) return;

    if (active.id !== over.id) {
      const oldIndex = localMilestones.findIndex((m) => m.id === active.id);
      const newIndex = localMilestones.findIndex((m) => m.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localMilestones, oldIndex, newIndex);
        setLocalMilestones(reordered);
        updateOrder(reordered);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Plan not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>
            <strong>Start:</strong> {new Date(plan.start_date).toLocaleDateString()}
          </span>
          <span>
            <strong>End:</strong> {new Date(plan.end_date).toLocaleDateString()}
          </span>
        </div>
        {isReordering && (
          <div className="mt-4 text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Saving order...
          </div>
        )}
      </div>

      {/* Milestones List */}
      {isMobile ? (
        // Mobile: No drag-and-drop, just numbered list
        <div className="space-y-4">
          {localMilestones.map((milestone, index) => (
            <div key={milestone.id}>
              <div className="text-xs text-gray-500 mb-1 ml-1">Position {index + 1}</div>
              <MilestoneCard
                milestone={milestone}
                onUpdate={updateMilestone}
                isDragDisabled={true}
              />
            </div>
          ))}
        </div>
      ) : (
        // Desktop: Full drag-and-drop
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localMilestones.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {localMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onUpdate={updateMilestone}
                  isDragDisabled={false}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Help Text */}
      {!isMobile && (
        <div className="text-sm text-gray-500 text-center py-4">
          Drag and drop weeks to reorder your plan
        </div>
      )}
    </div>
  );
}
