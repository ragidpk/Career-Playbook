import type { UserResume } from '../../../types/resumeBuilder.types';

/**
 * Generate HTML for resume PDF export
 */
function generateResumeHtml(resume: UserResume): string {
  const { personal_info, professional_summary, work_experience, education, skills, certifications } = resume;

  // Template styles based on selected template
  const templateStyles = getTemplateStyles(resume.selected_template);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${resume.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1f2937;
      padding: 0.5in;
      max-width: 8.5in;
      margin: 0 auto;
    }

    ${templateStyles}

    .header {
      margin-bottom: 20px;
    }

    .name {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .title {
      font-size: 14pt;
      color: #4b5563;
      margin-bottom: 8px;
    }

    .contact {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 10pt;
      color: #6b7280;
    }

    .contact a {
      color: #2563eb;
      text-decoration: none;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #111827;
      border-bottom: 1.5px solid #e5e7eb;
      padding-bottom: 4px;
      margin-bottom: 12px;
    }

    .summary {
      color: #374151;
    }

    .experience-item, .education-item {
      margin-bottom: 14px;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .item-title {
      font-weight: 600;
      color: #111827;
    }

    .item-subtitle {
      color: #4b5563;
      font-size: 10pt;
    }

    .item-date {
      font-size: 10pt;
      color: #6b7280;
      white-space: nowrap;
    }

    .bullets {
      margin-top: 6px;
      padding-left: 16px;
    }

    .bullets li {
      margin-bottom: 3px;
      color: #374151;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill {
      background: #f3f4f6;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 10pt;
    }

    .cert-item {
      margin-bottom: 8px;
    }

    .cert-name {
      font-weight: 500;
    }

    .cert-details {
      font-size: 10pt;
      color: #6b7280;
    }

    @media print {
      body {
        padding: 0;
      }
      @page {
        margin: 0.5in;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${personal_info?.fullName || ''}</div>
    ${personal_info?.title ? `<div class="title">${personal_info.title}</div>` : ''}
    <div class="contact">
      ${personal_info?.email ? `<span>${personal_info.email}</span>` : ''}
      ${personal_info?.phone ? `<span>${personal_info.phone}</span>` : ''}
      ${personal_info?.location ? `<span>${personal_info.location}</span>` : ''}
      ${personal_info?.linkedIn ? `<a href="${personal_info.linkedIn}">LinkedIn</a>` : ''}
      ${personal_info?.website ? `<a href="${personal_info.website}">Website</a>` : ''}
    </div>
  </div>

  ${professional_summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <p class="summary">${professional_summary}</p>
  </div>
  ` : ''}

  ${work_experience?.length > 0 ? `
  <div class="section">
    <div class="section-title">Work Experience</div>
    ${work_experience.map(exp => `
      <div class="experience-item">
        <div class="item-header">
          <div>
            <div class="item-title">${exp.position}</div>
            <div class="item-subtitle">${exp.company}${exp.location ? `, ${exp.location}` : ''}</div>
          </div>
          <div class="item-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || ''}</div>
        </div>
        ${exp.bullets?.filter(Boolean).length > 0 ? `
        <ul class="bullets">
          ${exp.bullets.filter(Boolean).map(bullet => `<li>${bullet}</li>`).join('')}
        </ul>
        ` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${education?.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${education.map(edu => `
      <div class="education-item">
        <div class="item-header">
          <div>
            <div class="item-title">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</div>
            <div class="item-subtitle">${edu.institution}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
          </div>
          <div class="item-date">${edu.startDate} - ${edu.current ? 'Present' : edu.endDate || ''}</div>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${skills?.length > 0 ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-list">
      ${skills.map(skill => `<span class="skill">${skill.name}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${certifications?.length > 0 ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    ${certifications.map(cert => `
      <div class="cert-item">
        <div class="cert-name">${cert.name}</div>
        <div class="cert-details">${cert.issuer}${cert.date ? ` | ${cert.date}` : ''}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}
</body>
</html>
  `;
}

/**
 * Get CSS styles based on template type
 */
function getTemplateStyles(template: string): string {
  switch (template) {
    case 'modern':
      return `
        .name { color: #2563eb; }
        .section-title { color: #2563eb; border-color: #2563eb; }
      `;
    case 'classic':
      return `
        .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 16px; }
        .name { color: #1f2937; }
        .section-title { text-align: center; }
      `;
    case 'minimal':
      return `
        .section-title { border-bottom: none; font-weight: 500; text-transform: none; letter-spacing: normal; }
        .skill { background: transparent; padding: 0; }
        .skills-list { gap: 4px; }
        .skill::after { content: '•'; margin-left: 8px; color: #9ca3af; }
        .skill:last-child::after { content: ''; margin-left: 0; }
      `;
    case 'professional':
      return `
        .header { background: #1f2937; color: white; padding: 16px; margin: -0.5in -0.5in 20px -0.5in; }
        .name { color: white; }
        .title { color: #d1d5db; }
        .contact { color: #d1d5db; }
        .contact a { color: #93c5fd; }
        .section-title { color: #1f2937; border-color: #1f2937; }
      `;
    case 'creative':
      return `
        .name { color: #6366f1; }
        .section-title { color: #6366f1; border-color: #6366f1; }
        .skill { background: #e0e7ff; color: #4338ca; }
      `;
    default:
      return '';
  }
}

/**
 * Download resume as PDF using browser print functionality
 */
export async function downloadResumePdf(resume: UserResume): Promise<void> {
  const html = generateResumeHtml(resume);

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}
