import { supabase } from './supabase';

export type FeedbackScore = 'happy' | 'neutral' | 'sad';
export type ReviewerType = 'mentor' | 'accountability_partner';

export interface MilestoneFeedback {
  id: string;
  milestone_id: string;
  reviewer_id: string;
  reviewer_type: ReviewerType;
  score: FeedbackScore | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneComment {
  id: string;
  milestone_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface FeedbackInput {
  milestone_id: string;
  reviewer_type: ReviewerType;
  score?: FeedbackScore | null;
  comment?: string | null;
}

/**
 * Get feedback for a specific milestone by the current user
 */
export async function getMilestoneFeedback(milestoneId: string): Promise<MilestoneFeedback | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await (supabase
    .from('milestone_feedback') as any)
    .select('*')
    .eq('milestone_id', milestoneId)
    .eq('reviewer_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching feedback:', error);
    return null;
  }

  return data as MilestoneFeedback | null;
}

/**
 * Get all feedback for milestones in a plan (from all reviewers)
 * Returns array per milestone to support multiple reviewers
 */
export async function getPlanFeedback(planId: string): Promise<Record<string, MilestoneFeedback[]>> {
  // Get milestones for this plan first
  const { data: milestones } = await supabase
    .from('weekly_milestones')
    .select('id')
    .eq('plan_id', planId);

  if (!milestones || milestones.length === 0) return {};

  const milestoneIds = (milestones as { id: string }[]).map(m => m.id);

  // Get ALL feedback for these milestones (not just from current user)
  const { data, error } = await (supabase
    .from('milestone_feedback') as any)
    .select('*')
    .in('milestone_id', milestoneIds)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching plan feedback:', error);
    return {};
  }

  // Group feedback by milestone_id (array to support multiple reviewers)
  const feedbackMap: Record<string, MilestoneFeedback[]> = {};
  (data || []).forEach((fb: MilestoneFeedback) => {
    if (!feedbackMap[fb.milestone_id]) {
      feedbackMap[fb.milestone_id] = [];
    }
    feedbackMap[fb.milestone_id].push(fb);
  });

  return feedbackMap;
}

/**
 * Get the most recent feedback for milestones (convenience helper for UI)
 * Returns single feedback per milestone (most recent)
 */
export async function getPlanFeedbackLatest(planId: string): Promise<Record<string, MilestoneFeedback>> {
  const allFeedback = await getPlanFeedback(planId);
  const latestMap: Record<string, MilestoneFeedback> = {};

  Object.entries(allFeedback).forEach(([milestoneId, feedbacks]) => {
    if (feedbacks.length > 0) {
      // First one is most recent due to ordering
      latestMap[milestoneId] = feedbacks[0];
    }
  });

  return latestMap;
}

/**
 * Save or update feedback for a milestone
 */
export async function saveMilestoneFeedback(input: FeedbackInput): Promise<MilestoneFeedback> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await (supabase
    .from('milestone_feedback') as any)
    .upsert({
      milestone_id: input.milestone_id,
      reviewer_id: user.id,
      reviewer_type: input.reviewer_type,
      score: input.score,
      comment: input.comment,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'milestone_id,reviewer_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving feedback:', error);
    throw new Error('Failed to save feedback');
  }

  return data as MilestoneFeedback;
}

/**
 * Delete feedback for a milestone
 */
export async function deleteMilestoneFeedback(milestoneId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await (supabase
    .from('milestone_feedback') as any)
    .delete()
    .eq('milestone_id', milestoneId)
    .eq('reviewer_id', user.id);

  if (error) {
    console.error('Error deleting feedback:', error);
    throw new Error('Failed to delete feedback');
  }
}

/**
 * Get all comments for a milestone
 */
export async function getMilestoneComments(milestoneId: string): Promise<MilestoneComment[]> {
  const { data, error } = await (supabase
    .from('milestone_comments') as any)
    .select(`
      id,
      milestone_id,
      user_id,
      comment,
      created_at
    `)
    .eq('milestone_id', milestoneId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  // Fetch user profiles for the comments
  const userIds = [...new Set((data || []).map((c: MilestoneComment) => c.user_id))];

  // Guard against empty array for .in() query
  // Use profiles_public for safe access to display names
  const profileMap: Record<string, { full_name: string }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles_public')
      .select('id, full_name')
      .in('id', userIds);

    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = { full_name: p.full_name };
    });
  }

  return (data || []).map((c: MilestoneComment) => ({
    ...c,
    user_name: profileMap[c.user_id]?.full_name,
  }));
}

/**
 * Get comments for all milestones in a plan
 */
export async function getPlanComments(planId: string): Promise<Record<string, MilestoneComment[]>> {
  // Get milestones for this plan first
  const { data: milestones } = await supabase
    .from('weekly_milestones')
    .select('id')
    .eq('plan_id', planId);

  if (!milestones || milestones.length === 0) return {};

  const milestoneIds = (milestones as { id: string }[]).map(m => m.id);

  const { data, error } = await (supabase
    .from('milestone_comments') as any)
    .select('*')
    .in('milestone_id', milestoneIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching plan comments:', error);
    return {};
  }

  // Fetch user profiles - guard against empty array
  // Use profiles_public for safe access to display names
  const userIds = [...new Set((data || []).map((c: MilestoneComment) => c.user_id))];
  const profileMap: Record<string, { full_name: string }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles_public')
      .select('id, full_name')
      .in('id', userIds);

    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = { full_name: p.full_name };
    });
  }

  // Group by milestone_id
  const commentsMap: Record<string, MilestoneComment[]> = {};
  (data || []).forEach((c: MilestoneComment) => {
    if (!commentsMap[c.milestone_id]) {
      commentsMap[c.milestone_id] = [];
    }
    commentsMap[c.milestone_id].push({
      ...c,
      user_name: profileMap[c.user_id]?.full_name,
    });
  });

  return commentsMap;
}

/**
 * Add a comment to a milestone
 */
export async function addMilestoneComment(milestoneId: string, comment: string): Promise<MilestoneComment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await (supabase
    .from('milestone_comments') as any)
    .insert({
      milestone_id: milestoneId,
      user_id: user.id,
      comment: comment.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment');
  }

  // Get user profile for display
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const profileData = profile as { full_name?: string; email?: string } | null;

  return {
    ...data,
    user_name: profileData?.full_name,
    user_email: profileData?.email,
  } as MilestoneComment;
}

/**
 * Delete a comment
 */
export async function deleteMilestoneComment(commentId: string): Promise<void> {
  const { error } = await (supabase
    .from('milestone_comments') as any)
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw new Error('Failed to delete comment');
  }
}
