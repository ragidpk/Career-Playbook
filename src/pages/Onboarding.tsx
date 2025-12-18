import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Target, ChevronRight, ChevronLeft, Check, X, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import AvatarUpload from '../components/shared/AvatarUpload';
import {
  savePartialProfile,
  YEARS_OF_EXPERIENCE_OPTIONS,
  JOB_SEARCH_STATUS_OPTIONS,
  WORK_PREFERENCE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  INDUSTRY_OPTIONS,
  SALARY_RANGE_OPTIONS,
} from '../services/profile.service';
import type { Database } from '../types/database.types';

const ONBOARDING_STORAGE_KEY = 'career_playbook_onboarding_draft';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface FormData {
  // Step 1: Personal Info
  avatar_url: string;
  full_name: string;
  phone_number: string;
  current_location: string;
  linkedin_url: string;
  // Step 2: Career Info
  years_of_experience: string;
  job_title: string;
  specialization: string;
  education_level: string;
  // Step 3: Career Goals
  target_role: string;
  target_industry: string;
  job_search_status: string;
  work_preference: string;
  salary_expectation: string;
  areas_of_expertise: string[];
  skills: string[];
}

const initialFormData: FormData = {
  avatar_url: '',
  full_name: '',
  phone_number: '',
  current_location: '',
  linkedin_url: '',
  years_of_experience: '',
  job_title: '',
  specialization: '',
  education_level: '',
  target_role: '',
  target_industry: '',
  job_search_status: '',
  work_preference: '',
  salary_expectation: '',
  areas_of_expertise: [],
  skills: [],
};

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Career Background', icon: Briefcase },
  { id: 3, title: 'Career Goals', icon: Target },
];

