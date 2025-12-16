// Resume Builder Types

export type TemplateType = 'modern' | 'classic' | 'minimal' | 'professional' | 'creative';

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  website?: string;
  title?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  bullets: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
  honors?: string[];
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expirationDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
}

export type SectionType =
  | 'personal_info'
  | 'professional_summary'
  | 'work_experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects';

export interface UserResume {
  id: string;
  user_id: string;
  name: string;
  is_primary: boolean;
  selected_template: TemplateType;
  personal_info: PersonalInfo;
  professional_summary: string | null;
  work_experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  projects: Project[];
  section_order: SectionType[];
  imported_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateResumeInput {
  name?: string;
  is_primary?: boolean;
  selected_template?: TemplateType;
  personal_info?: Partial<PersonalInfo>;
  professional_summary?: string;
  work_experience?: WorkExperience[];
  education?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  projects?: Project[];
  section_order?: SectionType[];
  imported_from?: string;
}

export interface UpdateResumeInput extends Partial<CreateResumeInput> {
  id: string;
}

// Wizard step definitions
export type WizardStep =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'review';

export interface WizardStepConfig {
  id: WizardStep;
  label: string;
  description: string;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  { id: 'personal', label: 'Personal Info', description: 'Contact details and profile' },
  { id: 'summary', label: 'Summary', description: 'Professional summary' },
  { id: 'experience', label: 'Experience', description: 'Work history' },
  { id: 'education', label: 'Education', description: 'Academic background' },
  { id: 'skills', label: 'Skills', description: 'Skills and certifications' },
  { id: 'review', label: 'Review', description: 'Preview and download' },
];

// AI Improvement types
export interface AIImprovementRequest {
  type: 'summary' | 'bullet' | 'full';
  content: string;
  context?: {
    position?: string;
    company?: string;
    industry?: string;
  };
}

export interface AIImprovementResponse {
  improved: string;
  suggestions?: string[];
}

// Default empty resume
export const DEFAULT_RESUME: Omit<UserResume, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  name: 'My Resume',
  is_primary: false,
  selected_template: 'modern',
  personal_info: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
  },
  professional_summary: '',
  work_experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  section_order: [
    'personal_info',
    'professional_summary',
    'work_experience',
    'education',
    'skills',
    'certifications',
    'projects',
  ],
  imported_from: null,
};
