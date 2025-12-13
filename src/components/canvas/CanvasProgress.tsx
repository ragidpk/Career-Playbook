interface CanvasProgressProps {
  percentage: number;
}

export default function CanvasProgress({ percentage }: CanvasProgressProps) {
  const displayPercentage = Math.round(percentage || 0);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">Canvas Completion</span>
        <span className="font-semibold text-primary-600">{displayPercentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-primary-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${displayPercentage}%` }}
          role="progressbar"
          aria-valuenow={displayPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Your Career Plans ${displayPercentage}% complete`}
        />
      </div>
      {displayPercentage === 100 ? (
        <p className="text-sm text-green-600 font-medium">
          Complete! All sections filled out.
        </p>
      ) : (
        <p className="text-sm text-gray-600">
          Fill out all 9 sections to complete your Career Plans
        </p>
      )}
    </div>
  );
}
