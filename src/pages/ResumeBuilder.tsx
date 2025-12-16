import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus, Upload, MoreVertical, Star, Copy, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserResumes } from '../hooks/useResumeBuilder';
import ResumeBuilderWizard from '../components/resume-builder/ResumeBuilderWizard';
import ImportResumeModal from '../components/resume-builder/import/ImportResumeModal';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useToast } from '../components/shared/Toast';

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const {
    resumes,
    isLoading,
    error,
    create,
    remove,
    duplicate,
    setPrimary,
    isCreating,
  } = useUserResumes(user?.id);

  const [showImportModal, setShowImportModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const selectedResumeId = searchParams.get('id');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleCreateNew = async () => {
    try {
      const newResume = await create({ name: 'New Resume' });
      setSearchParams({ id: newResume.id });
      showToast('Resume created', 'success');
    } catch {
      showToast('Failed to create resume', 'error');
    }
  };

  const handleImportComplete = (resumeId: string) => {
    setShowImportModal(false);
    setSearchParams({ id: resumeId });
    showToast('Resume imported successfully', 'success');
  };

  const handleSelectResume = (id: string) => {
    setSearchParams({ id });
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(null);
    try {
      const duplicated = await duplicate(id);
      setSearchParams({ id: duplicated.id });
      showToast('Resume duplicated', 'success');
    } catch {
      showToast('Failed to duplicate resume', 'error');
    }
  };

  const handleSetPrimary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(null);
    try {
      await setPrimary(id);
      showToast('Primary resume updated', 'success');
    } catch {
      showToast('Failed to set primary resume', 'error');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(null);
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await remove(id);
      if (selectedResumeId === id) {
        setSearchParams({});
      }
      showToast('Resume deleted', 'success');
    } catch {
      showToast('Failed to delete resume', 'error');
    }
  };

  const handleBackToList = () => {
    setSearchParams({});
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to access the Resume Builder.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If a resume is selected, show the wizard
  if (selectedResumeId) {
    return (
      <ResumeBuilderWizard
        resumeId={selectedResumeId}
        onBack={handleBackToList}
      />
    );
  }

  // Resume list view
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Builder</h1>
          <p className="text-gray-600">
            Create professional resumes with AI-powered content suggestions
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={handleCreateNew}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create New Resume
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-5 w-5" />
            Import from PDF
          </button>
        </div>

        {/* Resume Grid */}
        {resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Resumes Yet</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Create a new resume from scratch or import an existing PDF to get started.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={handleCreateNew}
                disabled={isCreating}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                Create New
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Upload className="h-5 w-5" />
                Import PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                onClick={() => handleSelectResume(resume.id)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all relative group"
              >
                {/* Primary Badge */}
                {resume.is_primary && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      <Star className="h-3 w-3 fill-current" />
                      Primary
                    </span>
                  </div>
                )}

                {/* Menu Button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === resume.id ? null : resume.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {activeMenu === resume.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      {!resume.is_primary && (
                        <button
                          onClick={(e) => handleSetPrimary(resume.id, e)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Star className="h-4 w-4" />
                          Set as Primary
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDuplicate(resume.id, e)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => handleDelete(resume.id, e)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Resume Preview */}
                <div className="mt-8">
                  <div className="w-full aspect-[8.5/11] bg-gray-100 rounded border border-gray-200 flex items-center justify-center mb-4">
                    <FileText className="h-16 w-16 text-gray-300" />
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{resume.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Updated {new Date(resume.updated_at).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {resume.selected_template}
                    </span>
                    {resume.imported_from && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        Imported
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportResumeModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
}
