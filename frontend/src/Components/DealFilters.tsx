import React from 'react';
import './DealFilters.css';
import { Deal } from '../Models/deal'; // Import Deal interface

interface DealFiltersProps {
  onFilterByType: (type: Deal['status'] | 'all') => void;
  onFilterByYear: (year: number | 'all') => void;
  deals: Deal[]; // To get available years
}

const DealFilters: React.FC<DealFiltersProps> = ({ onFilterByType, onFilterByYear, deals }) => {
  const dealStages: (Deal['status'] | 'all')[] = ['all', 'build_proposal', 'pitch_proposal', 'negotiation', 'awaiting_signoff', 'signed', 'cancelled', 'lost'];

  const updatedYears = ['all', ...new Set(deals
    .filter(deal => deal.updated_at)
    .map(deal => {
      const date = new Date(deal.updated_at as unknown as string);
      return isNaN(date.getTime()) ? null : date.getFullYear();
    })
    .filter(year => year !== null)
  )].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return (typeof b === 'number' && typeof a === 'number') ? b - a : 0;
  });

  return (
    <div className="deal-filters-container">
      <div className="filter-group">
        <label htmlFor="deal-type-filter">Filter by Type:</label>
        <select id="deal-type-filter" onChange={(e) => onFilterByType(e.target.value as Deal['status'] | 'all')}>
          {dealStages.map(stage => (
            <option key={stage} value={stage}>{stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="deal-year-filter">Filter by Year Updated:</label>
        <select id="deal-year-filter" onChange={(e) => onFilterByYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}>
          {updatedYears.map(year => (
            <option key={year} value={year}>{year === 'all' ? 'All Years' : year}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DealFilters;