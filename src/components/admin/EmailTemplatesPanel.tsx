import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Mail, Save, RefreshCw, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../shared/Button';

interface EmailConfig {
  subjects: {
    confirmation: string;
    recovery: string;
    invite: string;
    magic_link: string;
    email_change: string;
  };
  templates: {
    confirmation: string;
    recovery: string;
    invite: string;
    magic_link: string;
    email_change: string;
  };
  smtp: {
    sender_name: string;
    admin_email: string;
  };
}

type TemplateType = 'confirmation' | 'recovery' | 'invite' | 'magic_link' | 'email_change';

const TEMPLATE_LABELS: Record<TemplateType, { name: string; description: string }> = {
  confirmation: {
    name: 'Email Confirmation',
    description: 'Sent when a new user signs up to verify their email',
  },
  recovery: {
    name: 'Password Recovery',
    description: 'Sent when a user requests to reset their password',
  },
  invite: {
    name: 'User Invitation',
    description: 'Sent when inviting a new user to the platform',
  },
  magic_link: {
    name: 'Magic Link',
    description: 'Sent for passwordless login',
  },
  email_change: {
    name: 'Email Change',
    description: 'Sent when a user changes their email address',
  },
};

export default function EmailTemplatesPanel() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('confirmation');
  const [editedSubject, setEditedSubject] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error: fnError } = await supabase.functions.invoke('manage-email-templates', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setConfig(data);
      setEditedSubject(data.subjects[selectedTemplate] || '');
      setEditedContent(data.templates[selectedTemplate] || '');
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (config) {
      setEditedSubject(config.subjects[selectedTemplate] || '');
      setEditedContent(config.templates[selectedTemplate] || '');
      setHasChanges(false);
    }
  }, [selectedTemplate, config]);

  const handleSubjectChange = (value: string) => {
    setEditedSubject(value);
    setHasChanges(true);
  };

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error: fnError } = await supabase.functions.invoke('manage-email-templates', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          templateType: selectedTemplate,
          subject: editedSubject,
          content: editedContent,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      // Update local state
      if (config) {
        setConfig({
          ...config,
          subjects: { ...config.subjects, [selectedTemplate]: editedSubject },
          templates: { ...config.templates, [selectedTemplate]: editedContent },
        });
      }

      setSuccess('Template saved successfully!');
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
          <p className="text-sm text-gray-500">
            Customize the emails sent to users for authentication and notifications
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadTemplates}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* SMTP Info */}
      {config?.smtp && (
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
          <Mail className="h-5 w-5 text-gray-400" />
          <div className="text-sm">
            <span className="text-gray-500">Sender:</span>{' '}
            <span className="font-medium text-gray-900">
              {config.smtp.sender_name} &lt;{config.smtp.admin_email}&gt;
            </span>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-error-500" />
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success-500" />
          <p className="text-sm text-success-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1 space-y-2">
          {(Object.keys(TEMPLATE_LABELS) as TemplateType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTemplate(type)}
              className={`w-full text-left p-3 rounded-xl transition-colors ${
                selectedTemplate === type
                  ? 'bg-primary-50 border-2 border-primary-500'
                  : 'bg-white border-2 border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className={`h-4 w-4 ${
                  selectedTemplate === type ? 'text-primary-500' : 'text-gray-400'
                }`} />
                <div>
                  <p className={`font-medium text-sm ${
                    selectedTemplate === type ? 'text-primary-700' : 'text-gray-900'
                  }`}>
                    {TEMPLATE_LABELS[type].name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {TEMPLATE_LABELS[type].description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">
              {TEMPLATE_LABELS[selectedTemplate].name}
            </h3>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Subject
              </label>
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter email subject..."
              />
            </div>

            {/* Template Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTML Template
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Available variables: {'{{ .ConfirmationURL }}'}, {'{{ .Email }}'}, {'{{ .SiteURL }}'}, {'{{ .Token }}'}
              </p>
              <textarea
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                placeholder="Enter HTML template..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {hasChanges ? 'You have unsaved changes' : 'No changes'}
              </p>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="font-medium text-gray-900 mb-4">Preview</h4>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: editedContent
                    .replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, '#')
                    .replace(/\{\{\s*\.Email\s*\}\}/g, 'user@example.com')
                    .replace(/\{\{\s*\.SiteURL\s*\}\}/g, 'https://careerplaybook.app')
                    .replace(/\{\{\s*\.Token\s*\}\}/g, '123456')
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
