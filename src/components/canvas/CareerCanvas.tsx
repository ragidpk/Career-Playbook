import { useState } from 'react';
import Card from '../shared/Card';
import CanvasSection from './CanvasSection';
import CanvasProgress from './CanvasProgress';
import type { Database } from '../../types/database.types';

type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

const CANVAS_SECTIONS = [
  { key: 'section_1_helpers' as const, label: 'Who helps you succeed?' },
  { key: 'section_2_activities' as const, label: 'What are the key activities in your role?' },
  { key: 'section_3_value' as const, label: 'What do others gain from you?' },
  { key: 'section_4_interactions' as const, label: 'How do you interact with others?' },
  { key: 'section_5_convince' as const, label: 'Who do you need to convince?' },
  { key: 'section_6_skills' as const, label: 'What are your skills and interests?' },
  { key: 'section_7_motivation' as const, label: 'What motivates you?' },
  { key: 'section_8_sacrifices' as const, label: 'What sacrifices are you willing to make?' },
  { key: 'section_9_outcomes' as const, label: 'What outcomes do you want?' },
];

interface CareerCanvasProps {
  canvas: Partial<CareerCanvas>;
  onSave: (data: Partial<CareerCanvas>) => void;
  isSaving: boolean;
}

export default function CareerCanvas({ canvas, onSave, isSaving }: CareerCanvasProps) {
  const [localCanvas, setLocalCanvas] = useState<Partial<CareerCanvas>>({});

  // Merge canvas data with local state
  const currentCanvas = { ...canvas, ...localCanvas };

  const handleChange = (key: keyof CareerCanvas, value: string) => {
    setLocalCanvas((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = () => {
    if (Object.keys(localCanvas).length > 0) {
      onSave(localCanvas);
      setLocalCanvas({});
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-display font-bold text-gray-900">
            {currentCanvas.target_role || currentCanvas.name || 'Career Canvas'}
          </h1>
          {/* Save Status Indicator */}
          <div className="flex items-center gap-2">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-sm text-gray-600">Saving...</span>
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 text-success-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-sm text-gray-600">Auto-saved</span>
              </>
            )}
          </div>
        </div>

        {/* Career Canvas (Target Role) Input */}
        <div className="mb-6">
          <label htmlFor="target-role" className="block text-sm font-medium text-gray-700 mb-2">
            Career Canvas
          </label>
          <input
            id="target-role"
            type="text"
            placeholder="e.g., Senior Product Manager, Data Scientist, UX Designer..."
            value={currentCanvas.target_role || ''}
            onChange={(e) => {
              handleChange('target_role', e.target.value);
              // Also update name to match target_role for display purposes
              handleChange('name', e.target.value || 'My Career Canvas');
            }}
            onBlur={handleBlur}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-lg font-medium"
          />
          <p className="mt-1 text-sm text-gray-500">
            What role are you targeting? This helps focus your career planning.
          </p>
        </div>

        <p className="text-gray-600 mb-6">
          Map out your career journey by answering these 9 essential questions. Your responses
          auto-save as you type.
        </p>

        {/* Progress Bar */}
        <Card>
          <CanvasProgress percentage={currentCanvas.completion_percentage || 0} />
        </Card>
      </div>

      {/* Canvas Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CANVAS_SECTIONS.map((section, index) => (
          <Card key={section.key} className={index === 8 ? 'lg:col-span-2' : ''}>
            <CanvasSection
              label={section.label}
              value={(currentCanvas[section.key] as string) || ''}
              onChange={(value) => handleChange(section.key, value)}
              onBlur={handleBlur}
              maxLength={500}
            />
          </Card>
        ))}
      </div>

      {/* Footer Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Your Career Canvas helps you clarify your career direction and identify opportunities
          that align with your goals.
        </p>
      </div>
    </div>
  );
}
