import { useState, useRef } from 'react';
import { Check, Circle, Clock, Download, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import type { Database } from '../../types/database.types';

type WeeklyMilestone = Database['public']['Tables']['weekly_milestones']['Row'];
type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

interface UserInfo {
  name?: string;
  email?: string;
}

interface MilestoneTimelineProps {
  planId: string;
  milestones: WeeklyMilestone[];
  planTitle?: string;
  userInfo?: UserInfo;
  canvas?: Partial<CareerCanvas> | null;
  planStartDate?: string;
  onToggleComplete?: (milestoneId: string, currentStatus: string) => void;
}

// Helper to get week dates (Monday to Sunday)
const getWeekDates = (planStartDate: string | undefined, weekNumber: number) => {
  if (!planStartDate) return null;

  const startDate = new Date(planStartDate);
  // Get the Monday of the first week (adjust to Monday if not already)
  const firstMonday = startOfWeek(startDate, { weekStartsOn: 1 });

  // Calculate the Monday of this specific week
  const weekStart = addDays(firstMonday, (weekNumber - 1) * 7);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  return {
    start: format(weekStart, 'MMM d'),
    end: format(weekEnd, 'MMM d, yyyy'),
    startFull: format(weekStart, 'MMMM d, yyyy'),
  };
};

const CANVAS_SECTIONS = [
  { key: 'section_1_helpers' as const, label: 'Who I Help' },
  { key: 'section_2_activities' as const, label: 'Key Activities' },
  { key: 'section_3_value' as const, label: 'Value I Provide' },
  { key: 'section_4_interactions' as const, label: 'How I Interact' },
  { key: 'section_5_convince' as const, label: 'How I Convince' },
  { key: 'section_6_skills' as const, label: 'Skills I Need' },
  { key: 'section_7_motivation' as const, label: 'What Motivates Me' },
  { key: 'section_8_sacrifices' as const, label: 'Sacrifices I Will Make' },
  { key: 'section_9_outcomes' as const, label: 'Desired Outcomes' },
];

const statusConfig = {
  not_started: {
    icon: Circle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Not Started',
  },
  in_progress: {
    icon: Clock,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'In Progress',
  },
  completed: {
    icon: Check,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Completed',
  },
};

export default function MilestoneTimeline({ milestones, planTitle, userInfo, canvas, planStartDate, onToggleComplete }: MilestoneTimelineProps) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Get filled canvas sections for display
  const filledCanvasSections = CANVAS_SECTIONS.filter(
    (section) => canvas?.[section.key] && (canvas[section.key] as string).trim().length > 0
  );

  // Group milestones by month (4 weeks each)
  const month1 = milestones.slice(0, 4);
  const month2 = milestones.slice(4, 8);
  const month3 = milestones.slice(8, 12);

  // Get formatted start date for display
  const formattedStartDate = planStartDate
    ? format(new Date(planStartDate), 'MMMM d, yyyy')
    : null;

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      const checkNewPage = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
      };

      const addText = (text: string, fontSize: number, isBold = false, color = '#000000') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(color);
        const lines = pdf.splitTextToSize(text, contentWidth);
        const lineHeight = fontSize * 0.4;
        checkNewPage(lines.length * lineHeight);
        pdf.text(lines, margin, yPos);
        yPos += lines.length * lineHeight + 2;
      };

      // Title
      addText(planTitle || '12-Week Milestone Timeline', 20, true);
      yPos += 2;

      // User Info
      if (userInfo?.name) {
        addText(`Name: ${userInfo.name}`, 11);
      }
      if (userInfo?.email) {
        addText(`Email: ${userInfo.email}`, 11);
      }
      addText(`Generated: ${new Date().toLocaleDateString()}`, 11);

      if (canvas?.target_role) {
        addText(`Target Role: ${canvas.target_role}`, 11, false, '#6366f1');
      }

      yPos += 5;

      // Career Canvas Summary
      if (filledCanvasSections.length > 0) {
        checkNewPage(15);
        addText('Career Canvas Summary', 14, true);
        yPos += 3;

        filledCanvasSections.forEach((section) => {
          const value = canvas?.[section.key] as string;
          if (value) {
            checkNewPage(20);
            addText(section.label, 10, true, '#6b7280');
            addText(value, 10, false, '#374151');
            yPos += 3;
          }
        });

        yPos += 5;
      }

      // 12-Week Timeline
      checkNewPage(15);
      addText('12-Week Milestone Timeline', 14, true);
      if (formattedStartDate) {
        addText(`Start Date: ${formattedStartDate}`, 10, false, '#6b7280');
      }
      yPos += 5;

      // Group milestones by month
      const groups = [
        { label: 'Weeks 1-4', milestones: month1 },
        { label: 'Weeks 5-8', milestones: month2 },
        { label: 'Weeks 9-12', milestones: month3 },
      ];

      groups.forEach((group) => {
        checkNewPage(15);
        addText(group.label, 12, true, '#1f2937');
        yPos += 2;

        group.milestones.forEach((milestone) => {
          checkNewPage(20);
          const statusLabel = statusConfig[milestone.status]?.label || 'Not Started';
          const weekDates = getWeekDates(planStartDate, milestone.week_number);
          const dateRange = weekDates ? ` (${weekDates.start} - ${weekDates.end})` : '';
          addText(`Week ${milestone.week_number}${dateRange} - ${statusLabel}`, 10, true, '#374151');
          if (milestone.goal) {
            addText(milestone.goal, 10, false, '#4b5563');
          } else {
            addText('No goal set', 10, false, '#9ca3af');
          }
          yPos += 2;
        });

        yPos += 5;
      });

      // Generate filename from plan title
      const filename = (planTitle || '12-week-milestone-timeline')
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase();
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderMilestoneGroup = (groupMilestones: WeeklyMilestone[], monthLabel: string) => {
    const completedCount = groupMilestones.filter(m => m.status === 'completed').length;
    const totalCount = groupMilestones.length;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">{monthLabel}</h4>
          <span className="text-xs text-gray-500">
            {completedCount}/{totalCount} completed
          </span>
        </div>
        <div className="space-y-2">
          {groupMilestones.map((milestone) => {
            const config = statusConfig[milestone.status];
            const Icon = config.icon;
            const isExpanded = expandedWeek === milestone.id;
            const weekDates = getWeekDates(planStartDate, milestone.week_number);

            const handleToggle = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (onToggleComplete) {
                onToggleComplete(milestone.id, milestone.status);
              }
            };

            return (
              <div key={milestone.id}>
                <div
                  onClick={() => setExpandedWeek(isExpanded ? null : milestone.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    isExpanded ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {/* Clickable status toggle */}
                  <button
                    type="button"
                    onClick={handleToggle}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 relative z-10 ${
                      milestone.status === 'completed'
                        ? 'bg-blue-100 hover:bg-blue-200'
                        : milestone.status === 'in_progress'
                        ? 'bg-green-100 hover:bg-green-200'
                        : 'bg-yellow-100 hover:bg-yellow-200'
                    }`}
                    title={
                      milestone.status === 'not_started'
                        ? 'Mark as in progress'
                        : milestone.status === 'in_progress'
                        ? 'Mark as completed'
                        : 'Mark as not started'
                    }
                  >
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        Week {milestone.week_number}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    {weekDates && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {weekDates.start} - {weekDates.end}
                      </p>
                    )}
                    {milestone.goal && (
                      <p className="text-sm text-gray-600 truncate mt-0.5">
                        {milestone.goal}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-2 ml-11 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {weekDates && (
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Date Range</h5>
                        <p className="text-sm text-gray-700">{weekDates.start} - {weekDates.end}</p>
                      </div>
                    )}
                    {milestone.goal ? (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Goal</h5>
                        <p className="text-sm text-gray-700">{milestone.goal}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No goal set for this week</p>
                    )}
                    {milestone.notes && (
                      <div className="mt-3">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{milestone.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* Timeline Content */}
      <div ref={timelineRef} className="bg-white p-6 rounded-lg">
        {/* PDF/Print Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{planTitle || '12-Week Milestone Timeline'}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            {userInfo?.name && <p><span className="font-medium">Name:</span> {userInfo.name}</p>}
            {userInfo?.email && <p><span className="font-medium">Email:</span> {userInfo.email}</p>}
            <p><span className="font-medium">Generated:</span> {new Date().toLocaleDateString()}</p>
          </div>
          {canvas?.target_role && (
            <p className="mt-2 text-sm"><span className="font-medium text-gray-700">Target Role:</span> <span className="text-primary-600">{canvas.target_role}</span></p>
          )}
        </div>

        {/* Career Canvas Summary */}
        {filledCanvasSections.length > 0 && (
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Career Canvas Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filledCanvasSections.map((section) => (
                <div key={section.key} className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">{section.label}</h3>
                  <p className="text-sm text-gray-700">{canvas?.[section.key] as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12-Week Timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">12-Week Milestone Timeline</h2>
            {formattedStartDate && (
              <span className="text-sm text-gray-500">Start: {formattedStartDate}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderMilestoneGroup(month1, 'Weeks 1-4')}
            {renderMilestoneGroup(month2, 'Weeks 5-8')}
            {renderMilestoneGroup(month3, 'Weeks 9-12')}
          </div>
        </div>
      </div>
    </div>
  );
}
