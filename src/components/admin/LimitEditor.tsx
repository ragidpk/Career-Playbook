import { useState } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

interface LimitEditorProps {
  userId: string;
  currentLimit: number;
  onLimitChange: (userId: string, limit: number) => Promise<void>;
}

export default function LimitEditor({ userId, currentLimit, onLimitChange }: LimitEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentLimit.toString());
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    const newLimit = parseInt(value, 10);
    if (isNaN(newLimit) || newLimit < 0) {
      setValue(currentLimit.toString());
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onLimitChange(userId, newLimit);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update limit:', error);
      setValue(currentLimit.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(currentLimit.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={isLoading}
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="Save"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-1 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded group"
      title="Click to edit"
    >
      <span className={currentLimit > 2 ? 'text-primary-600 font-medium' : ''}>
        {currentLimit}
      </span>
      <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
