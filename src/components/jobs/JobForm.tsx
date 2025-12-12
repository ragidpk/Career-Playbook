import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Button from '../shared/Button';
import type { JobListing } from '../../services/job.service';

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (job: JobFormData) => Promise<void>;
  job?: JobListing | null;
}

export interface JobFormData {
  title: string;
  company_name: string;
  location: string;
  job_url: string;
  source: JobListing['source'];
  description: string;
  salary_range: string;
  job_type: JobListing['job_type'];
  application_status: JobListing['application_status'];
  applied_date: string;
  deadline: string;
  notes: string;
  is_favorite: boolean;
}

const STATUS_OPTIONS: Array<{ value: JobListing['application_status']; label: string }> = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const SOURCE_OPTIONS: Array<{ value: NonNullable<JobListing['source']>; label: string }> = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'company_site', label: 'Company Site' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const JOB_TYPE_OPTIONS: Array<{ value: NonNullable<JobListing['job_type']>; label: string }> = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
];

export default function JobForm({ open, onClose, onSubmit, job }: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company_name: '',
    location: '',
    job_url: '',
    source: null,
    description: '',
    salary_range: '',
    job_type: null,
    application_status: 'saved',
    applied_date: '',
    deadline: '',
    notes: '',
    is_favorite: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title,
        company_name: job.company_name,
        location: job.location || '',
        job_url: job.job_url || '',
        source: job.source,
        description: job.description || '',
        salary_range: job.salary_range || '',
        job_type: job.job_type,
        application_status: job.application_status,
        applied_date: job.applied_date || '',
        deadline: job.deadline || '',
        notes: job.notes || '',
        is_favorite: job.is_favorite,
      });
    } else {
      setFormData({
        title: '',
        company_name: '',
        location: '',
        job_url: '',
        source: null,
        description: '',
        salary_range: '',
        job_type: null,
        application_status: 'saved',
        applied_date: '',
        deadline: '',
        notes: '',
        is_favorite: false,
      });
    }
    setErrors({});
  }, [job, open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof JobFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (formData.job_url && !isValidUrl(formData.job_url)) {
      newErrors.job_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        job_url: formData.job_url && !formData.job_url.startsWith('http')
          ? `https://${formData.job_url}`
          : formData.job_url,
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={job ? 'Edit Job' : 'Add Job'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="title"
            label="Job Title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            placeholder="e.g. Senior Software Engineer"
            required
          />

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="location"
            label="Location"
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. San Francisco, CA"
          />

          <Input
            id="job_url"
            label="Job URL"
            type="text"
            value={formData.job_url}
            onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
            error={errors.job_url}
            placeholder="e.g. linkedin.com/jobs/..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <select
              id="source"
              value={formData.source || ''}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as JobListing['source'] || null })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select source...</option>
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="job_type" className="block text-sm font-medium text-gray-700 mb-1">
              Job Type
            </label>
            <select
              id="job_type"
              value={formData.job_type || ''}
              onChange={(e) => setFormData({ ...formData, job_type: e.target.value as JobListing['job_type'] || null })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select type...</option>
              {JOB_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          id="salary_range"
          label="Salary Range"
          type="text"
          value={formData.salary_range}
          onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
          placeholder="e.g. $120k - $150k"
        />

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Brief description of the role..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="application_status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="application_status"
              value={formData.application_status}
              onChange={(e) => setFormData({ ...formData, application_status: e.target.value as JobListing['application_status'] })}
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

          <Input
            id="applied_date"
            label="Applied Date"
            type="date"
            value={formData.applied_date}
            onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
          />

          <Input
            id="deadline"
            label="Deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Add any notes about this job..."
          />
        </div>

        <div className="flex items-center">
          <input
            id="is_favorite"
            type="checkbox"
            checked={formData.is_favorite}
            onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="is_favorite" className="ml-2 block text-sm text-gray-700">
            Mark as favorite
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
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
            {job ? 'Update Job' : 'Add Job'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
