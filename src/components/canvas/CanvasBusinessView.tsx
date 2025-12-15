import { Target, Eye, Edit2 } from 'lucide-react';
import type { Database } from '../../types/database.types';

type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

// Section configuration matching the Business Canvas layout
const SECTION_CONFIG = {
  section_1_helpers: {
    title: 'Who helps you succeed?',
    tag: 'Collaboration',
    tagColor: 'bg-teal-500',
  },
  section_2_activities: {
    title: 'What are the key activities in your role?',
    tag: 'Excellence',
    tagColor: 'bg-pink-500',
  },
  section_3_value: {
    title: 'What do others gain from you?',
    tag: 'Value',
    tagColor: 'bg-blue-500',
  },
  section_4_interactions: {
    title: 'How do you interact with others?',
    tag: 'Respect',
    tagColor: 'bg-pink-500',
  },
  section_5_convince: {
    title: 'Who do you need to convince?',
    tag: 'Professionalism',
    tagColor: 'bg-teal-500',
  },
  section_6_skills: {
    title: 'What are your skills and interests?',
    tag: 'Passion',
    tagColor: 'bg-pink-500',
  },
  section_7_motivation: {
    title: 'What motivates you?',
    tag: 'Excellence',
    tagColor: 'bg-pink-500',
  },
  section_8_sacrifices: {
    title: 'What sacrifices do you make?',
    tag: 'Respect',
    tagColor: 'bg-pink-500',
  },
  section_9_outcomes: {
    title: 'What outcomes do you want?',
    tag: 'Excellence',
    tagColor: 'bg-pink-500',
  },
};

interface CanvasBusinessViewProps {
  canvas: Partial<CareerCanvas>;
  canvasName?: string;
  onEdit?: () => void;
  linkedPlanId?: string | null;
}

function CanvasSection({
  title,
  content,
  tag,
  tagColor,
  className = '',
}: {
  title: string;
  content: string | null | undefined;
  tag: string;
  tagColor: string;
  className?: string;
}) {
  // Parse content into bullet points (split by newlines or commas)
  const items = content
    ? content
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

  return (
    <div className={`bg-white border border-gray-200 flex flex-col h-full ${className}`}>
      {/* Section Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 leading-tight">{title}</h3>
      </div>

      {/* Section Content */}
      <div className="p-4 flex-1">
        {items.length > 0 ? (
          <ul className="space-y-1.5">
            {items.map((item, index) => (
              <li key={index} className="text-sm text-gray-600 leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 italic">Not yet defined</p>
        )}
      </div>

      {/* Section Tag */}
      <div className="p-3 pt-0">
        <span
          className={`inline-block px-3 py-1 text-xs font-medium text-white rounded-full ${tagColor}`}
        >
          {tag}
        </span>
      </div>
    </div>
  );
}

export default function CanvasBusinessView({
  canvas,
  canvasName = 'My Career Canvas',
  onEdit,
  linkedPlanId,
}: CanvasBusinessViewProps) {
  // Use target_role as the primary display name
  const displayName = canvas.target_role || canvasName || 'Career Canvas';

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-600">Career Canvas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {linkedPlanId && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <Eye className="w-3 h-3" />
              90-Day Plan Linked
            </span>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
              title="Edit Canvas"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Grid - Business Model Canvas Layout */}
      <div className="grid grid-cols-5 gap-px bg-gray-200 rounded-xl overflow-hidden">
        {/* Row 1: 5 equal columns */}
        <CanvasSection
          title={SECTION_CONFIG.section_1_helpers.title}
          content={canvas.section_1_helpers}
          tag={SECTION_CONFIG.section_1_helpers.tag}
          tagColor={SECTION_CONFIG.section_1_helpers.tagColor}
          className="rounded-tl-xl"
        />
        <CanvasSection
          title={SECTION_CONFIG.section_2_activities.title}
          content={canvas.section_2_activities}
          tag={SECTION_CONFIG.section_2_activities.tag}
          tagColor={SECTION_CONFIG.section_2_activities.tagColor}
        />
        <CanvasSection
          title={SECTION_CONFIG.section_3_value.title}
          content={canvas.section_3_value}
          tag={SECTION_CONFIG.section_3_value.tag}
          tagColor={SECTION_CONFIG.section_3_value.tagColor}
        />
        <CanvasSection
          title={SECTION_CONFIG.section_4_interactions.title}
          content={canvas.section_4_interactions}
          tag={SECTION_CONFIG.section_4_interactions.tag}
          tagColor={SECTION_CONFIG.section_4_interactions.tagColor}
        />
        <CanvasSection
          title={SECTION_CONFIG.section_5_convince.title}
          content={canvas.section_5_convince}
          tag={SECTION_CONFIG.section_5_convince.tag}
          tagColor={SECTION_CONFIG.section_5_convince.tagColor}
          className="rounded-tr-xl"
        />

        {/* Row 2: Skills spans 2 cols, Motivations spans 2 cols */}
        <div className="col-span-2">
          <CanvasSection
            title={SECTION_CONFIG.section_6_skills.title}
            content={canvas.section_6_skills}
            tag={SECTION_CONFIG.section_6_skills.tag}
            tagColor={SECTION_CONFIG.section_6_skills.tagColor}
          />
        </div>
        {/* Empty middle column */}
        <div className="bg-white" />
        <div className="col-span-2">
          <CanvasSection
            title={SECTION_CONFIG.section_7_motivation.title}
            content={canvas.section_7_motivation}
            tag={SECTION_CONFIG.section_7_motivation.tag}
            tagColor={SECTION_CONFIG.section_7_motivation.tagColor}
          />
        </div>

        {/* Row 3: Sacrifices and Outcomes */}
        <div className="col-span-2">
          <CanvasSection
            title={SECTION_CONFIG.section_8_sacrifices.title}
            content={canvas.section_8_sacrifices}
            tag={SECTION_CONFIG.section_8_sacrifices.tag}
            tagColor={SECTION_CONFIG.section_8_sacrifices.tagColor}
            className="rounded-bl-xl"
          />
        </div>
        {/* Empty middle column */}
        <div className="bg-white" />
        <div className="col-span-2">
          <CanvasSection
            title={SECTION_CONFIG.section_9_outcomes.title}
            content={canvas.section_9_outcomes}
            tag={SECTION_CONFIG.section_9_outcomes.tag}
            tagColor={SECTION_CONFIG.section_9_outcomes.tagColor}
            className="rounded-br-xl"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Completion: {canvas.completion_percentage || 0}%</span>
        </div>
        <span>Career Playbook</span>
      </div>
    </div>
  );
}
