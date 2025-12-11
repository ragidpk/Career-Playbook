import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInvitations,
  inviteMentor,
  acceptInvitation,
  declineInvitation,
  resendInvitation,
  getMentees,
  revokeAccess,
  getMentorAccess,
  isMentorView,
} from '../services/mentor.service';

/**
 * Hook for job seekers to manage their mentor invitations
 */
export function useMentorInvitations(userId: string | undefined) {
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: ['mentor-invitations', userId],
    queryFn: () => getInvitations(userId!),
    enabled: !!userId,
  });

  const inviteMutation = useMutation({
    mutationFn: ({ mentorEmail, personalMessage }: { mentorEmail: string; personalMessage?: string }) =>
      inviteMentor(mentorEmail, personalMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-invitations', userId] });
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-invitations', userId] });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: ({ jobSeekerId, mentorId }: { jobSeekerId: string; mentorId: string }) =>
      revokeAccess(jobSeekerId, mentorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-invitations', userId] });
    },
  });

  return {
    invitations: invitationsQuery.data || [],
    isLoading: invitationsQuery.isLoading,
    error: invitationsQuery.error,
    inviteMentor: inviteMutation.mutateAsync,
    resendInvitation: resendMutation.mutateAsync,
    revokeAccess: revokeAccessMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    isResending: resendMutation.isPending,
    isRevoking: revokeAccessMutation.isPending,
  };
}

/**
 * Hook for mentors to view and manage their mentees
 */
export function useMentees(mentorId: string | undefined) {
  const queryClient = useQueryClient();

  const menteesQuery = useQuery({
    queryKey: ['mentees', mentorId],
    queryFn: () => getMentees(mentorId!),
    enabled: !!mentorId,
  });

  return {
    mentees: menteesQuery.data || [],
    isLoading: menteesQuery.isLoading,
    error: menteesQuery.error,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['mentees', mentorId] }),
  };
}

/**
 * Hook to check if current user has mentor access to a specific job seeker
 */
export function useMentorAccess(jobSeekerId: string | undefined) {
  const accessQuery = useQuery({
    queryKey: ['mentor-access', jobSeekerId],
    queryFn: () => getMentorAccess(jobSeekerId!),
    enabled: !!jobSeekerId,
  });

  return {
    mentorAccess: accessQuery.data,
    hasAccess: !!accessQuery.data,
    isLoading: accessQuery.isLoading,
    error: accessQuery.error,
  };
}

/**
 * Hook to check if current user is viewing as a mentor
 */
export function useIsMentorView() {
  const mentorViewQuery = useQuery({
    queryKey: ['is-mentor-view'],
    queryFn: isMentorView,
  });

  return {
    isMentor: mentorViewQuery.data || false,
    isLoading: mentorViewQuery.isLoading,
  };
}

/**
 * Hook for accepting or declining mentor invitations
 */
export function useMentorInvitationActions() {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      // Invalidate both invitations and mentees queries
      queryClient.invalidateQueries({ queryKey: ['mentor-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['mentees'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: declineInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-invitations'] });
    },
  });

  return {
    acceptInvitation: acceptMutation.mutateAsync,
    declineInvitation: declineMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
  };
}
