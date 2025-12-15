import { supabase } from './supabase';
import type { CareerPlanTemplate } from '../types/database.types';

// Default templates data
const DEFAULT_TEMPLATES: Omit<CareerPlanTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Software Engineer Growth',
    target_role: 'Senior Software Engineer',
    description: 'Level up from mid-level to senior engineer. Build technical leadership skills while maintaining hands-on expertise.',
    icon: 'code',
    color: 'blue',
    is_featured: true,
    is_active: true,
    weeks: [
      { week: 1, title: 'Skills & Gap Assessment', theme: 'foundation', goals: ['Complete skills inventory', 'Identify 3 key gaps', 'Set up learning tracking'] },
      { week: 2, title: 'Target Role Research', theme: 'foundation', goals: ['Research 10 job postings', 'Identify common requirements', 'Map gaps to learning'] },
      { week: 3, title: 'System Design Foundation', theme: 'foundation', goals: ['Start system design course', 'Practice 2 design problems', 'Document learnings'] },
      { week: 4, title: 'Deep Dive Learning', theme: 'skill_development', goals: ['Complete course module', 'Build sample project', 'Write technical blog post'] },
      { week: 5, title: 'Mentorship Launch', theme: 'skill_development', goals: ['Identify 2 junior engineers to mentor', 'Start weekly 1:1s', 'Create mentorship goals'] },
      { week: 6, title: 'Mid-Point Assessment', theme: 'skill_development', goals: ['Review progress on gaps', 'Adjust learning plan', 'Complete certification exam'] },
      { week: 7, title: 'Visibility Building', theme: 'networking', goals: ['Publish first tech article', 'Engage on LinkedIn daily', 'Attend one tech event'] },
      { week: 8, title: 'Network Expansion', theme: 'networking', goals: ['Reach out to 5 senior engineers', 'Schedule 3 informational interviews', 'Join relevant communities'] },
      { week: 9, title: 'Portfolio Completion', theme: 'networking', goals: ['Finalize GitHub projects', 'Update LinkedIn with achievements', 'Prepare case studies'] },
      { week: 10, title: 'Application Preparation', theme: 'job_search', goals: ['Update resume with senior framing', 'Prepare STAR stories', 'Create target company list'] },
      { week: 11, title: 'Active Applications', theme: 'job_search', goals: ['Apply to 10 target companies', 'Practice system design interviews', 'Schedule mock interviews'] },
      { week: 12, title: 'Interview Execution', theme: 'job_search', goals: ['Complete first round interviews', 'Refine based on feedback', 'Negotiate offers'] },
    ],
  },
  {
    name: 'Product Management Transition',
    target_role: 'Product Manager',
    description: 'Transition from technical role to Product Management. Leverage your technical background as a competitive advantage.',
    icon: 'lightbulb',
    color: 'purple',
    is_featured: true,
    is_active: true,
    weeks: [
      { week: 1, title: 'PM Foundations', theme: 'foundation', goals: ["Read 'Inspired' by Marty Cagan", 'Complete PM skills assessment', 'Identify skill gaps'] },
      { week: 2, title: 'Customer Discovery', theme: 'foundation', goals: ['Conduct 5 user interviews', 'Document user pain points', 'Create user persona'] },
      { week: 3, title: 'Current Role PM Work', theme: 'foundation', goals: ['Volunteer for product initiative', 'Write first product spec', 'Present to stakeholders'] },
      { week: 4, title: 'PM Certification Start', theme: 'skill_development', goals: ['Enroll in PM certification', 'Complete first module', 'Practice prioritization frameworks'] },
      { week: 5, title: 'Metrics & Analytics', theme: 'skill_development', goals: ['Define success metrics for initiative', 'Build analytics dashboard', 'Present data insights'] },
      { week: 6, title: 'Roadmap & Strategy', theme: 'skill_development', goals: ['Create product roadmap', 'Align with business objectives', 'Practice stakeholder alignment'] },
      { week: 7, title: 'Network Building', theme: 'networking', goals: ['Reach out to 5 PMs for coffee chats', 'Join Product community', 'Attend PM event'] },
      { week: 8, title: 'Portfolio Development', theme: 'networking', goals: ['Document product work as case studies', 'Create PM portfolio', 'Practice PM storytelling'] },
      { week: 9, title: 'Interview Preparation', theme: 'networking', goals: ['Study PM interview frameworks', 'Practice product sense questions', 'Mock interviews with PMs'] },
      { week: 10, title: 'Application Launch', theme: 'job_search', goals: ['Apply to 15 PM roles', 'Customize resume for each', 'Network into applications'] },
      { week: 11, title: 'Interview Execution', theme: 'job_search', goals: ['Complete phone screens', 'Product case presentations', 'Technical PM assessments'] },
      { week: 12, title: 'Offer & Negotiation', theme: 'job_search', goals: ['Navigate final rounds', 'Negotiate offers', 'Make decision framework'] },
    ],
  },
  {
    name: 'Career Pivot',
    target_role: 'New Industry Role',
    description: 'Make a significant career change to a new industry or role. Transform your experience into your biggest advantage.',
    icon: 'refresh',
    color: 'green',
    is_featured: true,
    is_active: true,
    weeks: [
      { week: 1, title: 'Clarity & Commitment', theme: 'foundation', goals: ['Define target role clearly', 'Assess financial runway', 'Commit to timeline'] },
      { week: 2, title: 'Gap Analysis', theme: 'foundation', goals: ['Map required skills', 'Identify transferable skills', 'Prioritize learning gaps'] },
      { week: 3, title: 'Learning Plan', theme: 'foundation', goals: ['Enroll in key course/certification', 'Set up daily learning routine', 'Find accountability partner'] },
      { week: 4, title: 'Skill Building Sprint', theme: 'skill_development', goals: ['Complete first course module', 'Start bridge project', 'Document learning'] },
      { week: 5, title: 'Industry Immersion', theme: 'skill_development', goals: ['Consume industry content daily', 'Attend industry event', 'Join 2 communities'] },
      { week: 6, title: 'Portfolio Creation', theme: 'skill_development', goals: ['Complete bridge project', 'Create portfolio piece', 'Get feedback from insider'] },
      { week: 7, title: 'Network Launch', theme: 'networking', goals: ['Reach out to 10 industry contacts', 'Schedule 5 informational interviews', 'Ask for introductions'] },
      { week: 8, title: 'Personal Brand Pivot', theme: 'networking', goals: ['Update LinkedIn completely', 'Craft transition narrative', 'Start posting industry content'] },
      { week: 9, title: 'Resume & Story', theme: 'networking', goals: ['Rewrite resume for new field', 'Practice telling transition story', 'Gather references'] },
      { week: 10, title: 'Application Strategy', theme: 'job_search', goals: ['Create target company list', 'Apply to 10 roles', 'Leverage network for referrals'] },
      { week: 11, title: 'Interview Preparation', theme: 'job_search', goals: ['Practice industry-specific questions', 'Prepare bridge examples', 'Mock interviews'] },
      { week: 12, title: 'Execution & Iteration', theme: 'job_search', goals: ['Complete interviews', 'Gather feedback', 'Iterate on approach'] },
    ],
  },
  {
    name: 'Data Scientist Development',
    target_role: 'Data Scientist',
    description: 'Build expertise in data science and ML. Develop skills to translate complex data into business impact.',
    icon: 'chart',
    color: 'orange',
    is_featured: false,
    is_active: true,
    weeks: [
      { week: 1, title: 'Foundation Assessment', theme: 'foundation', goals: ['Assess current data skills', 'Identify ML knowledge gaps', 'Set learning objectives'] },
      { week: 2, title: 'Statistics Deep Dive', theme: 'foundation', goals: ['Review statistical concepts', 'Practice A/B testing', 'Learn experimentation design'] },
      { week: 3, title: 'Python/R Mastery', theme: 'foundation', goals: ['Complete data manipulation exercises', 'Master pandas/numpy', 'Build analysis pipeline'] },
      { week: 4, title: 'ML Fundamentals', theme: 'skill_development', goals: ['Study supervised learning', 'Implement basic models', 'Understand model evaluation'] },
      { week: 5, title: 'Advanced ML', theme: 'skill_development', goals: ['Learn deep learning basics', 'Practice feature engineering', 'Build ML project'] },
      { week: 6, title: 'Data Visualization', theme: 'skill_development', goals: ['Master visualization libraries', 'Create compelling dashboards', 'Present insights effectively'] },
      { week: 7, title: 'Kaggle Competition', theme: 'networking', goals: ['Enter Kaggle competition', 'Learn from top solutions', 'Build public profile'] },
      { week: 8, title: 'Portfolio Projects', theme: 'networking', goals: ['Complete end-to-end project', 'Document methodology', 'Share on GitHub'] },
      { week: 9, title: 'Community Engagement', theme: 'networking', goals: ['Join data science communities', 'Attend meetups', 'Network with practitioners'] },
      { week: 10, title: 'Resume Optimization', theme: 'job_search', goals: ['Tailor resume for DS roles', 'Highlight projects', 'Prepare case studies'] },
      { week: 11, title: 'Technical Prep', theme: 'job_search', goals: ['Practice coding interviews', 'Prepare ML system design', 'Mock technical screens'] },
      { week: 12, title: 'Job Search Launch', theme: 'job_search', goals: ['Apply to target companies', 'Complete interviews', 'Negotiate offers'] },
    ],
  },
  {
    name: 'Engineering Manager Path',
    target_role: 'Engineering Manager',
    description: 'Transition from senior engineer to engineering management. Learn to multiply impact through growing and leading teams.',
    icon: 'users',
    color: 'indigo',
    is_featured: false,
    is_active: true,
    weeks: [
      { week: 1, title: 'Management Mindset', theme: 'foundation', goals: ['Understand IC vs manager role', 'Read management books', 'Assess readiness for transition'] },
      { week: 2, title: 'Leadership Assessment', theme: 'foundation', goals: ['Get 360 feedback', 'Identify leadership strengths', 'Create development plan'] },
      { week: 3, title: 'People Skills Foundation', theme: 'foundation', goals: ['Learn effective 1:1s', 'Practice giving feedback', 'Study coaching techniques'] },
      { week: 4, title: 'Team Dynamics', theme: 'skill_development', goals: ['Understand team formation', 'Learn conflict resolution', 'Practice facilitation'] },
      { week: 5, title: 'Hiring & Onboarding', theme: 'skill_development', goals: ['Learn interview techniques', 'Create hiring rubrics', 'Design onboarding plans'] },
      { week: 6, title: 'Performance Management', theme: 'skill_development', goals: ['Set team goals', 'Learn performance reviews', 'Practice difficult conversations'] },
      { week: 7, title: 'Manager Network', theme: 'networking', goals: ['Connect with engineering managers', 'Join management communities', 'Find mentor'] },
      { week: 8, title: 'Shadow & Learn', theme: 'networking', goals: ['Shadow current managers', 'Attend leadership meetings', 'Practice delegation'] },
      { week: 9, title: 'Management Portfolio', theme: 'networking', goals: ['Document leadership examples', 'Prepare management scenarios', 'Create leadership philosophy'] },
      { week: 10, title: 'Internal Opportunities', theme: 'job_search', goals: ['Express interest to leadership', 'Apply for internal roles', 'Prepare promotion case'] },
      { week: 11, title: 'External Search', theme: 'job_search', goals: ['Apply to EM roles', 'Practice management interviews', 'Prepare people scenarios'] },
      { week: 12, title: 'Transition Planning', theme: 'job_search', goals: ['Negotiate role transition', 'Plan team handoff', 'Set 90-day goals'] },
    ],
  },
];

