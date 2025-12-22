import { Check } from 'lucide-react';

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
}

export default function WizardStepper({
  currentStep,
  totalSteps,
  completedSteps,
}: WizardStepperProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Question {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {completedSteps.length} completed
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isCurrent = stepNum === currentStep;
          const isPast = stepNum < currentStep;

          return (
            <div key={stepNum} className="flex-1 flex items-center">
              {/* Step circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                      : isPast
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNum
                )}
              </div>

              {/* Connector line */}
              {stepNum < totalSteps && (
                <div
                  className={`
                    flex-1 h-1 mx-1 rounded-full transition-all duration-200
                    ${
                      isCompleted || isPast
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
