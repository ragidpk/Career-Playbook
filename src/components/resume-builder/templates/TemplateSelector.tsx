import { Check } from 'lucide-react';
import type { TemplateType } from '../../../types/resumeBuilder.types';

interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  onSelect: (template: TemplateType) => void;
}

const templates: { id: TemplateType; name: string; description: string }[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, contemporary design with accent colors',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional professional layout',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple, elegant with lots of white space',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Formal style for corporate environments',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design for creative industries',
  },
];

export default function TemplateSelector({ selectedTemplate, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`relative p-4 rounded-lg border-2 transition-all text-left ${
            selectedTemplate === template.id
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          {/* Selection indicator */}
          {selectedTemplate === template.id && (
            <div className="absolute top-2 right-2">
              <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            </div>
          )}

          {/* Template Preview */}
          <div className="aspect-[8.5/11] bg-gray-100 rounded mb-3 flex flex-col p-2">
            {/* Mini preview based on template style */}
            {template.id === 'modern' && (
              <>
                <div className="h-3 bg-primary-400 rounded mb-2" />
                <div className="h-1 w-3/4 bg-gray-300 rounded mb-1" />
                <div className="h-1 w-1/2 bg-gray-300 rounded mb-2" />
                <div className="flex-1 space-y-1">
                  <div className="h-1 bg-gray-200 rounded" />
                  <div className="h-1 bg-gray-200 rounded" />
                  <div className="h-1 w-3/4 bg-gray-200 rounded" />
                </div>
              </>
            )}
            {template.id === 'classic' && (
              <>
                <div className="h-2 w-2/3 bg-gray-400 rounded mx-auto mb-2" />
                <div className="h-1 w-1/2 bg-gray-300 rounded mx-auto mb-2" />
                <div className="border-t border-gray-300 pt-2 flex-1 space-y-1">
                  <div className="h-1 bg-gray-200 rounded" />
                  <div className="h-1 bg-gray-200 rounded" />
                  <div className="h-1 w-3/4 bg-gray-200 rounded" />
                </div>
              </>
            )}
            {template.id === 'minimal' && (
              <>
                <div className="h-2 w-1/2 bg-gray-400 rounded mb-2" />
                <div className="h-1 w-1/3 bg-gray-300 rounded mb-4" />
                <div className="flex-1 space-y-2">
                  <div className="h-1 bg-gray-200 rounded" />
                  <div className="h-1 bg-gray-200 rounded" />
                </div>
              </>
            )}
            {template.id === 'professional' && (
              <>
                <div className="h-4 bg-gray-700 rounded mb-2 flex items-center justify-center">
                  <div className="h-1 w-1/2 bg-white rounded" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="h-1 bg-gray-200 rounded" />
                  <div className="h-1 bg-gray-200 rounded" />
                  <div className="h-1 w-3/4 bg-gray-200 rounded" />
                </div>
              </>
            )}
            {template.id === 'creative' && (
              <div className="flex h-full">
                <div className="w-1/3 bg-indigo-400 rounded-l" />
                <div className="flex-1 pl-2 space-y-1 py-1">
                  <div className="h-1 bg-gray-300 rounded" />
                  <div className="h-1 w-3/4 bg-gray-200 rounded" />
                  <div className="h-1 bg-gray-200 rounded" />
                </div>
              </div>
            )}
          </div>

          <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
          <p className="text-xs text-gray-500 mt-1">{template.description}</p>
        </button>
      ))}
    </div>
  );
}
