import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Save,
} from 'lucide-react';
import type { CareerPlanTemplate, TemplateWeek } from '../../types/database.types';

const ICONS = [
  { value: 'code', label: 'Code' },
  { value: 'lightbulb', label: 'Lightbulb' },
  { value: 'refresh', label: 'Refresh' },
  { value: 'chart', label: 'Chart' },
  { value: 'users', label: 'Users' },
  { value: 'target', label: 'Target' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'trending', label: 'Trending' },
];

const COLORS = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
];

const THEMES: { value: TemplateWeek['theme']; label: string; color: string }[] = [
  { value: 'foundation', label: 'Foundation', color: 'bg-blue-100 text-blue-700' },
  { value: 'skill_development', label: 'Skill Development', color: 'bg-green-100 text-green-700' },
  { value: 'networking', label: 'Networking', color: 'bg-purple-100 text-purple-700' },
  { value: 'job_search', label: 'Job Search', color: 'bg-orange-100 text-orange-700' },
];

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<CareerPlanTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  template: CareerPlanTemplate | null;
}

export default function TemplateEditorModal({
  isOpen,
  onClose,
  onSave,
  template,
}: TemplateEditorModalProps) {
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('target');
  const [color, setColor] = useState('blue');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [weeks, setWeeks] = useState<TemplateWeek[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'weeks'>('details');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setTargetRole(template.target_role);
      setDescription(template.description);
      setIcon(template.icon);
      setColor(template.color);
      setIsFeatured(template.is_featured);
      setIsActive(template.is_active);
      setWeeks(template.weeks || generateDefaultWeeks());
    } else {
      resetForm();
    }
  }, [template, isOpen]);

  const resetForm = () => {
    setName('');
    setTargetRole('');
    setDescription('');
    setIcon('target');
    setColor('blue');
    setIsFeatured(false);
    setIsActive(true);
    setWeeks(generateDefaultWeeks());
    setExpandedWeeks(new Set());
    setActiveTab('details');
  };

  const generateDefaultWeeks = (): TemplateWeek[] => {
    return Array.from({ length: 12 }, (_, i) => ({
      week: i + 1,
      title: `Week ${i + 1}`,
      theme: i < 3 ? 'foundation' : i < 6 ? 'skill_development' : i < 9 ? 'networking' : 'job_search',
      goals: [''],
    }));
  };

  const toggleWeekExpanded = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const updateWeek = (weekNumber: number, updates: Partial<TemplateWeek>) => {
    setWeeks((prev) =>
      prev.map((w) => (w.week === weekNumber ? { ...w, ...updates } : w))
    );
  };

  const addGoal = (weekNumber: number) => {
    setWeeks((prev) =>
      prev.map((w) =>
        w.week === weekNumber ? { ...w, goals: [...w.goals, ''] } : w
      )
    );
  };

  const updateGoal = (weekNumber: number, goalIndex: number, value: string) => {
    setWeeks((prev) =>
      prev.map((w) =>
        w.week === weekNumber
          ? {
              ...w,
              goals: w.goals.map((g, i) => (i === goalIndex ? value : g)),
            }
          : w
      )
    );
  };

  const removeGoal = (weekNumber: number, goalIndex: number) => {
    setWeeks((prev) =>
      prev.map((w) =>
        w.week === weekNumber
          ? { ...w, goals: w.goals.filter((_, i) => i !== goalIndex) }
          : w
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetRole.trim() || !description.trim()) return;

    setIsSaving(true);
    try {
      // Clean up empty goals
      const cleanedWeeks = weeks.map((w) => ({
        ...w,
        goals: w.goals.filter((g) => g.trim()),
      }));

      await onSave({
        name: name.trim(),
        target_role: targetRole.trim(),
        description: description.trim(),
        icon,
        color,
        is_featured: isFeatured,
        is_active: isActive,
        weeks: cleanedWeeks,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {template ? 'Edit Template' : 'Create New Template'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Template Details
            </button>
            <button
              onClick={() => setActiveTab('weeks')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'weeks'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              12-Week Plan
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            {activeTab === 'details' ? (
              <div className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Software Engineer Growth"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                {/* Target Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Role *
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe who this template is for and what they'll achieve..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    required
                  />
                </div>

                {/* Icon & Color */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {ICONS.map((i) => (
                        <option key={i.value} value={i.value}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setColor(c.value)}
                          className={`w-8 h-8 rounded-lg ${c.class} ${
                            color === c.value
                              ? 'ring-2 ring-offset-2 ring-gray-400'
                              : ''
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Template</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active (Visible to users)</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Define the weekly milestones for this 12-week career plan template.
                </p>

                {weeks.map((week) => {
                  const isExpanded = expandedWeeks.has(week.week);
                  const themeConfig = THEMES.find((t) => t.value === week.theme);

                  return (
                    <div
                      key={week.week}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      {/* Week Header */}
                      <button
                        type="button"
                        onClick={() => toggleWeekExpanded(week.week)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">Week {week.week}</span>
                          <span className="text-gray-500">-</span>
                          <span className="text-gray-700">{week.title || 'Untitled'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${themeConfig?.color}`}>
                            {themeConfig?.label}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Week Content */}
                      {isExpanded && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                          {/* Title */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Week Title
                            </label>
                            <input
                              type="text"
                              value={week.title}
                              onChange={(e) => updateWeek(week.week, { title: e.target.value })}
                              placeholder="e.g., Skills & Gap Assessment"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          {/* Theme */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Theme
                            </label>
                            <select
                              value={week.theme}
                              onChange={(e) =>
                                updateWeek(week.week, { theme: e.target.value as TemplateWeek['theme'] })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              {THEMES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Goals */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Goals
                            </label>
                            <div className="space-y-2">
                              {week.goals.map((goal, goalIndex) => (
                                <div key={goalIndex} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={goal}
                                    onChange={(e) => updateGoal(week.week, goalIndex, e.target.value)}
                                    placeholder={`Goal ${goalIndex + 1}`}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                  {week.goals.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeGoal(week.week, goalIndex)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addGoal(week.week)}
                                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                              >
                                <Plus className="w-4 h-4" />
                                Add Goal
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim() || !targetRole.trim() || !description.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {template ? 'Update Template' : 'Create Template'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
