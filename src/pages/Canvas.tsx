import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCanvas } from '../hooks/useCanvas';
import Card from '../components/shared/Card';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import CanvasSection from '../components/canvas/CanvasSection';
import CanvasProgress from '../components/canvas/CanvasProgress';
import type { Database } from '../types/database.types';

type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

const CANVAS_SECTIONS = [
  { key: 'section_1_helpers', label: 'Who do you help?' },
  { key: 'section_2_activities', label: 'What activities do you do?' },
  { key: 'section_3_value', label: 'What value do you create?' },
  { key: 'section_4_interactions', label: 'How do customers interact?' },
  { key: 'section_5_convince', label: 'How do you convince them?' },
  { key: 'section_6_skills', label: 'What skills are needed?' },
  { key: 'section_7_motivation', label: 'What motivates you?' },
  { key: 'section_8_sacrifices', label: 'What are you willing to sacrifice?' },
  { key: 'section_9_outcomes', label: 'What outcomes do you expect?' },
] as const;

export default function Canvas() {
  const { user } = useAuth();
  const { canvas, isLoading, save, isSaving } = useCanvas(user?.id || '');
  const [localCanvas, setLocalCanvas] = useState<Partial<CareerCanvas>>({});

  // Merge canvas data with local state
  const currentCanvas = { ...canvas, ...localCanvas };

  const handleChange = (key: keyof CareerCanvas, value: string) => {
    setLocalCanvas((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = () => {
    if (Object.keys(localCanvas).length > 0) {
      save(localCanvas);
      setLocalCanvas({});
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Career Canvas</h1>
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
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-sm text-gray-600">Saved</span>
                </>
              )}
            </div>
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
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Your Career Canvas helps you clarify your career direction and identify opportunities
            that align with your goals.
          </p>
        </div>
      </div>
    </div>
  );
}
