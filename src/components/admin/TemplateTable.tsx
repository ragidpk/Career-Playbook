import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Code,
  Lightbulb,
  RefreshCw,
  BarChart3,
  Users,
  Target,
  Briefcase,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import type { CareerPlanTemplate } from '../../types/database.types';
import TemplateEditorModal from './TemplateEditorModal';
import { format } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  code: Code,
  lightbulb: Lightbulb,
  refresh: RefreshCw,
  chart: BarChart3,
  users: Users,
  target: Target,
  briefcase: Briefcase,
  graduation: GraduationCap,
  trending: TrendingUp,
};

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
};

interface TemplateTableProps {
  templates: CareerPlanTemplate[];
  onUpdate: (id: string, updates: Partial<CareerPlanTemplate>) => Promise<void>;
  onCreate: (template: Omit<CareerPlanTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
}

export default function TemplateTable({
  templates,
  onUpdate,
  onCreate,
  onDelete,
  onDuplicate,
}: TemplateTableProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CareerPlanTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: CareerPlanTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleSave = async (templateData: Omit<CareerPlanTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingTemplate) {
      await onUpdate(editingTemplate.id, templateData);
    } else {
      await onCreate(templateData);
    }
    setIsEditorOpen(false);
    setEditingTemplate(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleFeatured = async (template: CareerPlanTemplate) => {
    await onUpdate(template.id, { is_featured: !template.is_featured });
  };

  const handleToggleActive = async (template: CareerPlanTemplate) => {
    await onUpdate(template.id, { is_active: !template.is_active });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Career Plan Templates</h2>
          <p className="text-sm text-gray-500">{templates.length} templates available</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const Icon = iconMap[template.icon] || Target;
          const colors = colorMap[template.color] || colorMap.blue;

          return (
            <div
              key={template.id}
              className={`bg-white rounded-xl border ${
                template.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              } p-5 hover:shadow-md transition-all`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {template.name}
                      {template.is_featured && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{template.target_role}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={isDeleting === template.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span>{template.weeks?.length || 12} weeks</span>
                <span>Created {format(new Date(template.created_at), 'MMM d, yyyy')}</span>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFeatured(template)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      template.is_featured
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {template.is_featured ? (
                      <>
                        <Star className="w-3.5 h-3.5 fill-current" />
                        Featured
                      </>
                    ) : (
                      <>
                        <StarOff className="w-3.5 h-3.5" />
                        Feature
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      template.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {template.is_active ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hidden
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => onDuplicate(template.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-4">Create your first career plan template to get started.</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      )}

      {/* Editor Modal */}
      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSave}
        template={editingTemplate}
      />
    </div>
  );
}
