import { Building2 } from 'lucide-react';
import CompanyCard from './CompanyCard';
import type { Company } from '../../services/company.service';

interface CompanyListProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onToggleFavorite?: (company: Company) => void;
}

export default function CompanyList({
  companies,
  onEdit,
  onDelete,
  onToggleFavorite,
}: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No companies tracked yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding your first company to track.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