// Local storage key for templates
const TEMPLATES_STORAGE_KEY = 'career_plan_templates';

// Initialize templates from local storage or defaults
function getStoredTemplates(): CareerPlanTemplate[] {
  const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initializeDefaultTemplates();
    }
  }
  return initializeDefaultTemplates();
}

function initializeDefaultTemplates(): CareerPlanTemplate[] {
  const templates: CareerPlanTemplate[] = DEFAULT_TEMPLATES.map((t, index) => ({
    ...t,
    id: `template-${index + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  return templates;
}

function saveTemplates(templates: CareerPlanTemplate[]): void {
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

// Template service functions
export async function getTemplates(): Promise<CareerPlanTemplate[]> {
  // Try to fetch from Supabase first (table may not exist yet)
  try {
    const { data, error } = await (supabase
      .from('career_plan_templates') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as CareerPlanTemplate[];
    }
  } catch {
    // Fall back to local storage
  }

  return getStoredTemplates();
}

export async function getTemplate(id: string): Promise<CareerPlanTemplate | null> {
  const templates = await getTemplates();
  return templates.find(t => t.id === id) || null;
}

export async function createTemplate(
  template: Omit<CareerPlanTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<CareerPlanTemplate> {
  const templates = getStoredTemplates();

  const newTemplate: CareerPlanTemplate = {
    ...template,
    id: `template-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  templates.unshift(newTemplate);
  saveTemplates(templates);

  // Also try to save to Supabase (table may not exist yet)
  try {
    await (supabase.from('career_plan_templates') as any).insert(newTemplate);
  } catch {
    // Continue with local storage
  }

  return newTemplate;
}

export async function updateTemplate(
  id: string,
  updates: Partial<Omit<CareerPlanTemplate, 'id' | 'created_at'>>
): Promise<CareerPlanTemplate> {
  const templates = getStoredTemplates();
  const index = templates.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error('Template not found');
  }

  templates[index] = {
    ...templates[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  saveTemplates(templates);

  // Also try to update in Supabase (table may not exist yet)
  try {
    await (supabase.from('career_plan_templates') as any).update(updates).eq('id', id);
  } catch {
    // Continue with local storage
  }

  return templates[index];
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = getStoredTemplates();
  const filtered = templates.filter(t => t.id !== id);
  saveTemplates(filtered);

  // Also try to delete from Supabase (table may not exist yet)
  try {
    await (supabase.from('career_plan_templates') as any).delete().eq('id', id);
  } catch {
    // Continue with local storage
  }
}

export async function duplicateTemplate(id: string): Promise<CareerPlanTemplate> {
  const template = await getTemplate(id);
  if (!template) {
    throw new Error('Template not found');
  }

  return createTemplate({
    ...template,
    name: `${template.name} (Copy)`,
    is_featured: false,
  });
}

export function getActiveTemplates(): Promise<CareerPlanTemplate[]> {
  return getTemplates().then(templates => templates.filter(t => t.is_active));
}

export function getFeaturedTemplates(): Promise<CareerPlanTemplate[]> {
  return getTemplates().then(templates => templates.filter(t => t.is_featured && t.is_active));
}
