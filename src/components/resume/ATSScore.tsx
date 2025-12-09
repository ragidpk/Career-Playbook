interface ATSScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ATSScore({ score, size = 'md' }: ATSScoreProps) {
  // Ensure score is within valid range
  const validScore = Math.max(0, Math.min(100, score));

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score <= 30) return '#F44336'; // Red
    if (score <= 70) return '#FF9800'; // Yellow/Orange
    return '#4CAF50'; // Green
  };

  // Determine size dimensions
  const getSizeDimensions = () => {
    switch (size) {
      case 'sm':
        return { size: 80, strokeWidth: 8, fontSize: '18px' };
      case 'lg':
        return { size: 200, strokeWidth: 12, fontSize: '48px' };
      default:
        return { size: 120, strokeWidth: 10, fontSize: '28px' };
    }
  };

  const color = getScoreColor(validScore);
  const { size: svgSize, strokeWidth, fontSize } = getSizeDimensions();
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (validScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score text */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize }}
        >
          <span className="font-bold" style={{ color }}>
            {validScore}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">ATS Score</p>
        <p className="text-xs text-gray-500">
          {validScore <= 30 && 'Needs Improvement'}
          {validScore > 30 && validScore <= 70 && 'Good'}
          {validScore > 70 && 'Excellent'}
        </p>
      </div>
    </div>
  );
}
