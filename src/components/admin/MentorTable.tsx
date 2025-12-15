import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Users, Mail, Calendar, UserCheck } from 'lucide-react';
import type { MentorWithMentees, MentorInvitationAdmin } from '../../services/admin.service';

interface MentorTableProps {
  mentors: MentorWithMentees[];
  invitations: MentorInvitationAdmin[];
}

export default function MentorTable({ mentors, invitations }: MentorTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMentors, setExpandedMentors] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'mentors' | 'invitations'>('mentors');

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mentor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const filteredInvitations = invitations.filter(
    (inv) =>
      inv.mentor_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.job_seeker_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.job_seeker_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const toggleExpand = (mentorId: string) => {
    const newExpanded = new Set(expandedMentors);
    if (newExpanded.has(mentorId)) {
      newExpanded.delete(mentorId);
    } else {
      newExpanded.add(mentorId);
    }
    setExpandedMentors(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('mentors')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mentors'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mentors ({mentors.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invitations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invitations ({invitations.length})
            </div>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'mentors' ? 'Search mentors...' : 'Search invitations...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Mentors Tab */}
      {activeTab === 'mentors' && (
        <div className="divide-y divide-gray-200">
          {filteredMentors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No mentors found.
            </div>
          ) : (
            filteredMentors.map((mentor) => (
              <div key={mentor.id}>
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(mentor.id)}
                >
                  <div className="flex items-center gap-4">
                    <button className="p-1">
                      {expandedMentors.has(mentor.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <div>
                      <p className="font-medium text-gray-900">
                        {mentor.full_name || 'No name'}
                      </p>
                      <p className="text-sm text-gray-500">{mentor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserCheck className="h-4 w-4" />
                      {mentor.mentees.length} mentee{mentor.mentees.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {formatDate(mentor.created_at)}
                    </div>
                  </div>
                </div>

                {/* Expanded Mentees List */}
                {expandedMentors.has(mentor.id) && (
                  <div className="bg-gray-50 px-4 py-3 ml-12 border-t border-gray-100">
                    {mentor.mentees.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No mentees yet</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                          Associated Users
                        </p>
                        {mentor.mentees.map((mentee) => (
                          <div
                            key={mentee.id}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {mentee.full_name || 'No name'}
                              </p>
                              <p className="text-sm text-gray-500">{mentee.email}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              Connected {formatDate(mentee.connected_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Seeker
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mentor Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No invitations found.
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {invitation.job_seeker_name || 'No name'}
                        </p>
                        <p className="text-sm text-gray-500">{invitation.job_seeker_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-gray-900">{invitation.mentor_email}</p>
                        {invitation.mentor_name && (
                          <p className="text-sm text-gray-500">{invitation.mentor_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                          invitation.status
                        )}`}
                      >
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(invitation.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
