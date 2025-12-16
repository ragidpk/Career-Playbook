import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Education } from '../../../types/resumeBuilder.types';

interface EducationStepProps {
  educations: Education[];
  onAdd: (edu: Education) => void;
  onUpdate: (id: string, updates: Partial<Education>) => void;
  onRemove: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

const emptyEducation: Omit<Education, 'id'> = {
  institution: '',
  degree: '',
  field: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  gpa: '',
  honors: [],
};

export default function EducationStep({
  educations,
  onAdd,
  onUpdate,
  onRemove,
  onNext,
  onPrev,
}: EducationStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    educations.length > 0 ? educations[0].id : null
  );

  const handleAddEducation = () => {
    const newEdu: Education = {
      ...emptyEducation,
      id: crypto.randomUUID(),
    };
    onAdd(newEdu);
    setExpandedId(newEdu.id);
  };

  const degreeOptions = [
    'High School Diploma',
    'Associate Degree',
    'Bachelor of Arts (BA)',
    'Bachelor of Science (BS)',
    'Bachelor of Business Administration (BBA)',
    'Master of Arts (MA)',
    'Master of Science (MS)',
    'Master of Business Administration (MBA)',
    'Doctor of Philosophy (PhD)',
    'Doctor of Medicine (MD)',
    'Juris Doctor (JD)',
    'Other',
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Education</h2>
        <p className="text-sm text-gray-600 mt-1">
          Add your educational background, starting with the most recent
        </p>
      </div>

      <div className="space-y-4">
        {educations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No education added yet</p>
            <button
              onClick={handleAddEducation}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add Education
            </button>
          </div>
        ) : (
          <>
            {educations.map((edu) => (
              <div
                key={edu.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === edu.id ? null : edu.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {edu.degree || 'New Degree'} {edu.field && `in ${edu.field}`}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {edu.institution || 'Institution'} {edu.startDate && `| ${edu.startDate}`}
                      {edu.current ? ' - Present' : edu.endDate ? ` - ${edu.endDate}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(edu.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {expandedId === edu.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Expanded Content */}
                {expandedId === edu.id && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Institution *
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => onUpdate(edu.id, { institution: e.target.value })}
                          placeholder="Harvard University"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Degree *
                        </label>
                        <select
                          value={edu.degree}
                          onChange={(e) => onUpdate(edu.id, { degree: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select degree</option>
                          {degreeOptions.map((degree) => (
                            <option key={degree} value={degree}>
                              {degree}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) => onUpdate(edu.id, { field: e.target.value })}
                          placeholder="Computer Science"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={edu.location || ''}
                          onChange={(e) => onUpdate(edu.id, { location: e.target.value })}
                          placeholder="Cambridge, MA"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GPA (optional)
                        </label>
                        <input
                          type="text"
                          value={edu.gpa || ''}
                          onChange={(e) => onUpdate(edu.id, { gpa: e.target.value })}
                          placeholder="3.8/4.0"
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
                            value={edu.startDate}
                            onChange={(e) => onUpdate(edu.id, { startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        {!edu.current && (
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <input
                              type="month"
                              value={edu.endDate || ''}
                              onChange={(e) => onUpdate(edu.id, { endDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`current-edu-${edu.id}`}
                        checked={edu.current}
                        onChange={(e) => onUpdate(edu.id, { current: e.target.checked, endDate: '' })}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor={`current-edu-${edu.id}`} className="ml-2 text-sm text-gray-700">
                        I am currently studying here
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={handleAddEducation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Another Education
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
          Next: Skills
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
