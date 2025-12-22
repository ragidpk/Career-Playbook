import { forwardRef } from 'react';

interface NinetyDayStrategy {
  overview?: string;
  weeks_1_4?: string[];
  weeks_5_8?: string[];
  weeks_9_12?: string[];
}

interface PrintableReportProps {
  analysis: {
    ats_score: number;
    strengths?: string[];
    gaps?: string[];
    recommendations?: string[];
    file_name?: string;
    candidate_name?: string;
    target_country?: string;
    summary?: string;
    experience_level?: string;
    skills_identified?: string[];
    role_recommendations?: string[];
    job_search_approach?: string[];
    ninety_day_strategy?: NinetyDayStrategy;
    analysis_date?: string;
  };
  displayName: string;
}

const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ analysis, displayName }, ref) => {
    // Safe defaults for all arrays
    const strengths = analysis.strengths || [];
    const gaps = analysis.gaps || [];
    const recommendations = analysis.recommendations || [];
    const skills = analysis.skills_identified || [];
    const roles = analysis.role_recommendations || [];
    const searchApproach = analysis.job_search_approach || [];
    const ninetyDay = analysis.ninety_day_strategy || {};

    const formatDate = (dateString?: string) => {
      try {
        if (!dateString) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch {
        return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    };

    const getScoreColor = (score: number) => {
      if (score >= 70) return '#22c55e';
      if (score >= 40) return '#f59e0b';
      return '#ef4444';
    };

    const getScoreLabel = (score: number) => {
      if (score >= 70) return 'Excellent';
      if (score >= 40) return 'Good';
      return 'Needs Improvement';
    };

    // Safe score value
    const atsScore = typeof analysis.ats_score === 'number' ? analysis.ats_score : 0;

    return (
      <div
        ref={ref}
        className="bg-white print-only"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm 20mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '11pt',
          lineHeight: '1.4',
          color: '#1f2937',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '3px solid #3b82f6', paddingBottom: '15px', marginBottom: '20px', pageBreakInside: 'avoid' }}>
          <h1 style={{ fontSize: '24pt', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>
            Resume Analysis Report
          </h1>
          <div style={{ marginTop: '8px', fontSize: '14pt', fontWeight: '600', color: '#374151' }}>
            {displayName || 'Candidate'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10pt', color: '#6b7280' }}>
            <span><strong>Resume:</strong> {analysis.file_name || 'N/A'}</span>
            <span><strong>Date:</strong> {formatDate(analysis.analysis_date)}</span>
          </div>
          {analysis.target_country && (
            <div style={{ fontSize: '10pt', color: '#6b7280', marginTop: '5px' }}>
              <strong>Target Location:</strong> {analysis.target_country}
            </div>
          )}
        </div>

        {/* Executive Summary Section */}
        <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 10px 0' }}>
            Executive Summary
          </h2>
          <p style={{ margin: '0 0 15px 0', fontSize: '11pt' }}>
            {analysis.summary || `${displayName || 'The candidate'} is a professional candidate. Please review the detailed analysis below.`}
          </p>

          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            {/* ATS Score */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: `6px solid ${getScoreColor(atsScore)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
              }}>
                <span style={{ fontSize: '24pt', fontWeight: 'bold', color: getScoreColor(atsScore) }}>
                  {atsScore}
                </span>
              </div>
              <div style={{ marginTop: '5px', fontSize: '9pt', color: '#6b7280' }}>ATS Score</div>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', color: getScoreColor(atsScore) }}>
                {getScoreLabel(atsScore)}
              </div>
            </div>

            {/* Experience Level */}
            {analysis.experience_level && (
              <div>
                <div style={{ fontSize: '10pt', color: '#6b7280', marginBottom: '5px' }}>Experience Level</div>
                <span style={{
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontSize: '11pt',
                  fontWeight: '600',
                  display: 'inline-block',
                }}>
                  {analysis.experience_level}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Key Strengths */}
        {strengths.length > 0 && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#166534', margin: '0 0 10px 0' }}>
              Key Strengths
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {strengths.map((strength, i) => (
                <li key={i} style={{ marginBottom: '5px', color: '#374151' }}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills Identified */}
        {skills.length > 0 && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 10px 0' }}>
              Skills Identified
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.map((skill, i) => (
                <span key={i} style={{
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  fontSize: '10pt',
                  display: 'inline-block',
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Areas for Improvement */}
        {gaps.length > 0 && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#b45309', margin: '0 0 10px 0' }}>
              Areas for Improvement
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {gaps.map((gap, i) => (
                <li key={i} style={{ marginBottom: '5px', color: '#374151' }}>{gap}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1d4ed8', margin: '0 0 10px 0' }}>
              Recommendations
            </h2>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              {recommendations.map((rec, i) => (
                <li key={i} style={{ marginBottom: '5px', color: '#374151' }}>{rec}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Page Break for second page */}
        {(roles.length > 0 || searchApproach.length > 0 || (ninetyDay.weeks_1_4?.length || ninetyDay.weeks_5_8?.length || ninetyDay.weeks_9_12?.length)) && (
          <div style={{ pageBreakBefore: 'always' }}></div>
        )}

        {/* Suitable Roles */}
        {roles.length > 0 && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#7c3aed', margin: '0 0 10px 0' }}>
              Suitable Roles{analysis.target_country ? ` in ${analysis.target_country}` : ''}
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px', columns: 2 }}>
              {roles.map((role, i) => (
                <li key={i} style={{ marginBottom: '5px', color: '#374151' }}>{role}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Job Search Strategy */}
        {searchApproach.length > 0 && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#4f46e5', margin: '0 0 10px 0' }}>
              Job Search Strategy{analysis.target_country ? ` for ${analysis.target_country}` : ''}
            </h2>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              {searchApproach.map((approach, i) => (
                <li key={i} style={{ marginBottom: '5px', color: '#374151' }}>{approach}</li>
              ))}
            </ol>
          </div>
        )}

        {/* 12-Week Action Plan */}
        {(ninetyDay.weeks_1_4?.length || ninetyDay.weeks_5_8?.length || ninetyDay.weeks_9_12?.length) ? (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#0d9488', margin: '0 0 10px 0' }}>
              12-Week Action Plan
            </h2>
            {ninetyDay.overview && (
              <p style={{ margin: '0 0 15px 0', fontStyle: 'italic', color: '#6b7280' }}>
                {ninetyDay.overview}
              </p>
            )}

            <div style={{ display: 'flex', gap: '15px' }}>
              {/* Weeks 1-4 */}
              {ninetyDay.weeks_1_4 && ninetyDay.weeks_1_4.length > 0 && (
                <div style={{ flex: 1, backgroundColor: '#f0fdfa', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #14b8a6' }}>
                  <h3 style={{ fontSize: '11pt', fontWeight: 'bold', color: '#0f766e', margin: '0 0 8px 0' }}>
                    Weeks 1-4: Foundation
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '9pt' }}>
                    {ninetyDay.weeks_1_4.map((item, i) => (
                      <li key={i} style={{ marginBottom: '3px', color: '#374151' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weeks 5-8 */}
              {ninetyDay.weeks_5_8 && ninetyDay.weeks_5_8.length > 0 && (
                <div style={{ flex: 1, backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <h3 style={{ fontSize: '11pt', fontWeight: 'bold', color: '#1d4ed8', margin: '0 0 8px 0' }}>
                    Weeks 5-8: Development
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '9pt' }}>
                    {ninetyDay.weeks_5_8.map((item, i) => (
                      <li key={i} style={{ marginBottom: '3px', color: '#374151' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weeks 9-12 */}
              {ninetyDay.weeks_9_12 && ninetyDay.weeks_9_12.length > 0 && (
                <div style={{ flex: 1, backgroundColor: '#faf5ff', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
                  <h3 style={{ fontSize: '11pt', fontWeight: 'bold', color: '#7c3aed', margin: '0 0 8px 0' }}>
                    Weeks 9-12: Implementation
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '9pt' }}>
                    {ninetyDay.weeks_9_12.map((item, i) => (
                      <li key={i} style={{ marginBottom: '3px', color: '#374151' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div style={{
          marginTop: '30px',
          paddingTop: '15px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '9pt',
          color: '#9ca3af',
          pageBreakInside: 'avoid',
        }}>
          <p style={{ margin: '0 0 5px 0' }}>Generated by Career Playbook &bull; {formatDate(analysis.analysis_date)}</p>
          <p style={{ margin: 0 }}>This report is confidential and intended for personal use only.</p>
        </div>
      </div>
    );
  }
);

PrintableReport.displayName = 'PrintableReport';

export default PrintableReport;
