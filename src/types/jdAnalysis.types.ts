// JD Analysis Types
// Types for resume vs job description analysis feature

export type JDSourceType = 'url' | 'file' | 'text';

// Job description structure
export interface JobDescription {
  id?: string;
  user_id?: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience_required?: string;
  source_url?: string;
  source_type?: JDSourceType;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

// Request to extract JD from various sources
export interface ExtractJDRequest {
  source: JDSourceType;
  url?: string;
  fileBase64?: string;
  fileName?: string;
  text?: string;
}

// Section analysis result
export interface SectionAnalysis {
  score: number;
  feedback: string;
}

// Improvement suggestion
export interface Improvement {
  section: string;
  current: string;
  suggested: string;
  reason: string;
}

// Keyword analysis breakdown
export interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  bonus: string[];
}

// Full analysis result from edge function
export interface AnalysisResult {
  matchScore: number;
  keywordAnalysis: KeywordAnalysis;
  sectionAnalysis: {
    experience: SectionAnalysis;
    skills: SectionAnalysis;
    education: SectionAnalysis;
  };
  improvements: Improvement[];
  tailoredSummary: string;
  actionItems: string[];
}

// Stored analysis record (from database)
export interface ResumeJDAnalysis {
  id: string;
  user_id: string;
  resume_analysis_id?: string;
  job_description_id: string;
  resume_file_name?: string;
  resume_text?: string;
  match_score: number;
  keyword_analysis: KeywordAnalysis;
  section_analysis: {
    experience: SectionAnalysis;
    skills: SectionAnalysis;
    education: SectionAnalysis;
  };
  improvements: Improvement[];
  tailored_summary: string;
  action_items: string[];
  created_at: string;
  // Joined data
  job_description?: JobDescription;
}

// Request to analyze resume against JD
export interface AnalyzeResumeJDRequest {
  resumeText: string;
  jobDescription: JobDescription;
}

// Input for saving a new JD
export interface SaveJobDescriptionInput {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  experience_required?: string;
  source_url?: string;
  source_type: JDSourceType;
}

// Input for creating analysis record
export interface CreateAnalysisInput {
  job_description_id: string;
  resume_analysis_id?: string;
  resume_file_name?: string;
  resume_text?: string;
  match_score: number;
  keyword_analysis: KeywordAnalysis;
  section_analysis: {
    experience: SectionAnalysis;
    skills: SectionAnalysis;
    education: SectionAnalysis;
  };
  improvements: Improvement[];
  tailored_summary: string;
  action_items: string[];
}
