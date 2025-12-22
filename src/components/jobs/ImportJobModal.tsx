// Import Job Modal
// Allows users to manually import jobs from URLs (LinkedIn-compliant workflow)

import { useState, useCallback, useEffect } from 'react';
import { Link2, Building2, MapPin, Briefcase, DollarSign, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { supabase } from '../../services/supabase';
import type { ImportJobInput, LocationType } from '../../types/externalJobs.types';

interface ImportJobModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (input: ImportJobInput) => Promise<void>;
  onImportAndTrack?: (input: ImportJobInput) => Promise<void>;
}

const LOCATION_TYPE_OPTIONS: Array<{ value: LocationType; label: string }> = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

export default function ImportJobModal({
  open,
  onClose,
  onImport,
  onImportAndTrack,
}: ImportJobModalProps) {
  const [formData, setFormData] = useState<ImportJobInput>({
    url: '',
    title: '',
    company_name: '',
    location: '',
    location_type: undefined,
    description_snippet: '',
    salary_min: undefined,
    salary_max: undefined,
    salary_currency: 'USD',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ImportJobInput, string>>>({});
  const [loading, setLoading] = useState(false);
  const [trackInCrm, setTrackInCrm] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [extractError, setExtractError] = useState<string | null>(null);

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const resetForm = () => {
    setFormData({
      url: '',
      title: '',
      company_name: '',
      location: '',
      location_type: undefined,
      description_snippet: '',
      salary_min: undefined,
      salary_max: undefined,
      salary_currency: 'USD',
    });
    setErrors({});
    setTrackInCrm(false);
    setExtractStatus('idle');
    setExtractError(null);
  };

  // Extract metadata from URL
  const extractMetadata = useCallback(async (url: string) => {
    if (!url || !isValidUrl(url)) return;

    setExtracting(true);
    setExtractStatus('idle');
    setExtractError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-job-metadata`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({ url: fullUrl }),
        }
      );

      const result = await response.json();

      if (result.metadata) {
        const meta = result.metadata;

        // Check for extraction error message (but not redirect which means we got data)
        if (meta.error && meta.error !== 'redirect') {
          setExtractError(meta.error);
          setExtractStatus('error');
          // If there's a corrected URL, update the form
          if (meta.correctedUrl) {
            setFormData((prev) => ({
              ...prev,
              url: meta.correctedUrl,
            }));
          }
          return;
        }

        // Update form with extracted data
        setFormData((prev) => ({
          ...prev,
          // Use corrected URL if available
          url: meta.correctedUrl || prev.url,
          title: meta.title || prev.title,
          company_name: meta.company_name || prev.company_name,
          location: meta.location || prev.location,
          description_snippet: meta.description || prev.description_snippet,
        }));

        setExtractStatus(meta.title || meta.company_name ? 'success' : 'error');
        if (!meta.title && !meta.company_name) {
          setExtractError('Could not extract details - please fill manually');
        }
      } else {
        setExtractStatus('error');
        setExtractError('Could not extract details - please fill manually');
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      setExtractStatus('error');
      setExtractError('Failed to fetch URL');
    } finally {
      setExtracting(false);
    }
  }, []);

  // Debounced URL extraction
  useEffect(() => {
    if (!formData.url || formData.url.length < 10) return;

    const timer = setTimeout(() => {
      // Only extract if title and company are empty
      if (!formData.title && !formData.company_name) {
        extractMetadata(formData.url);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.url, formData.title, formData.company_name, extractMetadata]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ImportJobInput, string>> = {};

    if (!formData.url.trim()) {
      newErrors.url = 'Job URL is required';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (formData.salary_min && formData.salary_max && formData.salary_min > formData.salary_max) {
      newErrors.salary_max = 'Max salary must be greater than min salary';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const submitData: ImportJobInput = {
        ...formData,
        url: formData.url.startsWith('http') ? formData.url : `https://${formData.url}`,
      };

      if (trackInCrm && onImportAndTrack) {
        await onImportAndTrack(submitData);
      } else {
        await onImport(submitData);
      }
      handleClose();
    } catch (error) {
      console.error('Error importing job:', error);
      setErrors({
        url: error instanceof Error ? error.message : 'Failed to import job',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Job from URL"
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Manually import a job posting by entering its URL and details. This is the recommended
          way to track jobs from LinkedIn and other job boards.
        </p>

        {/* URL Input */}
        <div className="relative">
          <Input
            id="url"
            label="Job Posting URL"
            type="text"
            value={formData.url}
            onChange={(e) => {
              setFormData({ ...formData, url: e.target.value, title: '', company_name: '', location: '', description_snippet: '' });
              setExtractStatus('idle');
              setExtractError(null);
            }}
            error={errors.url}
            placeholder="e.g. linkedin.com/jobs/view/1234567890"
            required
          />
          <div className="absolute right-3 top-9 flex items-center gap-1">
            {extracting ? (
              <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />
            ) : extractStatus === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : extractStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : (
              <Link2 className="h-4 w-4 text-gray-400" />
            )}
          </div>
          {extracting && (
            <p className="text-xs text-primary-600 mt-1">Extracting job details...</p>
          )}
          {extractStatus === 'success' && !extracting && (
            <p className="text-xs text-green-600 mt-1">Job details extracted successfully</p>
          )}
          {extractStatus === 'error' && !extracting && extractError && (
            <p className="text-xs text-amber-600 mt-1">{extractError}</p>
          )}
        </div>

        {/* Title & Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
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
            <Briefcase className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
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
            <Building2 className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              id="location"
              label="Location"
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Dubai, UAE"
            />
            <MapPin className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
          </div>

          <div>
            <label htmlFor="location_type" className="block text-sm font-medium text-gray-700 mb-1">
              Work Type
            </label>
            <select
              id="location_type"
              value={formData.location_type || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location_type: (e.target.value as LocationType) || undefined,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select type...</option>
              {LOCATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Salary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <Input
              id="salary_min"
              label="Min Salary"
              type="number"
              value={formData.salary_min || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  salary_min: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              placeholder="e.g. 100000"
            />
            <DollarSign className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <Input
              id="salary_max"
              label="Max Salary"
              type="number"
              value={formData.salary_max || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  salary_max: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              error={errors.salary_max}
              placeholder="e.g. 150000"
            />
          </div>

          <div>
            <label htmlFor="salary_currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              id="salary_currency"
              value={formData.salary_currency || 'USD'}
              onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="SAR">SAR</option>
              <option value="QAR">QAR</option>
              <option value="KWD">KWD</option>
              <option value="BHD">BHD</option>
              <option value="OMR">OMR</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description_snippet" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            id="description_snippet"
            value={formData.description_snippet || ''}
            onChange={(e) => setFormData({ ...formData, description_snippet: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Brief description of the role..."
          />
        </div>

        {/* Track in CRM checkbox */}
        {onImportAndTrack && (
          <div className="flex items-center">
            <input
              id="track_in_crm"
              type="checkbox"
              checked={trackInCrm}
              onChange={(e) => setTrackInCrm(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="track_in_crm" className="ml-2 block text-sm text-gray-700">
              Also add to CRM pipeline
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {trackInCrm ? 'Import & Track' : 'Import Job'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
