import { useState } from 'react';
import { Bot, Code, Copy, Check, ChevronDown, ChevronUp, Zap, FileCode, Edit2, X, Save, RefreshCw } from 'lucide-react';
import { useAdminPrompts } from '../../hooks/useAdminPrompts';
import { AVAILABLE_MODELS, type AIPrompt, type AIPromptUpdate } from '../../services/ai-prompts.service';
import LoadingSpinner from '../shared/LoadingSpinner';

interface EditModalProps {
  prompt: AIPrompt;
  onSave: (id: string, updates: AIPromptUpdate) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

function EditModal({ prompt, onSave, onClose, isSaving }: EditModalProps) {
  const [formData, setFormData] = useState({
    name: prompt.name,
    description: prompt.description || '',
    model: prompt.model,
    max_tokens: prompt.max_tokens,
    temperature: prompt.temperature,
    system_prompt: prompt.system_prompt,
    user_prompt_template: prompt.user_prompt_template,
    is_active: prompt.is_active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(prompt.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit AI Prompt</h2>
              <p className="text-sm text-gray-500">{prompt.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Model Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                min={100}
                max={8000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (0-1)
              </label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                min={0}
                max={1}
                step={0.1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Prompt
            </label>
            <textarea
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              required
            />
          </div>

          {/* User Prompt Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Prompt Template
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Use placeholders like {'{variableName}'} for dynamic content
            </p>
            <textarea
              value={formData.user_prompt_template}
              onChange={(e) => setFormData({ ...formData, user_prompt_template: e.target.value })}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              required
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
            <span className="text-sm text-gray-700">Active</span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  onEdit,
}: {
  prompt: AIPrompt;
  onEdit: (prompt: AIPrompt) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${prompt.is_active ? 'border-gray-200' : 'border-amber-300 bg-amber-50/30'}`}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${prompt.is_active ? 'bg-purple-100' : 'bg-amber-100'}`}>
              <Bot className={`w-5 h-5 ${prompt.is_active ? 'text-purple-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                {!prompt.is_active && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{prompt.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {prompt.model}
                </span>
                <span className="text-xs text-gray-500">
                  Max Tokens: {prompt.max_tokens}
                </span>
                <span className="text-xs text-gray-500">
                  Temp: {prompt.temperature}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prompt);
              }}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit prompt"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
          {/* ID */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FileCode className="w-4 h-4" />
              Prompt ID
            </div>
            <code className="block text-xs bg-gray-100 p-2 rounded text-gray-800 font-mono">
              {prompt.id}
            </code>
          </div>

          {/* System Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Code className="w-4 h-4" />
                System Prompt
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(prompt.system_prompt, 'system');
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"
              >
                {copiedField === 'system' ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
              {prompt.system_prompt}
            </pre>
          </div>

          {/* User Prompt Template */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Code className="w-4 h-4" />
                User Prompt Template
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(prompt.user_prompt_template, 'user');
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"
              >
                {copiedField === 'user' ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-60">
              {prompt.user_prompt_template}
            </pre>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            Last updated: {new Date(prompt.updated_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIPromptsPanel() {
  const { prompts, isLoading, error, refresh, update, isUpdating } = useAdminPrompts();
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);

  const handleSave = async (id: string, updates: AIPromptUpdate) => {
    await update(id, updates);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Error loading AI prompts: {error}
      </div>
    );
  }

  const activePrompts = prompts.filter(p => p.is_active);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{prompts.length}</p>
              <p className="text-sm text-gray-600">Total AI Prompts</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activePrompts.length}</p>
              <p className="text-sm text-gray-600">Active Prompts</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileCode className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {[...new Set(prompts.map(p => p.model))].length}
              </p>
              <p className="text-sm text-gray-600">
                Models: {[...new Set(prompts.map(p => p.model))].join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={() => refresh()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-800">Editable AI Prompts</h3>
            <p className="text-sm text-blue-700 mt-1">
              Changes take effect immediately. Edge functions fetch prompts from the database on each request.
              Use placeholders like {'{variableName}'} in user prompt templates for dynamic content.
            </p>
          </div>
        </div>
      </div>

      {/* Prompts List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All AI Prompts</h2>
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={setEditingPrompt}
            />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingPrompt && (
        <EditModal
          prompt={editingPrompt}
          onSave={handleSave}
          onClose={() => setEditingPrompt(null)}
          isSaving={isUpdating}
        />
      )}
    </div>
  );
}
