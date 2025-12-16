import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, X, Award } from 'lucide-react';
import type { Skill, Certification } from '../../../types/resumeBuilder.types';

interface SkillsStepProps {
  skills: Skill[];
  certifications: Certification[];
  onAddSkill: (skill: Skill) => void;
  onRemoveSkill: (id: string) => void;
  onAddCertification: (cert: Certification) => void;
  onRemoveCertification: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

const skillCategories = [
  'Technical',
  'Programming Languages',
  'Frameworks',
  'Tools',
  'Soft Skills',
  'Languages',
  'Other',
];

const skillLevels: Skill['level'][] = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function SkillsStep({
  skills,
  certifications,
  onAddSkill,
  onRemoveSkill,
  onAddCertification,
  onRemoveCertification,
  onNext,
  onPrev,
}: SkillsStepProps) {
  const [newSkill, setNewSkill] = useState({ name: '', category: '', level: 'intermediate' as Skill['level'] });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '' });
  const [showCertForm, setShowCertForm] = useState(false);

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;

    onAddSkill({
      id: crypto.randomUUID(),
      name: newSkill.name.trim(),
      category: newSkill.category || 'Other',
      level: newSkill.level,
    });

    setNewSkill({ name: '', category: '', level: 'intermediate' });
  };

  const handleAddCertification = () => {
    if (!newCert.name.trim() || !newCert.issuer.trim()) return;

    onAddCertification({
      id: crypto.randomUUID(),
      name: newCert.name.trim(),
      issuer: newCert.issuer.trim(),
      date: newCert.date,
    });

    setNewCert({ name: '', issuer: '', date: '' });
    setShowCertForm(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Skills & Certifications</h2>
        <p className="text-sm text-gray-600 mt-1">
          Add your technical skills, soft skills, and professional certifications
        </p>
      </div>

      <div className="space-y-8">
        {/* Skills Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>

          {/* Add Skill Form */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Enter a skill (e.g., React, Project Management)"
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <select
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Category</option>
              {skillCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as Skill['level'] })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {skillLevels.map((level) => (
                <option key={level} value={level} className="capitalize">{level}</option>
              ))}
            </select>
            <button
              onClick={handleAddSkill}
              disabled={!newSkill.name.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Skills Display */}
          {skills.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No skills added yet. Add your first skill above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category}>
                  <p className="text-sm font-medium text-gray-500 mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skill) => (
                      <span
                        key={skill.id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm group"
                      >
                        {skill.name}
                        {skill.level && (
                          <span className="text-xs text-gray-500 capitalize">
                            ({skill.level})
                          </span>
                        )}
                        <button
                          onClick={() => onRemoveSkill(skill.id)}
                          className="ml-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Certifications</h3>
            {!showCertForm && (
              <button
                onClick={() => setShowCertForm(true)}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Certification
              </button>
            )}
          </div>

          {showCertForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certification Name *
                  </label>
                  <input
                    type="text"
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                    placeholder="AWS Solutions Architect"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing Organization *
                  </label>
                  <input
                    type="text"
                    value={newCert.issuer}
                    onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                    placeholder="Amazon Web Services"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Earned
                  </label>
                  <input
                    type="month"
                    value={newCert.date}
                    onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCertForm(false);
                    setNewCert({ name: '', issuer: '', date: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCertification}
                  disabled={!newCert.name.trim() || !newCert.issuer.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Add Certification
                </button>
              </div>
            </div>
          )}

          {certifications.length === 0 && !showCertForm ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No certifications added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">{cert.name}</p>
                      <p className="text-sm text-gray-500">
                        {cert.issuer}
                        {cert.date && ` • ${cert.date}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveCertification(cert.id)}
                    className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
          Next: Review
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
