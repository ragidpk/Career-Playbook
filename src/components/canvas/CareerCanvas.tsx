import { useState } from 'react';
import { PenLine, Layout, ArrowLeft } from 'lucide-react';
import Card from '../shared/Card';
import CanvasSection from './CanvasSection';
import CanvasProgress from './CanvasProgress';
import type { Database } from '../../types/database.types';

type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

type CreationMode = 'options' | 'manual' | 'template';

const CANVAS_SECTIONS = [
  { key: 'section_1_helpers' as const, label: 'Who do I help?' },
  { key: 'section_2_activities' as const, label: 'What activities do I do?' },
  { key: 'section_3_value' as const, label: 'What value do I provide?' },
  { key: 'section_4_interactions' as const, label: 'How do I interact?' },
  { key: 'section_5_convince' as const, label: 'How do I convince them?' },
  { key: 'section_6_skills' as const, label: 'What skills do I need?' },
  { key: 'section_7_motivation' as const, label: 'What motivates me?' },
  { key: 'section_8_sacrifices' as const, label: 'What sacrifices am I willing to make?' },
  { key: 'section_9_outcomes' as const, label: 'What outcomes do I want?' },
];

interface CareerCanvasProps {
  canvas: Partial<CareerCanvas>;
  onSave: (data: Partial<CareerCanvas>) => void;
  isSaving: boolean;
}

export default function CareerCanvas({ canvas, onSave, isSaving }: CareerCanvasProps) {
  const [localCanvas, setLocalCanvas] = useState<Partial<CareerCanvas>>({});
  const [creationMode, setCreationMode] = useState<CreationMode>('options');

  // Merge canvas data with local state
  const currentCanvas = { ...canvas, ...localCanvas };

  // Check if canvas has any content
  const hasExistingContent = CANVAS_SECTIONS.some(
    (section) => canvas[section.key] && (canvas[section.key] as string).trim().length > 0
  );

  const handleChange = (key: keyof CareerCanvas, value: string) => {
    setLocalCanvas((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = () => {
    if (Object.keys(localCanvas).length > 0) {
      onSave(localCanvas);
      setLocalCanvas({});
    }
  };

  const handleBackToOptions = () => {
    setCreationMode('options');
  };

  // Show hero section only if no existing content and in options mode
  if (!hasExistingContent && creationMode === 'options') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Your Career Plans</h1>
          <p className="text-gray-600">
            Map out your career journey by answering 9 essential questions about your goals,
            skills, and aspirations.
          </p>
        </div>

        {/* Hero Section with Options */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <h2 className="text-xl font-display font-semibold text-gray-900 mb-2">
            Start Your Career Canvas
          </h2>
          <p className="text-gray-600 mb-8">
            Choose how you'd like to begin mapping your career journey
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Manually Card */}
            <button
              onClick={() => setCreationMode('manual')}
              className="group text-left bg-gray-50 hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-300 rounded-2xl p-6 transition-all duration-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-200 rounded-xl flex items-center justify-center transition-colors">
                  <PenLine className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Create Manually</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Answer 9 guided questions to build your personalized career canvas from scratch.
                Perfect for deep self-reflection.
              </p>
            </button>

            {/* Use a Template Card */}
            <button
              onClick={() => setCreationMode('template')}
              className="group text-left bg-gray-50 hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-300 rounded-2xl p-6 transition-all duration-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-200 rounded-xl flex items-center justify-center transition-colors">
                  <Layout className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Use a Template</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Start with a pre-filled template based on common career paths. Customize it to
                match your unique journey.
              </p>
            </button>
          </div>
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-3">
            <svg
              className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-blue-900">What is a Career Canvas?</h3>
              <p className="mt-1 text-sm text-blue-800">
                A Career Canvas helps you visualize and plan your career by answering key questions
                about who you help, what value you provide, your skills, motivations, and desired
                outcomes. It's a powerful tool for career clarity and direction.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show template selection (placeholder for now)
  if (creationMode === 'template') {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-card p-8">
          {/* Back Link */}
          <button
            onClick={handleBackToOptions}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to options
          </button>

          <h2 className="text-xl font-display font-semibold text-gray-900 mb-4">
            Choose a Template
          </h2>
          <p className="text-gray-600 mb-6">
            Templates are coming soon! For now, please use the manual creation option to build your
            career canvas.
          </p>
          <button
            onClick={() => setCreationMode('manual')}
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Create Manually Instead
          </button>
        </div>
      </div>
    );
  }

  // Show the canvas form (manual mode or has existing content)
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        {/* Back button only if came from options and no existing content */}
        {!hasExistingContent && (
          <button
            onClick={handleBackToOptions}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to options
          </button>
        )}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-display font-bold text-gray-900">Your Career Plans</h1>
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
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Your Career Plans helps you clarify your career direction and identify opportunities
          that align with your goals.
        </p>
      </div>
    </div>
  );
}
