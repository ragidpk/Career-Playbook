import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye } from 'lucide-react';
import WizardStepper from './WizardStepper';
import WizardQuestion from './WizardQuestion';
import { getAISuggestion } from '../../services/canvas-ai.service';
import type { Database } from '../../types/database.types';

type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

// Question configuration
const QUESTIONS = [
  {
    key: 'section_1_helpers',
    title: 'Who helps you succeed?',
    description: 'Identify the people, mentors, or resources that support your career growth. Think about colleagues, managers, mentors, or professional networks.',
  },
  {
    key: 'section_2_activities',
    title: 'What are the key activities in your role?',
    description: 'List the main tasks and responsibilities you perform or will perform in your target role. Consider daily activities, projects, and strategic work.',
  },
  {
    key: 'section_3_value',
    title: 'What value do others gain from you?',
    description: 'Describe the unique value you bring to your team and organization. What problems do you solve? What impact do you create?',
  },
  {
    key: 'section_4_interactions',
    title: 'How do you interact with others?',
    description: 'Explain how you collaborate and communicate with colleagues, stakeholders, and clients. Consider your communication style and collaboration patterns.',
  },
  {
    key: 'section_5_convince',
    title: 'Who do you need to convince?',
    description: 'Identify key stakeholders or decision-makers you need to influence. Think about who needs to believe in your abilities and vision.',
  },
  {
    key: 'section_6_skills',
    title: 'What are your skills and interests?',
    description: 'List your current skills and areas of interest. Include both technical skills and soft skills that are relevant to your career goals.',
  },
  {
    key: 'section_7_motivation',
    title: 'What motivates you?',
    description: 'Describe what drives you in your career. What gets you excited to work? What type of work energizes you?',
  },
  {
    key: 'section_8_sacrifices',
    title: 'What sacrifices are you willing to make?',
    description: 'Consider what you\'re prepared to give up or change to achieve your career goals. This could include time, comfort zone, or current stability.',
  },
  {
    key: 'section_9_outcomes',
    title: 'What outcomes do you want?',
    description: 'Define your desired end state. What does success look like? What specific achievements are you working towards?',
  },
];

interface CanvasWizardProps {
  canvas: CareerCanvas;
  onSave: (data: Partial<CareerCanvas>) => void | Promise<void>;
  onSaveImmediate?: (data: Partial<CareerCanvas>) => Promise<CareerCanvas>;
  onComplete: () => void;
  isSaving: boolean;
}

export default function CanvasWizard({
  canvas,
  onSave,
  onSaveImmediate,
  onComplete,
  isSaving,
}: CanvasWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Initialize answers from canvas
  useEffect(() => {
    const initialAnswers: Record<string, string> = {};
    QUESTIONS.forEach((q) => {
      const value = (canvas as any)[q.key];
      if (value) {
        initialAnswers[q.key] = value;
      }
    });
    setAnswers(initialAnswers);
  }, [canvas]);

  // Calculate completed steps
  const completedSteps = QUESTIONS
    .map((q, i) => ({ step: i + 1, key: q.key }))
    .filter(({ key }) => answers[key]?.trim().length > 0)
    .map(({ step }) => step);

  // Debounced save
  const debouncedSave = useCallback(
    (data: Partial<CareerCanvas>) => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      const timeout = setTimeout(() => {
        onSave(data);
      }, 2000);
      setSaveTimeout(timeout);
    },
    [onSave, saveTimeout]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const currentQuestion = QUESTIONS[currentStep - 1];
  const currentValue = answers[currentQuestion.key] || '';

  const handleAnswerChange = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.key]: value };
    setAnswers(newAnswers);
    debouncedSave({ [currentQuestion.key]: value });
  };

  const handleGetAISuggestion = async () => {
    return getAISuggestion(
      currentStep,
      (canvas as any).current_role || '',
      canvas.target_role || '',
      answers
    );
  };

  const handleNext = async () => {
    // Save current answer before moving - always use immediate save when available
    // This prevents race conditions with debounced saves during navigation
    if (currentValue.trim() && onSaveImmediate) {
      // Clear any pending debounced save
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        setSaveTimeout(null);
      }
      try {
        await onSaveImmediate({ [currentQuestion.key]: currentValue });
      } catch (error) {
        console.error('Failed to save:', error);
        // Continue anyway - user can retry
      }
    } else if (currentValue.trim()) {
      // Fallback to debounced save if immediate not available
      onSave({ [currentQuestion.key]: currentValue });
    }

    if (currentStep < QUESTIONS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Completed all questions
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === QUESTIONS.length;
  const canProceed = currentValue.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <WizardStepper
          currentStep={currentStep}
          totalSteps={QUESTIONS.length}
          completedSteps={completedSteps}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 mb-6">
        <WizardQuestion
          questionNumber={currentStep}
          questionTitle={currentQuestion.title}
          questionDescription={currentQuestion.description}
          currentValue={currentValue}
          currentRole={(canvas as any).current_role || 'Current Role'}
          targetRole={canvas.target_role || 'Target Role'}
          onChange={handleAnswerChange}
          onGetAISuggestion={handleGetAISuggestion}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Saving indicator */}
        {isSaving && (
          <span className="text-sm text-gray-500">Saving...</span>
        )}

        <button
          onClick={handleNext}
          disabled={!canProceed || isSaving}
          className={`inline-flex items-center gap-2 px-6 py-2.5 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLastStep
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isLastStep ? (
            <>
              <Check className="w-4 h-4" />
              Complete & View Canvas
            </>
          ) : (
            <>
              Next Question
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Skip to view option */}
      {completedSteps.length >= 3 && (
        <div className="mt-6 text-center">
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Skip to Canvas View ({completedSteps.length}/9 complete)
          </button>
        </div>
      )}
    </div>
  );
}
