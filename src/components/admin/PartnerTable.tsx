import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Users, Calendar, UserCheck } from 'lucide-react';
import type { MentorWithMentees } from '../../services/admin.service';

interface PartnerTableProps {
  partners: MentorWithMentees[];
}

export default function PartnerTable({ partners }: PartnerTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());

  const filteredPartners = partners.filter(
    (partner) =>
      partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const toggleExpand = (partnerId: string) => {
    const newExpanded = new Set(expandedPartners);
    if (newExpanded.has(partnerId)) {
      newExpanded.delete(partnerId);
    } else {
      newExpanded.add(partnerId);
    }
    setExpandedPartners(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalConnections = partners.reduce((sum, p) => sum + p.mentees.length, 0);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header Stats */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-900">Accountability Partners</span>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">Total Partners:</span>{' '}
              <span className="font-medium text-gray-900">{partners.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Connections:</span>{' '}
              <span className="font-medium text-gray-900">{totalConnections}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Partners List */}
      <div className="divide-y divide-gray-200">
        {filteredPartners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {partners.length === 0
              ? 'No accountability partners yet. Partners are users who have accepted mentor invitations and are connected to job seekers.'
              : 'No partners found matching your search.'}
          </div>
        ) : (
          filteredPartners.map((partner) => (
            <div key={partner.id}>
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(partner.id)}
              >
                <div className="flex items-center gap-4">
                  <button className="p-1">
                    {expandedPartners.has(partner.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-medium">
                      {(partner.full_name || partner.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {partner.full_name || 'No name'}
                    </p>
                    <p className="text-sm text-gray-500">{partner.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {partner.mentees.length}
                    </span>
                    <span className="text-sm text-gray-500">
                      user{partner.mentees.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      partner.role === 'mentor'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {partner.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Expanded Users List */}
              {expandedPartners.has(partner.id) && (
                <div className="bg-gray-50 px-4 py-3 ml-12 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Associated Users ({partner.mentees.length})
                  </p>
                  {partner.mentees.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No associated users</p>
                  ) : (
                    <div className="grid gap-2">
                      {partner.mentees.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 text-sm font-medium">
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.full_name || 'No name'}
                              </p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            Connected {formatDate(user.connected_at)}
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
    </div>
  );
}
