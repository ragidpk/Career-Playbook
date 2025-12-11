import { useAuth } from '../hooks/useAuth';
import { useCanvas } from '../hooks/useCanvas';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import CareerCanvas from '../components/canvas/CareerCanvas';

export default function Canvas() {
  const { user } = useAuth();
  const { canvas, isLoading, save, isSaving } = useCanvas(user?.id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <CareerCanvas canvas={canvas || {}} onSave={save} isSaving={isSaving} />
      </div>
    </div>
  );
}
