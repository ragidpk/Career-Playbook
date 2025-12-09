// ReadOnlyOverlay Component
// Banner showing mentor is viewing in read-only mode

interface ReadOnlyOverlayProps {
  menteeName?: string;
}

export default function ReadOnlyOverlay({ menteeName }: ReadOnlyOverlayProps) {
  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="flex items-center justify-center space-x-2">
        <svg
          className="h-5 w-5 text-blue-600"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-blue-900 font-medium">
          {menteeName
            ? `You're viewing ${menteeName}'s career data as a mentor`
            : "You're viewing as a mentor"}
        </span>
        <span className="text-blue-700 text-sm">(Read-only)</span>
      </div>
    </div>
  );
}
