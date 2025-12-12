import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import Button from '../components/shared/Button';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import CompanyList from '../components/crm/CompanyList';
import CompanyForm from '../components/crm/CompanyForm';
import StatusFilter from '../components/crm/StatusFilter';
import type { CompanyFormData } from '../components/crm/CompanyForm';
import { Building2, Plus, Search, Star, Bell } from 'lucide-react';
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  toggleFavorite,
  type Company,
} from '../services/company.service';

export default function CRM() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Company['status'][]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date_added' | 'priority'>('date_added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      loadCompanies();
    }
  }, [user]);

  const loadCompanies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getCompanies(user.id);
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
      showToast('Failed to load companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsFormOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  const handleDeleteCompany = async (company: Company) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${company.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteCompany(company.id);
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      showToast('Company deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting company:', error);
      showToast('Failed to delete company', 'error');
    }
  };

  const handleToggleFavorite = async (company: Company) => {
    try {
      const updated = await toggleFavorite(company.id, !company.is_favorite);
      setCompanies((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      showToast(
        company.is_favorite ? 'Removed from favorites' : 'Added to favorites',
        'success'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorite status', 'error');
    }
  };

  const handleSubmitForm = async (formData: CompanyFormData) => {
    if (!user) return;

    try {
      if (editingCompany) {
        const updated = await updateCompany(editingCompany.id, formData);
        setCompanies((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        showToast('Company updated successfully', 'success');
      } else {
        const newCompany = await createCompany(user.id, formData);
        setCompanies((prev) => [newCompany, ...prev]);
        showToast('Company added successfully', 'success');
      }
      setIsFormOpen(false);
      setEditingCompany(null);
    } catch (error) {
      console.error('Error saving company:', error);
      showToast('Failed to save company', 'error');
      throw error;
    }
  };

  const handleSort = (field: 'name' | 'date_added' | 'priority') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'date_added' ? 'desc' : field === 'priority' ? 'desc' : 'asc');
    }
  };

  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.website_url?.toLowerCase().includes(query) ||
          company.notes?.toLowerCase().includes(query) ||
          company.job_title?.toLowerCase().includes(query) ||
          company.contact_name?.toLowerCase().includes(query) ||
          company.location?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((company) =>
        selectedStatuses.includes(company.status)
      );
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter((company) => company.is_favorite);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'date_added') {
        comparison = new Date(a.date_added).getTime() - new Date(b.date_added).getTime();
      } else if (sortBy === 'priority') {
        comparison = (a.priority || 3) - (b.priority || 3);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [companies, searchQuery, selectedStatuses, showFavoritesOnly, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: companies.length,
      researching: companies.filter((c) => c.status === 'researching').length,
      applied: companies.filter((c) => c.status === 'applied').length,
      interviewing: companies.filter((c) => c.status === 'interviewing').length,
      offers: companies.filter((c) => c.status === 'offer').length,
      favorites: companies.filter((c) => c.is_favorite).length,
      pendingFollowups: companies.filter(
        (c) => c.next_followup_date && c.next_followup_date <= today
      ).length,
    };
  }, [companies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-gray-900">Job Hunt CRM</h1>
          </div>
          <p className="text-gray-600">
            Track companies, contacts, and opportunities in your job search
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies, jobs, contacts, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Filter and Add Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFavoritesOnly
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              Favorites
            </button>
            <StatusFilter
              selectedStatuses={selectedStatuses}
              onStatusChange={setSelectedStatuses}
            />
            <Button
              onClick={handleAddCompany}
              variant="primary"
              className="whitespace-nowrap"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Company
              </span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        {companies.length > 0 && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {stats.researching}
              </div>
              <div className="text-sm text-gray-600">Researching</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.applied}
              </div>
              <div className="text-sm text-gray-600">Applied</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.interviewing}
              </div>
              <div className="text-sm text-gray-600">Interviewing</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.offers}
              </div>
              <div className="text-sm text-gray-600">Offers</div>
            </div>
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="bg-white rounded-lg shadow p-4 text-center hover:bg-yellow-50 transition-colors"
            >
              <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-current" />
                {stats.favorites}
              </div>
              <div className="text-sm text-gray-600">Favorites</div>
            </button>
            {stats.pendingFollowups > 0 && (
              <div className="bg-red-50 rounded-lg shadow p-4 text-center border border-red-200">
                <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                  <Bell className="w-5 h-5" />
                  {stats.pendingFollowups}
                </div>
                <div className="text-sm text-red-600">Follow-ups Due</div>
              </div>
            )}
          </div>
        )}

        {/* Sort Options */}
        <div className="mb-4 flex items-center gap-4 text-sm">
          <span className="text-gray-500">Sort by:</span>
          <button
            type="button"
            onClick={() => handleSort('date_added')}
            className={`px-3 py-1 rounded ${
              sortBy === 'date_added'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Date {sortBy === 'date_added' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('name')}
            className={`px-3 py-1 rounded ${
              sortBy === 'name'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Name {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('priority')}
            className={`px-3 py-1 rounded ${
              sortBy === 'priority'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Priority {sortBy === 'priority' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>

        {/* Results Count */}
        {(searchQuery || selectedStatuses.length > 0 || showFavoritesOnly) && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredCompanies.length} of {companies.length} companies
            {(selectedStatuses.length > 0 || showFavoritesOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatuses([]);
                  setShowFavoritesOnly(false);
                }}
                className="ml-2 text-primary-500 hover:text-primary-600 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Company List */}
        <CompanyList
          companies={filteredCompanies}
          onEdit={handleEditCompany}
          onDelete={handleDeleteCompany}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Company Form Modal */}
        <CompanyForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCompany(null);
          }}
          onSubmit={handleSubmitForm}
          company={editingCompany}
        />
      </div>
    </div>
  );
}
