// Template data for pre-filling 12-week plans with industry-standard milestones

export interface TemplateMilestone {
  week: number;
  title: string;
  subtasks: { text: string; completed: boolean }[];
  category: 'foundation' | 'skill_development' | 'networking' | 'job_search';
}

export interface PlanTemplate {
  id: string;
  name: string;
  milestones: TemplateMilestone[];
}

export const planTemplates: Record<string, PlanTemplate> = {
  'software-engineer': {
    id: 'software-engineer',
    name: 'Software Engineer Growth',
    milestones: [
      {
        week: 1,
        title: 'Skills Assessment',
        subtasks: [
          { text: 'Complete technical skills self-assessment', completed: false },
          { text: 'Identify 3 key areas for improvement', completed: false },
          { text: 'Research senior engineer expectations at target companies', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 2,
        title: 'System Design Basics',
        subtasks: [
          { text: 'Study system design fundamentals (CAP theorem, scaling)', completed: false },
          { text: 'Complete 2 system design practice problems', completed: false },
          { text: 'Review architecture of a system you work with', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 3,
        title: 'Code Quality Focus',
        subtasks: [
          { text: 'Read "Clean Code" key chapters', completed: false },
          { text: 'Refactor one module in your codebase', completed: false },
          { text: 'Set up code review best practices document', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 4,
        title: 'Advanced Algorithms',
        subtasks: [
          { text: 'Complete 10 medium LeetCode problems', completed: false },
          { text: 'Study dynamic programming patterns', completed: false },
          { text: 'Practice explaining solutions out loud', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 5,
        title: 'System Design Deep Dive',
        subtasks: [
          { text: 'Design a URL shortener system', completed: false },
          { text: 'Design a rate limiter', completed: false },
          { text: 'Study database sharding strategies', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 6,
        title: 'Leadership Skills',
        subtasks: [
          { text: 'Lead a technical discussion or code review', completed: false },
          { text: 'Mentor a junior developer on one task', completed: false },
          { text: 'Document a technical decision with ADR', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 7,
        title: 'Build Network',
        subtasks: [
          { text: 'Connect with 5 senior engineers on LinkedIn', completed: false },
          { text: 'Attend 1 tech meetup or virtual event', completed: false },
          { text: 'Schedule 2 coffee chats with industry peers', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 8,
        title: 'Online Presence',
        subtasks: [
          { text: 'Update LinkedIn with recent projects', completed: false },
          { text: 'Write a technical blog post or tutorial', completed: false },
          { text: 'Contribute to an open source project', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 9,
        title: 'Interview Prep',
        subtasks: [
          { text: 'Complete 2 mock technical interviews', completed: false },
          { text: 'Prepare STAR stories for behavioral questions', completed: false },
          { text: 'Research target companies thoroughly', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 10,
        title: 'Application Sprint',
        subtasks: [
          { text: 'Apply to 10 senior engineer positions', completed: false },
          { text: 'Customize resume for each application', completed: false },
          { text: 'Follow up on pending applications', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 11,
        title: 'Interview Execution',
        subtasks: [
          { text: 'Complete scheduled phone screens', completed: false },
          { text: 'Practice system design presentations', completed: false },
          { text: 'Prepare questions to ask interviewers', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 12,
        title: 'Negotiate & Close',
        subtasks: [
          { text: 'Research market compensation rates', completed: false },
          { text: 'Practice negotiation scenarios', completed: false },
          { text: 'Evaluate and compare offers received', completed: false },
        ],
        category: 'job_search',
      },
    ],
  },

  'product-management': {
    id: 'product-management',
    name: 'Product Management Transition',
    milestones: [
      {
        week: 1,
        title: 'PM Foundations',
        subtasks: [
          { text: "Read 'Inspired' by Marty Cagan", completed: false },
          { text: 'Complete PM skills assessment', completed: false },
          { text: 'Identify transferable skills from current role', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 2,
        title: 'Customer Discovery',
        subtasks: [
          { text: 'Conduct 5 user interviews', completed: false },
          { text: 'Document user pain points and needs', completed: false },
          { text: 'Create user persona template', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 3,
        title: 'Product Strategy',
        subtasks: [
          { text: 'Study product-market fit frameworks', completed: false },
          { text: 'Analyze 3 successful product launches', completed: false },
          { text: 'Create a product vision statement', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 4,
        title: 'Metrics & Analytics',
        subtasks: [
          { text: 'Learn key PM metrics (DAU, retention, NPS)', completed: false },
          { text: 'Set up a product analytics dashboard', completed: false },
          { text: 'Practice data-driven decision making', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 5,
        title: 'Roadmap Planning',
        subtasks: [
          { text: 'Learn prioritization frameworks (RICE, MoSCoW)', completed: false },
          { text: 'Create a sample product roadmap', completed: false },
          { text: 'Practice stakeholder communication', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 6,
        title: 'Technical Fluency',
        subtasks: [
          { text: 'Learn basic SQL for data queries', completed: false },
          { text: 'Understand API basics and integrations', completed: false },
          { text: 'Shadow engineering team for 1 day', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 7,
        title: 'PM Community',
        subtasks: [
          { text: 'Join 2 PM communities (Slack, LinkedIn)', completed: false },
          { text: 'Connect with 5 PMs at target companies', completed: false },
          { text: 'Attend a product management meetup', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 8,
        title: 'Build Portfolio',
        subtasks: [
          { text: 'Create 2 product case studies', completed: false },
          { text: 'Document a product improvement proposal', completed: false },
          { text: 'Update LinkedIn with PM-focused content', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 9,
        title: 'Interview Prep',
        subtasks: [
          { text: 'Practice product sense questions', completed: false },
          { text: 'Prepare estimation/market sizing answers', completed: false },
          { text: 'Complete 2 mock PM interviews', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 10,
        title: 'Application Launch',
        subtasks: [
          { text: 'Apply to 10 APM/PM positions', completed: false },
          { text: 'Tailor resume for each company', completed: false },
          { text: 'Request referrals from network', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 11,
        title: 'Interview Sprint',
        subtasks: [
          { text: 'Complete phone screens confidently', completed: false },
          { text: 'Prepare product design exercise', completed: false },
          { text: 'Research each company deeply', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 12,
        title: 'Close & Transition',
        subtasks: [
          { text: 'Negotiate offer terms', completed: false },
          { text: 'Plan 30-60-90 day PM onboarding', completed: false },
          { text: 'Celebrate your career transition!', completed: false },
        ],
        category: 'job_search',
      },
    ],
  },

  'career-pivot': {
    id: 'career-pivot',
    name: 'Career Pivot',
    milestones: [
      {
        week: 1,
        title: 'Self Discovery',
        subtasks: [
          { text: 'Complete career values assessment', completed: false },
          { text: 'List transferable skills from current role', completed: false },
          { text: 'Identify 3 target industries or roles', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 2,
        title: 'Market Research',
        subtasks: [
          { text: 'Research salary ranges in target field', completed: false },
          { text: 'Identify top companies in new industry', completed: false },
          { text: 'Understand required qualifications', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 3,
        title: 'Gap Analysis',
        subtasks: [
          { text: 'Compare current skills to job requirements', completed: false },
          { text: 'Identify 3 key skills to develop', completed: false },
          { text: 'Create learning plan with timeline', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 4,
        title: 'Skill Building I',
        subtasks: [
          { text: 'Enroll in relevant online course', completed: false },
          { text: 'Complete first module/certification', completed: false },
          { text: 'Practice new skills daily', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 5,
        title: 'Skill Building II',
        subtasks: [
          { text: 'Continue coursework or certification', completed: false },
          { text: 'Start a portfolio project', completed: false },
          { text: 'Join industry-specific community', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 6,
        title: 'Hands-On Experience',
        subtasks: [
          { text: 'Complete portfolio project', completed: false },
          { text: 'Volunteer or freelance in new field', completed: false },
          { text: 'Document learnings and achievements', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 7,
        title: 'Informational Interviews',
        subtasks: [
          { text: 'Reach out to 10 people in target field', completed: false },
          { text: 'Conduct 5 informational interviews', completed: false },
          { text: 'Ask about day-to-day and career paths', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 8,
        title: 'Brand Repositioning',
        subtasks: [
          { text: 'Rewrite resume for new career', completed: false },
          { text: 'Update LinkedIn headline and summary', completed: false },
          { text: 'Create career pivot narrative', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 9,
        title: 'Expand Network',
        subtasks: [
          { text: 'Attend 2 industry events or webinars', completed: false },
          { text: 'Connect with hiring managers', completed: false },
          { text: 'Ask for introductions from contacts', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 10,
        title: 'Job Search Launch',
        subtasks: [
          { text: 'Apply to 10 entry/transition roles', completed: false },
          { text: 'Leverage referrals from network', completed: false },
          { text: 'Track applications in spreadsheet', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 11,
        title: 'Interview Preparation',
        subtasks: [
          { text: 'Practice explaining career change story', completed: false },
          { text: 'Prepare examples of transferable skills', completed: false },
          { text: 'Research each company before interview', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 12,
        title: 'Land the Role',
        subtasks: [
          { text: 'Complete final interview rounds', completed: false },
          { text: 'Negotiate offer confidently', completed: false },
          { text: 'Plan first 90 days in new role', completed: false },
        ],
        category: 'job_search',
      },
    ],
  },

  'data-scientist': {
    id: 'data-scientist',
    name: 'Data Scientist Development',
    milestones: [
      {
        week: 1,
        title: 'Foundation Assessment',
        subtasks: [
          { text: 'Assess current statistics knowledge', completed: false },
          { text: 'Review Python/R proficiency', completed: false },
          { text: 'Identify ML concepts to learn', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 2,
        title: 'Statistics Deep Dive',
        subtasks: [
          { text: 'Study hypothesis testing and p-values', completed: false },
          { text: 'Practice statistical analysis with datasets', completed: false },
          { text: 'Learn A/B testing methodology', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 3,
        title: 'Python for Data Science',
        subtasks: [
          { text: 'Master pandas for data manipulation', completed: false },
          { text: 'Learn data visualization with matplotlib/seaborn', completed: false },
          { text: 'Complete exploratory data analysis project', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 4,
        title: 'Machine Learning Basics',
        subtasks: [
          { text: 'Study supervised learning algorithms', completed: false },
          { text: 'Implement regression and classification models', completed: false },
          { text: 'Learn model evaluation metrics', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 5,
        title: 'Advanced ML',
        subtasks: [
          { text: 'Study ensemble methods (Random Forest, XGBoost)', completed: false },
          { text: 'Learn unsupervised learning techniques', completed: false },
          { text: 'Practice feature engineering', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 6,
        title: 'Deep Learning Intro',
        subtasks: [
          { text: 'Complete neural network fundamentals course', completed: false },
          { text: 'Build a simple neural network with TensorFlow/PyTorch', completed: false },
          { text: 'Understand when to use deep learning', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 7,
        title: 'Portfolio Projects',
        subtasks: [
          { text: 'Complete Kaggle competition', completed: false },
          { text: 'Build end-to-end ML project', completed: false },
          { text: 'Document projects on GitHub', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 8,
        title: 'Community Building',
        subtasks: [
          { text: 'Join data science communities', completed: false },
          { text: 'Connect with 10 data scientists', completed: false },
          { text: 'Attend a data science meetup', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 9,
        title: 'Interview Prep',
        subtasks: [
          { text: 'Practice SQL interview questions', completed: false },
          { text: 'Review ML theory for interviews', completed: false },
          { text: 'Prepare case study presentations', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 10,
        title: 'Application Sprint',
        subtasks: [
          { text: 'Apply to 10 data scientist positions', completed: false },
          { text: 'Customize resume for each role', completed: false },
          { text: 'Request referrals from network', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 11,
        title: 'Technical Interviews',
        subtasks: [
          { text: 'Complete take-home assignments', completed: false },
          { text: 'Practice live coding sessions', completed: false },
          { text: 'Prepare for case study rounds', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 12,
        title: 'Close & Celebrate',
        subtasks: [
          { text: 'Negotiate data scientist offer', completed: false },
          { text: 'Compare multiple opportunities', completed: false },
          { text: 'Plan continuous learning path', completed: false },
        ],
        category: 'job_search',
      },
    ],
  },

  'engineering-manager': {
    id: 'engineering-manager',
    name: 'Engineering Manager Path',
    milestones: [
      {
        week: 1,
        title: 'Leadership Assessment',
        subtasks: [
          { text: 'Take leadership style assessment', completed: false },
          { text: 'Identify leadership strengths and gaps', completed: false },
          { text: "Read 'The Manager's Path' by Camille Fournier", completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 2,
        title: 'People Management Basics',
        subtasks: [
          { text: 'Study effective 1:1 meeting frameworks', completed: false },
          { text: 'Learn feedback delivery techniques', completed: false },
          { text: 'Understand performance review processes', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 3,
        title: 'Team Dynamics',
        subtasks: [
          { text: 'Study team formation stages (Tuckman)', completed: false },
          { text: 'Learn conflict resolution strategies', completed: false },
          { text: 'Understand psychological safety concepts', completed: false },
        ],
        category: 'foundation',
      },
      {
        week: 4,
        title: 'Project Management',
        subtasks: [
          { text: 'Learn agile methodologies deeply', completed: false },
          { text: 'Practice sprint planning and estimation', completed: false },
          { text: 'Study risk management techniques', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 5,
        title: 'Technical Leadership',
        subtasks: [
          { text: 'Practice architecture decision making', completed: false },
          { text: 'Learn to balance tech debt vs features', completed: false },
          { text: 'Study code review best practices for teams', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 6,
        title: 'Hiring & Onboarding',
        subtasks: [
          { text: 'Learn structured interview techniques', completed: false },
          { text: 'Create onboarding checklist template', completed: false },
          { text: 'Practice writing job descriptions', completed: false },
        ],
        category: 'skill_development',
      },
      {
        week: 7,
        title: 'Build EM Network',
        subtasks: [
          { text: 'Connect with 5 engineering managers', completed: false },
          { text: 'Join engineering management communities', completed: false },
          { text: 'Schedule mentorship conversations', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 8,
        title: 'Internal Visibility',
        subtasks: [
          { text: 'Lead a cross-team initiative', completed: false },
          { text: 'Present to leadership on team achievements', completed: false },
          { text: 'Express interest in management track', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 9,
        title: 'Interview Preparation',
        subtasks: [
          { text: 'Prepare leadership STAR stories', completed: false },
          { text: 'Practice management scenario questions', completed: false },
          { text: 'Research EM roles at target companies', completed: false },
        ],
        category: 'networking',
      },
      {
        week: 10,
        title: 'Opportunity Search',
        subtasks: [
          { text: 'Apply to 10 engineering manager roles', completed: false },
          { text: 'Discuss internal promotion opportunities', completed: false },
          { text: 'Leverage network for referrals', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 11,
        title: 'Interview Execution',
        subtasks: [
          { text: 'Complete management interview rounds', completed: false },
          { text: 'Demonstrate leadership experience', completed: false },
          { text: 'Ask insightful questions about team/culture', completed: false },
        ],
        category: 'job_search',
      },
      {
        week: 12,
        title: 'Transition to Management',
        subtasks: [
          { text: 'Negotiate EM offer or promotion', completed: false },
          { text: 'Plan 30-60-90 day management onboarding', completed: false },
          { text: 'Set up initial 1:1s with future reports', completed: false },
        ],
        category: 'job_search',
      },
    ],
  },
};

export function getTemplateById(templateId: string): PlanTemplate | null {
  return planTemplates[templateId] || null;
}
