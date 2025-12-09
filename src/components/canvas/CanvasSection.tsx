import Textarea from '../shared/Textarea';

interface CanvasSectionProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  maxLength?: number;
  readOnly?: boolean;
}

export default function CanvasSection({
  label,
  value,
  onChange,
  onBlur,
  maxLength = 500,
  readOnly = false
}: CanvasSectionProps) {
  const characterCount = value?.length || 0;
  const remaining = maxLength - characterCount;

  return (
    <div className="space-y-2">
      <Textarea
        id={label.toLowerCase().replace(/\s+/g, '-')}
        label={label}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        rows={4}
        maxLength={maxLength}
        placeholder={`Enter your response for: ${label}`}
        readOnly={readOnly}
        disabled={readOnly}
      />
      {!readOnly && (
        <div className="flex justify-between items-center text-sm">
          <span className={`${remaining < 50 ? 'text-orange-600' : 'text-gray-500'}`}>
            {characterCount} / {maxLength} characters
          </span>
          {remaining < 50 && (
            <span className="text-orange-600 font-medium">
              {remaining} remaining
            </span>
          )}
        </div>
      )}
    </div>
  );
}
