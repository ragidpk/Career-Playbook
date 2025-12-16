import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import NotificationSettings from '../components/notifications/NotificationSettings';
import AvatarUpload from '../components/shared/AvatarUpload';
import {
  YEARS_OF_EXPERIENCE_OPTIONS,
  JOB_SEARCH_STATUS_OPTIONS,
  WORK_PREFERENCE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  INDUSTRY_OPTIONS,
  SALARY_RANGE_OPTIONS,
} from '../services/profile.service';
import type { Database } from '../types/database.types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export default function Settings() {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile(user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdate>({});
  const [skillInput, setSkillInput] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        current_location: profile.current_location,
        linkedin_url: profile.linkedin_url,
        years_of_experience: profile.years_of_experience,
        job_title: profile.job_title,
        specialization: profile.specialization,
        education_level: profile.education_level,
        target_role: profile.target_role,
        target_industry: profile.target_industry,
        job_search_status: profile.job_search_status,
        work_preference: profile.work_preference,
        salary_expectation: profile.salary_expectation,
        areas_of_expertise: profile.areas_of_expertise || [],
        skills: profile.skills || [],
      });
    }
  }, [profile]);

  if (!user) {
    return null;
  }

  const handleChange = (field: keyof ProfileUpdate, value: ProfileUpdate[keyof ProfileUpdate]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = formData.skills || [];
      if (!currentSkills.includes(skillInput.trim())) {
        handleChange('skills', [...currentSkills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    const currentSkills = formData.skills || [];
    handleChange('skills', currentSkills.filter((s) => s !== skill));
  };

  const addExpertise = () => {
    if (expertiseInput.trim()) {
      const current = formData.areas_of_expertise || [];
      if (!current.includes(expertiseInput.trim())) {
        handleChange('areas_of_expertise', [...current, expertiseInput.trim()]);
      }
      setExpertiseInput('');
    }
  };

  const removeExpertise = (expertise: string) => {
    const current = formData.areas_of_expertise || [];
    handleChange('areas_of_expertise', current.filter((e) => e !== expertise));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile and preferences</p>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl">
            <p className="text-sm text-success-700">Profile updated successfully!</p>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-2xl shadow-card">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-semibold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your personal and career information
                </p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-xl font-medium transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Profile Photo */}
                  <div className="flex flex-col items-center pb-6 border-b border-gray-100">
                    <AvatarUpload
                      userId={user.id}
                      currentAvatarUrl={profile?.avatar_url}
                      userName={profile?.full_name || user.email}
                      onUploadComplete={(newUrl) => {
                        updateProfile({ avatar_url: newUrl });
                      }}
                      size="xl"
                    />
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.full_name || ''}
                            onChange={(e) => handleChange('full_name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.full_name || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.phone_number || ''}
                            onChange={(e) => handleChange('phone_number', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.phone_number || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.current_location || ''}
                            onChange={(e) => handleChange('current_location', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.current_location || 'Not set'}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={formData.linkedin_url || ''}
                            onChange={(e) => handleChange('linkedin_url', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.linkedin_url || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Career Background */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Career Background
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                        {isEditing ? (
                          <select
                            value={formData.years_of_experience || ''}
                            onChange={(e) => handleChange('years_of_experience', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select years</option>
                            {YEARS_OF_EXPERIENCE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900">
                            {YEARS_OF_EXPERIENCE_OPTIONS.find(o => o.value === profile?.years_of_experience)?.label || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.job_title || ''}
                            onChange={(e) => handleChange('job_title', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.job_title || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.specialization || ''}
                            onChange={(e) => handleChange('specialization', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.specialization || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                        {isEditing ? (
                          <select
                            value={formData.education_level || ''}
                            onChange={(e) => handleChange('education_level', e.target.value as ProfileUpdate['education_level'])}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select education</option>
                            {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900">
                            {EDUCATION_LEVEL_OPTIONS.find(o => o.value === profile?.education_level)?.label || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Expertise</label>
                        {isEditing ? (
                          <>
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={expertiseInput}
                                onChange={(e) => setExpertiseInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                                placeholder="Add expertise area"
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                              <button
                                type="button"
                                onClick={addExpertise}
                                className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                            {(formData.areas_of_expertise || []).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {(formData.areas_of_expertise || []).map((expertise) => (
                                  <span key={expertise} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                                    {expertise}
                                    <button type="button" onClick={() => removeExpertise(expertise)} className="hover:text-primary-900">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(profile?.areas_of_expertise || []).length > 0 ? (
                              profile?.areas_of_expertise?.map((e) => (
                                <span key={e} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">{e}</span>
                              ))
                            ) : (
                              <p className="text-gray-500">Not set</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                        {isEditing ? (
                          <>
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Add a skill"
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                              <button
                                type="button"
                                onClick={addSkill}
                                className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                            {(formData.skills || []).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {(formData.skills || []).map((skill) => (
                                  <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                    {skill}
                                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-gray-900">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(profile?.skills || []).length > 0 ? (
                              profile?.skills?.map((s) => (
                                <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{s}</span>
                              ))
                            ) : (
                              <p className="text-gray-500">Not set</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Career Goals */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Career Goals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.target_role || ''}
                            onChange={(e) => handleChange('target_role', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.target_role || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Industry</label>
                        {isEditing ? (
                          <select
                            value={formData.target_industry || ''}
                            onChange={(e) => handleChange('target_industry', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select industry</option>
                            {INDUSTRY_OPTIONS.map((industry) => (
                              <option key={industry} value={industry}>{industry}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900">{profile?.target_industry || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Search Status</label>
                        {isEditing ? (
                          <select
                            value={formData.job_search_status || ''}
                            onChange={(e) => handleChange('job_search_status', e.target.value as ProfileUpdate['job_search_status'])}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select status</option>
                            {JOB_SEARCH_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900">
                            {JOB_SEARCH_STATUS_OPTIONS.find(o => o.value === profile?.job_search_status)?.label || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Preference</label>
                        {isEditing ? (
                          <select
                            value={formData.work_preference || ''}
                            onChange={(e) => handleChange('work_preference', e.target.value as ProfileUpdate['work_preference'])}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select preference</option>
                            {WORK_PREFERENCE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900">
                            {WORK_PREFERENCE_OPTIONS.find(o => o.value === profile?.work_preference)?.label || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Salary Expectation</label>
                        {isEditing ? (
                          <select
                            value={formData.salary_expectation || ''}
                            onChange={(e) => handleChange('salary_expectation', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select range</option>
                            {SALARY_RANGE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900">
                            {SALARY_RANGE_OPTIONS.find(o => o.value === profile?.salary_expectation)?.label || 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings */}
          <NotificationSettings userId={user.id} />
        </div>
      </div>
    </div>
  );
}
