import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Button from '../shared/Button';
import type { Interview } from '../../services/interview.service';

interface InterviewFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (interview: InterviewFormData) => Promise<void>;
  interview?: Interview | null;
}

export interface InterviewFormData {
  company_name: string;
  company_id?: string | null;
  position: string;
  interview_type: 'phone_screen' | 'technical' | 'behavioral' | 'final' | 'offer' | 'other';
  scheduled_at?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  prep_notes?: string | null;
  interviewer_names?: string[] | null;
  feedback?: string | null;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
}

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'technical', label: 'Technical' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'final', label: 'Final Round' },
  { value: 'offer', label: 'Offer Discussion' },
  { value: 'other', label: 'Other' },
] as const;

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
] as const;

export default function InterviewForm({ open, onClose, onSubmit, interview }: InterviewFormProps) {
  const [formData, setFormData] = useState<InterviewFormData>({
    company_name: '',
    position: '',
    interview_type: 'phone_screen',
    status: 'scheduled',
    scheduled_at: null,
    prep_notes: null,
    interviewer_names: null,
    feedback: null,
    follow_up_date: null,
    follow_up_notes: null,
  });
  const [interviewerInput, setInterviewerInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof InterviewFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (interview) {
      setFormData({
        company_name: interview.company_name,
        company_id: interview.company_id,
        position: interview.position,
        interview_type: interview.interview_type,
        scheduled_at: interview.scheduled_at,
        status: interview.status,
        prep_notes: interview.prep_notes,
        interviewer_names: interview.interviewer_names,
        feedback: interview.feedback,
        follow_up_date: interview.follow_up_date,
        follow_up_notes: interview.follow_up_notes,
      });
      setInterviewerInput(interview.interviewer_names?.join(', ') || '');
    } else {
      setFormData({
        company_name: '',
        position: '',
        interview_type: 'phone_screen',
        status: 'scheduled',
        scheduled_at: null,
        prep_notes: null,
        interviewer_names: null,
        feedback: null,
        follow_up_date: null,
        follow_up_notes: null,
      });
      setInterviewerInput('');
    }
    setErrors({});
  }, [interview, open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InterviewFormData, string>> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        interviewer_names: interviewerInput
          ? interviewerInput.split(',').map(name => name.trim()).filter(Boolean)
          : null,
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting interview:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={interview ? 'Edit Interview' : 'Add Interview'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="company_name"
            label="Company Name"
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            error={errors.company_name}
            placeholder="e.g. Google"
            required
          />

          <Input
            id="position"
            label="Position"
            type="text"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            error={errors.position}
            placeholder="e.g. Senior Software Engineer"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="interview_type" className="block text-sm font-medium text-gray-700 mb-1">
              Interview Type
            </label>
            <select
              id="interview_type"
              value={formData.interview_type}
              onChange={(e) => setFormData({ ...formData, interview_type: e.target.value as InterviewFormData['interview_type'] })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              {INTERVIEW_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as InterviewFormData['status'] })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="scheduled_at"
            label="Scheduled Date & Time"
            type="datetime-local"
            value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ''}
            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />

          <Input
            id="follow_up_date"
            label="Follow-up Date"
            type="date"
            value={formData.follow_up_date || ''}
            onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value || null })}
          />
        </div>

        <Input
          id="interviewer_names"
          label="Interviewer Names"
          type="text"
          value={interviewerInput}
          onChange={(e) => setInterviewerInput(e.target.value)}
          placeholder="Separate names with commas"
        />

        <div>
          <label htmlFor="prep_notes" className="block text-sm font-medium text-gray-700 mb-1">
            Prep Notes
          </label>
          <textarea
            id="prep_notes"
            value={formData.prep_notes || ''}
            onChange={(e) => setFormData({ ...formData, prep_notes: e.target.value || null })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Questions to ask, topics to review, etc."
          />
        </div>

        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
            Feedback / Notes
          </label>
          <textarea
            id="feedback"
            value={formData.feedback || ''}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value || null })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Questions asked, your answers, impressions, etc."
          />
        </div>

        <div>
          <label htmlFor="follow_up_notes" className="block text-sm font-medium text-gray-700 mb-1">
            Follow-up Notes
          </label>
          <textarea
            id="follow_up_notes"
            value={formData.follow_up_notes || ''}
            onChange={(e) => setFormData({ ...formData, follow_up_notes: e.target.value || null })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={2}
            placeholder="Action items, thank you note sent, etc."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {interview ? 'Update Interview' : 'Add Interview'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
