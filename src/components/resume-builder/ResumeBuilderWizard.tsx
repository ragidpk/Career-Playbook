import { useEffect } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useResumeEditor } from '../../hooks/useResumeBuilder';
import { WIZARD_STEPS } from '../../types/resumeBuilder.types';
import type { WizardStep } from '../../types/resumeBuilder.types';
import PersonalInfoStep from './steps/PersonalInfoStep';
import SummaryStep from './steps/SummaryStep';
import ExperienceStep from './steps/ExperienceStep';
import EducationStep from './steps/EducationStep';
import SkillsStep from './steps/SkillsStep';
import ReviewStep from './steps/ReviewStep';
import LoadingSpinner from '../shared/LoadingSpinner';

interface ResumeBuilderWizardProps {
  resumeId: string;
  onBack: () => void;
}

export default function ResumeBuilderWizard({ resumeId, onBack }: ResumeBuilderWizardProps) {
  const {
    resume,
    isLoading,
    error,
    isSaving,
    currentStep,
    setCurrentStep,
    updatePersonalInfo,
    updateSummary,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    removeSkill,
    addCertification,
    removeCertification,
    selectTemplate,
    renameResume,
  } = useResumeEditor(resumeId);

  // Reset to first step when resume changes
  useEffect(() => {
    setCurrentStep('personal');
  }, [resumeId, setCurrentStep]);

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      setCurrentStep(WIZARD_STEPS[nextIndex].id);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(WIZARD_STEPS[prevIndex].id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error || 'Resume not found'}
          </div>
          <button
            onClick={onBack}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Back to Resumes
          </button>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'personal':
        return (
          <PersonalInfoStep
            data={resume.personal_info}
            onUpdate={updatePersonalInfo}
            onNext={goNext}
          />
        );
      case 'summary':
        return (
          <SummaryStep
            summary={resume.professional_summary || ''}
            onUpdate={updateSummary}
            onNext={goNext}
            onPrev={goPrev}
          />
        );
      case 'experience':
        return (
          <ExperienceStep
            experiences={resume.work_experience}
            onAdd={addWorkExperience}
            onUpdate={updateWorkExperience}
            onRemove={removeWorkExperience}
            onNext={goNext}
            onPrev={goPrev}
          />
        );
      case 'education':
        return (
          <EducationStep
            educations={resume.education}
            onAdd={addEducation}
            onUpdate={updateEducation}
            onRemove={removeEducation}
            onNext={goNext}
            onPrev={goPrev}
          />
        );
      case 'skills':
        return (
          <SkillsStep
            skills={resume.skills}
            certifications={resume.certifications}
            onAddSkill={addSkill}
            onRemoveSkill={removeSkill}
            onAddCertification={addCertification}
            onRemoveCertification={removeCertification}
            onNext={goNext}
            onPrev={goPrev}
          />
        );
      case 'review':
        return (
          <ReviewStep
            resume={resume}
            onSelectTemplate={selectTemplate}
            onRename={renameResume}
            onPrev={goPrev}
            onBack={onBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                {resume.name}
              </h1>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {WIZARD_STEPS.map((step, index) => {
                const isComplete = index < currentStepIndex;
                const isCurrent = step.id === currentStep;

                return (
                  <li key={step.id} className="relative flex-1">
                    <button
                      onClick={() => goToStep(step.id)}
                      className="group flex flex-col items-center w-full"
                    >
                      <span className="flex items-center">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                            isComplete
                              ? 'bg-primary-600 border-primary-600'
                              : isCurrent
                              ? 'border-primary-600 bg-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isComplete ? (
                            <Check className="h-5 w-5 text-white" />
                          ) : (
                            <span
                              className={`text-sm font-medium ${
                                isCurrent ? 'text-primary-600' : 'text-gray-500'
                              }`}
                            >
                              {index + 1}
                            </span>
                          )}
                        </span>
                      </span>
                      <span
                        className={`mt-2 text-xs font-medium hidden sm:block ${
                          isCurrent ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>
                    {/* Connector line */}
                    {index < WIZARD_STEPS.length - 1 && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-0.5 ${
                          index < currentStepIndex ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                        style={{ transform: 'translateX(50%)' }}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStep()}
      </div>
    </div>
  );
}
