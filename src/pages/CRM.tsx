import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import Button from '../components/shared/Button';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import CompanyList from '../components/crm/CompanyList';
import CompanyForm from '../components/crm/CompanyForm';
import StatusFilter from '../components/crm/StatusFilter';
import type { CompanyFormData } from '../components/crm/CompanyForm';
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
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
  const [sortBy, setSortBy] = useState<'name' | 'date_added'>('date_added');
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

  const handleSort = (field: 'name' | 'date_added') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'date_added' ? 'desc' : 'asc');
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
          company.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((company) =>
        selectedStatuses.includes(company.status)
      );
    }

    return filtered;
  }, [companies, searchQuery, selectedStatuses]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company CRM</h1>
          <p className="text-gray-600">
            Track companies you're interested in and manage your job search
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Filter and Add Button */}
          <div className="flex gap-3">
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Company
              </span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        {companies.length > 0 && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {companies.length}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {companies.filter((c) => c.status === 'researching').length}
              </div>
              <div className="text-sm text-gray-600">Researching</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {companies.filter((c) => c.status === 'applied').length}
              </div>
              <div className="text-sm text-gray-600">Applied</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {companies.filter((c) => c.status === 'interviewing').length}
              </div>
              <div className="text-sm text-gray-600">Interviewing</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {companies.filter((c) => c.status === 'offer').length}
              </div>
              <div className="text-sm text-gray-600">Offers</div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {(searchQuery || selectedStatuses.length > 0) && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredCompanies.length} of {companies.length} companies
            {selectedStatuses.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStatuses([])}
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
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
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
