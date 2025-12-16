import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import type { WorkExperience } from '../../../types/resumeBuilder.types';
import { useAIImprovement } from '../../../hooks/useResumeBuilder';

interface ExperienceStepProps {
  experiences: WorkExperience[];
  onAdd: (exp: WorkExperience) => void;
  onUpdate: (id: string, updates: Partial<WorkExperience>) => void;
  onRemove: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

const emptyExperience: Omit<WorkExperience, 'id'> = {
  company: '',
  position: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
  bullets: [''],
};

export default function ExperienceStep({
  experiences,
  onAdd,
  onUpdate,
  onRemove,
  onNext,
  onPrev,
}: ExperienceStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    experiences.length > 0 ? experiences[0].id : null
  );
  const [improvingBullet, setImprovingBullet] = useState<{ expId: string; index: number } | null>(null);
  const { improve, isImproving } = useAIImprovement();

  const handleAddExperience = () => {
    const newExp: WorkExperience = {
      ...emptyExperience,
      id: crypto.randomUUID(),
    };
    onAdd(newExp);
    setExpandedId(newExp.id);
  };

  const handleUpdateBullet = (expId: string, index: number, value: string) => {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp) return;

    const newBullets = [...exp.bullets];
    newBullets[index] = value;
    onUpdate(expId, { bullets: newBullets });
  };

  const handleAddBullet = (expId: string) => {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp) return;

    onUpdate(expId, { bullets: [...exp.bullets, ''] });
  };

  const handleRemoveBullet = (expId: string, index: number) => {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp || exp.bullets.length <= 1) return;

    const newBullets = exp.bullets.filter((_, i) => i !== index);
    onUpdate(expId, { bullets: newBullets });
  };

  const handleImproveBullet = async (expId: string, index: number, content: string) => {
    if (!content.trim()) return;

    const exp = experiences.find((e) => e.id === expId);
    if (!exp) return;

    setImprovingBullet({ expId, index });

    try {
      const result = await improve({
        type: 'bullet',
        content,
        context: {
          position: exp.position,
          company: exp.company,
        },
      });

      const newBullets = [...exp.bullets];
      newBullets[index] = result.improved;
      onUpdate(expId, { bullets: newBullets });
    } catch {
      // Error handled in hook
    } finally {
      setImprovingBullet(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
        <p className="text-sm text-gray-600 mt-1">
          Add your work history, starting with the most recent position
        </p>
      </div>

      <div className="space-y-4">
        {experiences.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No work experience added yet</p>
            <button
              onClick={handleAddExperience}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add Experience
            </button>
          </div>
        ) : (
          <>
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                >
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {exp.position || 'New Position'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {exp.company || 'Company'} {exp.startDate && `| ${exp.startDate}`}
                      {exp.current ? ' - Present' : exp.endDate ? ` - ${exp.endDate}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(exp.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {expandedId === exp.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Expanded Content */}
                {expandedId === exp.id && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position *
                        </label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => onUpdate(exp.id, { position: e.target.value })}
                          placeholder="Senior Software Engineer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company *
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => onUpdate(exp.id, { company: e.target.value })}
                          placeholder="Tech Corp Inc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={exp.location || ''}
                          onChange={(e) => onUpdate(exp.id, { location: e.target.value })}
                          placeholder="San Francisco, CA"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => onUpdate(exp.id, { startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        {!exp.current && (
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <input
                              type="month"
                              value={exp.endDate || ''}
                              onChange={(e) => onUpdate(exp.id, { endDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => onUpdate(exp.id, { current: e.target.checked, endDate: '' })}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor={`current-${exp.id}`} className="ml-2 text-sm text-gray-700">
                        I currently work here
                      </label>
                    </div>

                    {/* Bullet Points */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Key Achievements & Responsibilities
                        </label>
                        <button
                          onClick={() => handleAddBullet(exp.id)}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Bullet
                        </button>
                      </div>
                      <div className="space-y-2">
                        {exp.bullets.map((bullet, index) => (
                          <div key={index} className="flex gap-2">
                            <span className="text-gray-400 mt-2">•</span>
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => handleUpdateBullet(exp.id, index, e.target.value)}
                                placeholder="Led a team of 5 engineers to deliver a new feature that increased revenue by 20%"
                                className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                              <button
                                onClick={() => handleImproveBullet(exp.id, index, bullet)}
                                disabled={isImproving || !bullet.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                {improvingBullet?.expId === exp.id && improvingBullet?.index === index ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3 w-3" />
                                )}
                                Improve
                              </button>
                            </div>
                            {exp.bullets.length > 1 && (
                              <button
                                onClick={() => handleRemoveBullet(exp.id, index)}
                                className="p-2 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={handleAddExperience}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Another Experience
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Next: Education
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