export default function Onboarding() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, completeOnboarding } = useProfile(user?.id);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  // Load existing profile data and localStorage draft on mount
  useEffect(() => {
    if (initializedRef.current) return;

    // First, try to load from localStorage (most recent draft)
    const savedDraft = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({
          ...prev,
          ...parsed,
        }));
        initializedRef.current = true;
        return;
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
      }
    }

    // If no localStorage draft, use profile data or user metadata
    if (!profileLoading && profile) {
      setFormData(prev => ({
        ...prev,
        avatar_url: profile.avatar_url || '',
        full_name: profile.full_name || user?.user_metadata?.full_name || '',
        phone_number: profile.phone_number || '',
        current_location: profile.current_location || '',
        linkedin_url: profile.linkedin_url || '',
        years_of_experience: profile.years_of_experience || '',
        job_title: profile.job_title || '',
        specialization: profile.specialization || '',
        education_level: profile.education_level || '',
        target_role: profile.target_role || '',
        target_industry: profile.target_industry || '',
        job_search_status: profile.job_search_status || '',
        work_preference: profile.work_preference || '',
        salary_expectation: profile.salary_expectation || '',
        areas_of_expertise: profile.areas_of_expertise || [],
        skills: profile.skills || [],
      }));
      initializedRef.current = true;
    } else if (!profileLoading) {
      // No profile yet, just use user metadata
      setFormData(prev => ({
        ...prev,
        full_name: user?.user_metadata?.full_name || '',
      }));
      initializedRef.current = true;
    }
  }, [profile, profileLoading, user]);

  // Auto-save to localStorage on form changes
  useEffect(() => {
    if (!initializedRef.current) return;
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  // Debounced auto-save to database
  const autoSaveToDatabase = useCallback(async () => {
    if (!user || !initializedRef.current) return;

    setIsSaving(true);
    try {
      const profileData: ProfileUpdate = {
        avatar_url: formData.avatar_url || null,
        full_name: formData.full_name || null,
        phone_number: formData.phone_number || null,
        current_location: formData.current_location || null,
        linkedin_url: formData.linkedin_url || null,
        years_of_experience: formData.years_of_experience || null,
        job_title: formData.job_title || null,
        specialization: formData.specialization || null,
        education_level: (formData.education_level as ProfileUpdate['education_level']) || null,
        target_role: formData.target_role || null,
        target_industry: formData.target_industry || null,
        job_search_status: (formData.job_search_status as ProfileUpdate['job_search_status']) || null,
        work_preference: (formData.work_preference as ProfileUpdate['work_preference']) || null,
        salary_expectation: formData.salary_expectation || null,
        areas_of_expertise: formData.areas_of_expertise.length > 0 ? formData.areas_of_expertise : null,
        skills: formData.skills.length > 0 ? formData.skills : null,
      };

      await savePartialProfile(user.id, profileData);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user, formData]);

  // Trigger debounced auto-save when form data changes
  useEffect(() => {
    if (!initializedRef.current) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveToDatabase();
    }, 3000); // Save after 3 seconds of no changes

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, autoSaveToDatabase]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.areas_of_expertise.includes(expertiseInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        areas_of_expertise: [...prev.areas_of_expertise, expertiseInput.trim()],
      }));
      setExpertiseInput('');
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData((prev) => ({
      ...prev,
      areas_of_expertise: prev.areas_of_expertise.filter((e) => e !== expertise),
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.full_name.trim();
      case 2:
        return !!formData.job_title.trim();
      case 3:
        return true; // Optional fields
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const profileData: ProfileUpdate = {
        avatar_url: formData.avatar_url || null,
        full_name: formData.full_name || null,
        phone_number: formData.phone_number || null,
        current_location: formData.current_location || null,
        linkedin_url: formData.linkedin_url || null,
        years_of_experience: formData.years_of_experience || null,
        job_title: formData.job_title || null,
        specialization: formData.specialization || null,
        education_level: (formData.education_level as ProfileUpdate['education_level']) || null,
        target_role: formData.target_role || null,
        target_industry: formData.target_industry || null,
        job_search_status: (formData.job_search_status as ProfileUpdate['job_search_status']) || null,
        work_preference: (formData.work_preference as ProfileUpdate['work_preference']) || null,
        salary_expectation: formData.salary_expectation || null,
        areas_of_expertise: formData.areas_of_expertise.length > 0 ? formData.areas_of_expertise : null,
        skills: formData.skills.length > 0 ? formData.skills : null,
      };

      // Use the hook's completeOnboarding which invalidates the profile cache
      await completeOnboarding(profileData);
      // Clear localStorage draft after successful completion
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      navigate('/dashboard');
      return;
    }

    setIsSkipping(true);
    setError(null);

    try {
      // Save partial data before skipping
      const profileData: ProfileUpdate = {
        avatar_url: formData.avatar_url || null,
        full_name: formData.full_name || null,
        phone_number: formData.phone_number || null,
        current_location: formData.current_location || null,
        linkedin_url: formData.linkedin_url || null,
        years_of_experience: formData.years_of_experience || null,
        job_title: formData.job_title || null,
        specialization: formData.specialization || null,
        education_level: (formData.education_level as ProfileUpdate['education_level']) || null,
        target_role: formData.target_role || null,
        target_industry: formData.target_industry || null,
        job_search_status: (formData.job_search_status as ProfileUpdate['job_search_status']) || null,
        work_preference: (formData.work_preference as ProfileUpdate['work_preference']) || null,
        salary_expectation: formData.salary_expectation || null,
        areas_of_expertise: formData.areas_of_expertise.length > 0 ? formData.areas_of_expertise : null,
        skills: formData.skills.length > 0 ? formData.skills : null,
      };

      await savePartialProfile(user.id, profileData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save partial profile:', err);
      // Still navigate to dashboard even if save fails
      navigate('/dashboard');
    } finally {
      setIsSkipping(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                Welcome! Let's get to know you
              </h2>
              <p className="text-gray-600">
                Tell us a bit about yourself to personalize your experience
              </p>
            </div>

            {/* Profile Photo */}
            <div className="flex justify-center pb-4">
              <AvatarUpload
                userId={user?.id || ''}
                currentAvatarUrl={formData.avatar_url || null}
                userName={formData.full_name || user?.user_metadata?.full_name}
                onUploadComplete={(newUrl) => handleChange('avatar_url', newUrl)}
                size="xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Current Location
                </label>
                <input
                  type="text"
                  value={formData.current_location}
                  onChange={(e) => handleChange('current_location', e.target.value)}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                Your Career Background
              </h2>
              <p className="text-gray-600">
                Help us understand your professional experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Years of Experience
                </label>
                <select
                  value={formData.years_of_experience}
                  onChange={(e) => handleChange('years_of_experience', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">Select years</option>
                  {YEARS_OF_EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Current/Most Recent Role <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => handleChange('job_title', e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder="e.g., Full Stack Development"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Education Level
                </label>
                <select
                  value={formData.education_level}
                  onChange={(e) => handleChange('education_level', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">Select education level</option>
                  {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Areas of Expertise
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                    placeholder="e.g., Solutions Architecture"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={addExpertise}
                    className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.areas_of_expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.areas_of_expertise.map((expertise) => (
                      <span
                        key={expertise}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        {expertise}
                        <button
                          type="button"
                          onClick={() => removeExpertise(expertise)}
                          className="hover:text-primary-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Key Skills
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="e.g., React, Python, Project Management"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-gray-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                Your Career Goals
              </h2>
              <p className="text-gray-600">
                Tell us what you're looking for in your next opportunity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Target Role
                </label>
                <input
                  type="text"
                  value={formData.target_role}
                  onChange={(e) => handleChange('target_role', e.target.value)}
                  placeholder="e.g., Senior Product Manager"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Target Industry
                </label>
                <select
                  value={formData.target_industry}
                  onChange={(e) => handleChange('target_industry', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">Select industry</option>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Job Search Status
                </label>
                <select
                  value={formData.job_search_status}
                  onChange={(e) => handleChange('job_search_status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">Select status</option>
                  {JOB_SEARCH_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Work Preference
                </label>
                <select
                  value={formData.work_preference}
                  onChange={(e) => handleChange('work_preference', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">Select preference</option>
                  {WORK_PREFERENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Salary Expectation
                </label>
                <select
                  value={formData.salary_expectation}
                  onChange={(e) => handleChange('salary_expectation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">Select range</option>
                  {SALARY_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-info-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/images/logo.svg" alt="Career Playbook" className="h-10 mx-auto" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  currentStep === step.id
                    ? 'bg-primary-600 text-white'
                    : currentStep > step.id
                    ? 'bg-success-100 text-success-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-success-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          {renderStepContent()}

          {error && (
            <div className="mt-6 p-4 bg-error-50 border border-error-200 rounded-xl">
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Auto-save indicator */}
        <div className="text-center mt-4">
          {isSaving && (
            <span className="inline-flex items-center gap-2 text-sm text-gray-500">
              <Save className="w-4 h-4 animate-pulse" />
              Saving...
            </span>
          )}
          {!isSaving && lastSaved && (
            <span className="text-sm text-gray-400">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Skip Option */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSkipping}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            {isSkipping ? 'Saving progress...' : "Skip for now, I'll complete this later"}
          </button>
        </div>
      </div>
    </div>
  );
}
