import { useState } from 'react';
import { ArrowLeft, Download, Edit2, Check, FileText } from 'lucide-react';
import type { UserResume, TemplateType } from '../../../types/resumeBuilder.types';
import TemplateSelector from '../templates/TemplateSelector';
import { downloadResumePdf } from '../templates/pdfExport';

interface ReviewStepProps {
  resume: UserResume;
  onSelectTemplate: (template: TemplateType) => void;
  onRename: (name: string) => void;
  onPrev: () => void;
  onBack: () => void;
}

export default function ReviewStep({
  resume,
  onSelectTemplate,
  onRename,
  onPrev,
  onBack,
}: ReviewStepProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(resume.name);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onRename(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadResumePdf(resume);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate completion percentage
  const completionChecks = [
    resume.personal_info?.fullName,
    resume.personal_info?.email,
    resume.professional_summary,
    resume.work_experience?.length > 0,
    resume.education?.length > 0,
    resume.skills?.length > 0,
  ];
  const completedCount = completionChecks.filter(Boolean).length;
  const completionPercent = Math.round((completedCount / completionChecks.length) * 100);

  return (
    <div className="space-y-6">
      {/* Resume Name */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary-600" />
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">{resume.name}</h2>
                <button
                  onClick={() => {
                    setTempName(resume.name);
                    setIsEditingName(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Completion Badge */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  completionPercent >= 80
                    ? 'bg-green-500'
                    : completionPercent >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{completionPercent}% complete</span>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Template</h3>
        <TemplateSelector
          selectedTemplate={resume.selected_template}
          onSelect={onSelectTemplate}
        />
      </div>

      {/* Resume Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>

        {/* Simple Preview (not actual PDF) */}
        <div className="border border-gray-200 rounded-lg p-8 bg-white max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {resume.personal_info?.fullName || 'Your Name'}
            </h1>
            {resume.personal_info?.title && (
              <p className="text-lg text-gray-600 mt-1">{resume.personal_info.title}</p>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-sm text-gray-500">
              {resume.personal_info?.email && <span>{resume.personal_info.email}</span>}
              {resume.personal_info?.phone && <span>| {resume.personal_info.phone}</span>}
              {resume.personal_info?.location && <span>| {resume.personal_info.location}</span>}
            </div>
            {(resume.personal_info?.linkedIn || resume.personal_info?.website) && (
              <div className="flex justify-center gap-3 mt-2 text-sm text-primary-600">
                {resume.personal_info?.linkedIn && <span>LinkedIn</span>}
                {resume.personal_info?.website && <span>Website</span>}
              </div>
            )}
          </div>

          {/* Summary */}
          {resume.professional_summary && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                Professional Summary
              </h2>
              <p className="text-sm text-gray-700">{resume.professional_summary}</p>
            </div>
          )}

          {/* Experience */}
          {resume.work_experience?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Work Experience
              </h2>
              {resume.work_experience.map((exp) => (
                <div key={exp.id} className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{exp.position}</p>
                      <p className="text-sm text-gray-600">{exp.company}{exp.location && `, ${exp.location}`}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </p>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                      {exp.bullets.filter(Boolean).map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {resume.education?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Education
              </h2>
              {resume.education.map((edu) => (
                <div key={edu.id} className="mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {edu.degree} {edu.field && `in ${edu.field}`}
                      </p>
                      <p className="text-sm text-gray-600">{edu.institution}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {resume.skills?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {resume.certifications?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                Certifications
              </h2>
              {resume.certifications.map((cert) => (
                <div key={cert.id} className="mb-2">
                  <p className="text-sm text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-500">
                    {cert.issuer} {cert.date && `• ${cert.date}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={onPrev}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={onBack}
              className="flex-1 sm:flex-none px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Save & Exit
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
