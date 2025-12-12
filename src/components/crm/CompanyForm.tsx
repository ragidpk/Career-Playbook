import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { Star, Building2, User, Briefcase, Calendar } from 'lucide-react';
import type { Company } from '../../services/company.service';

interface CompanyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (company: CompanyFormData) => Promise<void>;
  company?: Company | null;
}

export interface CompanyFormData {
  name: string;
  website_url: string;
  status: 'researching' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  notes: string;
  // Contact Information
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_linkedin: string;
  contact_title: string;
  // Job Details
  job_title: string;
  job_posting_url: string;
  salary_range: string;
  // Company Details
  industry: string;
  company_size: string;
  location: string;
  company_linkedin: string;
  // Tracking Fields
  application_date: string;
  last_contact_date: string;
  next_followup_date: string;
  referral_source: string;
  priority: number;
  is_favorite: boolean;
}

const STATUS_OPTIONS = [
  { value: 'researching', label: 'Researching' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium-Low' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Medium-High' },
  { value: 5, label: 'High' },
] as const;

const COMPANY_SIZE_OPTIONS = [
  { value: '', label: 'Select size...' },
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001-5000', label: '1001-5000 employees' },
  { value: '5001+', label: '5001+ employees' },
] as const;

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Select industry...' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Education', label: 'Education' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Other', label: 'Other' },
] as const;

const REFERRAL_OPTIONS = [
  { value: '', label: 'Select source...' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Indeed', label: 'Indeed' },
  { value: 'Glassdoor', label: 'Glassdoor' },
  { value: 'Company Website', label: 'Company Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Recruiter', label: 'Recruiter' },
  { value: 'Job Fair', label: 'Job Fair' },
  { value: 'Networking', label: 'Networking' },
  { value: 'Other', label: 'Other' },
] as const;

const defaultFormData: CompanyFormData = {
  name: '',
  website_url: '',
  status: 'researching',
  notes: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  contact_linkedin: '',
  contact_title: '',
  job_title: '',
  job_posting_url: '',
  salary_range: '',
  industry: '',
  company_size: '',
  location: '',
  company_linkedin: '',
  application_date: '',
  last_contact_date: '',
  next_followup_date: '',
  referral_source: '',
  priority: 3,
  is_favorite: false,
};

export default function CompanyForm({ open, onClose, onSubmit, company }: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'details' | 'tracking'>('basic');

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        website_url: company.website_url || '',
        status: company.status,
        notes: company.notes || '',
        contact_name: company.contact_name || '',
        contact_email: company.contact_email || '',
        contact_phone: company.contact_phone || '',
        contact_linkedin: company.contact_linkedin || '',
        contact_title: company.contact_title || '',
        job_title: company.job_title || '',
        job_posting_url: company.job_posting_url || '',
        salary_range: company.salary_range || '',
        industry: company.industry || '',
        company_size: company.company_size || '',
        location: company.location || '',
        company_linkedin: company.company_linkedin || '',
        application_date: company.application_date || '',
        last_contact_date: company.last_contact_date || '',
        next_followup_date: company.next_followup_date || '',
        referral_source: company.referral_source || '',
        priority: company.priority || 3,
        is_favorite: company.is_favorite || false,
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
    setActiveTab('basic');
  }, [company, open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (formData.website_url && !isValidUrl(formData.website_url)) {
      newErrors.website_url = 'Please enter a valid URL';
    }

    if (formData.contact_email && !isValidEmail(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email';
    }

    if (formData.job_posting_url && !isValidUrl(formData.job_posting_url)) {
      newErrors.job_posting_url = 'Please enter a valid URL';
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

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        website_url: formData.website_url && !formData.website_url.startsWith('http')
          ? `https://${formData.website_url}`
          : formData.website_url,
        job_posting_url: formData.job_posting_url && !formData.job_posting_url.startsWith('http')
          ? `https://${formData.job_posting_url}`
          : formData.job_posting_url,
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting company:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info', icon: Building2 },
    { id: 'contact' as const, label: 'Contact', icon: User },
    { id: 'details' as const, label: 'Job Details', icon: Briefcase },
    { id: 'tracking' as const, label: 'Tracking', icon: Calendar },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={company ? 'Edit Company' : 'Add Company'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="name"
                  label="Company Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  placeholder="e.g. Google, Microsoft"
                  required
                />
              </div>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_favorite: !formData.is_favorite })}
                  className={`p-2 rounded-full transition-colors ${
                    formData.is_favorite
                      ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                      : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                  }`}
                  title={formData.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-6 h-6 ${formData.is_favorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="website_url"
                label="Website URL"
                type="text"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                error={errors.website_url}
                placeholder="www.example.com"
              />

              <Input
                id="company_linkedin"
                label="Company LinkedIn"
                type="text"
                value={formData.company_linkedin}
                onChange={(e) => setFormData({ ...formData, company_linkedin: e.target.value })}
                placeholder="linkedin.com/company/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CompanyFormData['status'] })}
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

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {INDUSTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="company_size" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  id="company_size"
                  value={formData.company_size}
                  onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {COMPANY_SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              id="location"
              label="Location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. New York, NY or Remote"
            />
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="contact_name"
                label="Contact Name"
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="John Smith"
              />

              <Input
                id="contact_title"
                label="Contact Title"
                type="text"
                value={formData.contact_title}
                onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                placeholder="HR Manager, Recruiter"
              />
            </div>

            <Input
              id="contact_email"
              label="Contact Email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              error={errors.contact_email}
              placeholder="john@company.com"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="contact_phone"
                label="Contact Phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />

              <Input
                id="contact_linkedin"
                label="Contact LinkedIn"
                type="text"
                value={formData.contact_linkedin}
                onChange={(e) => setFormData({ ...formData, contact_linkedin: e.target.value })}
                placeholder="linkedin.com/in/..."
              />
            </div>
          </div>
        )}

        {/* Job Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <Input
              id="job_title"
              label="Job Title"
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
            />

            <Input
              id="job_posting_url"
              label="Job Posting URL"
              type="text"
              value={formData.job_posting_url}
              onChange={(e) => setFormData({ ...formData, job_posting_url: e.target.value })}
              error={errors.job_posting_url}
              placeholder="Link to job posting"
            />

            <Input
              id="salary_range"
              label="Salary Range"
              type="text"
              value={formData.salary_range}
              onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
              placeholder="e.g. $100k - $150k"
            />

            <div>
              <label htmlFor="referral_source" className="block text-sm font-medium text-gray-700 mb-1">
                How did you find this opportunity?
              </label>
              <select
                id="referral_source"
                value={formData.referral_source}
                onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {REFERRAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                rows={4}
                placeholder="Add any notes about this opportunity..."
              />
            </div>
          </div>
        )}

        {/* Tracking Tab */}
        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="application_date"
                label="Application Date"
                type="date"
                value={formData.application_date}
                onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
              />

              <Input
                id="last_contact_date"
                label="Last Contact Date"
                type="date"
                value={formData.last_contact_date}
                onChange={(e) => setFormData({ ...formData, last_contact_date: e.target.value })}
              />
            </div>

            <Input
              id="next_followup_date"
              label="Next Follow-up Date"
              type="date"
              value={formData.next_followup_date}
              onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
            />

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Follow-up Reminder</h4>
              <p className="text-sm text-blue-700">
                Set a follow-up date to get reminded about this opportunity. You&apos;ll receive a notification when it&apos;s time to follow up.
              </p>
            </div>
          </div>
        )}

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
            {company ? 'Update Company' : 'Add Company'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
