import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Button from '../shared/Button';
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
}

const STATUS_OPTIONS = [
  { value: 'researching', label: 'Researching' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
] as const;

export default function CompanyForm({ open, onClose, onSubmit, company }: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    website_url: '',
    status: 'researching',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        website_url: company.website_url || '',
        status: company.status,
        notes: company.notes || '',
      });
    } else {
      setFormData({
        name: '',
        website_url: '',
        status: 'researching',
        notes: '',
      });
    }
    setErrors({});
  }, [company, open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (formData.website_url && !isValidUrl(formData.website_url)) {
      newErrors.website_url = 'Please enter a valid URL';
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
        website_url: formData.website_url && !formData.website_url.startsWith('http')
          ? `https://${formData.website_url}`
          : formData.website_url,
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={company ? 'Edit Company' : 'Add Company'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Input
          id="website_url"
          label="Website URL"
          type="text"
          value={formData.website_url}
          onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
          error={errors.website_url}
          placeholder="e.g. www.example.com"
        />

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
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={4}
            placeholder="Add any notes about this company..."
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
            {company ? 'Update Company' : 'Add Company'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
