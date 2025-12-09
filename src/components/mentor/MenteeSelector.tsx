// MenteeSelector Component
// Dropdown for mentors to select which mentee's data to view

import { useState, useEffect } from 'react';
import type { Mentee } from '../../services/mentor.service';
import { getMentees } from '../../services/mentor.service';
import { supabase } from '../../services/supabase';

interface MenteeSelectorProps {
  selectedMenteeId: string | null;
  onSelect: (menteeId: string) => void;
}

export default function MenteeSelector({ selectedMenteeId, onSelect }: MenteeSelectorProps) {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMentees();
  }, []);

  const loadMentees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const menteesData = await getMentees(user.id);
      setMentees(menteesData);

      // Auto-select first mentee if none selected
      if (!selectedMenteeId && menteesData.length > 0) {
        onSelect(menteesData[0].job_seeker_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mentees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-10 rounded-md w-64"></div>
    );
  }

  if (error) {
    return (
      <div className="text-error text-sm">{error}</div>
    );
  }

  if (mentees.length === 0) {
    return (
      <div className="text-gray-500 text-sm">No mentees found</div>
    );
  }

  // If only one mentee, show as text instead of dropdown
  if (mentees.length === 1) {
    const mentee = mentees[0];
    return (
      <div className="text-gray-700">
        <span className="font-medium">Viewing: </span>
        {mentee.profiles.full_name || mentee.profiles.email}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <label htmlFor="mentee-selector" className="text-sm font-medium text-gray-700">
        Viewing:
      </label>
      <select
        id="mentee-selector"
        value={selectedMenteeId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {mentees.map((mentee) => (
          <option key={mentee.job_seeker_id} value={mentee.job_seeker_id}>
            {mentee.profiles.full_name || mentee.profiles.email}
          </option>
        ))}
      </select>
    </div>
  );
}
