import React from 'react';
import './DealFilters.css';
import { Deal } from '../Models/deal';

interface DealFiltersProps {
  selectedOrganizationId: number | null;
  onFilterByType: (type: Deal['status'] | 'all') => void;
  onFilterByYear: (year: number | 'all') => void;
  allOrganizationDeals: Deal[];
  onCreateNewDealClick: () => void;
}

const DealFilters: React.FC<DealFiltersProps> = ({ selectedOrganizationId, onFilterByType, onFilterByYear, allOrganizationDeals, onCreateNewDealClick }) => {
  /**
   * An array defining the possible stages for a deal, including an 'all' option 
   * for filtering. Each stage corresponds to a specific status a deal can have 
   * in the sales process.
   *
   * @constant dealStages
   * @type {(Deal['status'] | 'all')[]}
   * @readonly
   *
   * @remarks
   * - Includes 'all' as the first element to allow filtering for all deal 
   * statuses.
   * - The subsequent elements are the valid `Deal['status']` values, 
   * representing different stages like proposal building, pitching, negotiation, 
   * etc.
   * - The order of stages reflects a typical sales pipeline flow, with 
   * 'cancelled' and 'lost' representing terminal negative outcomes.
   */
  const dealStages: (Deal['status'] | 'all')[] = ['all', 'build_proposal', 'pitch_proposal', 'negotiation', 'awaiting_signoff', 'signed', 'cancelled', 'lost'];

  /**
   * An array containing the unique years of creation for all deals associated 
   * with the current organization, along with an 'all' option for filtering. 
   * The years are sorted in descending order, with 'all' appearing first.
   *
   * @constant availableYears
   * @type {(number | 'all')[]}
   * @readonly
   *
   * @remarks
   * - Starts with an 'all' string to allow filtering for all years.
   * - Maps over the `allOrganizationDeals` array to extract the 
   * `year_of_creation` for each deal.
   * - Uses a `Set` to ensure only unique year values are included.
   * - Sorts the resulting array:
   * - 'all' is placed at the beginning.
   * - Number years are sorted in descending order (newest to oldest).
   * - Handles potential type differences between 'all' and number years during 
   * sorting.
   */
  const availableYears = ['all', ...new Set(allOrganizationDeals.map(deal => deal.year_of_creation))].sort((a, b) => {
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
          {availableYears.map(year => (
            <option key={year} value={year}>{year === 'all' ? 'All Years' : year}</option>
          ))}
        </select>
      </div>

      <button onClick={onCreateNewDealClick} className="create-deal-button" disabled={!selectedOrganizationId || selectedOrganizationId === 0}>
        Create New Deal
      </button>
    </div>
  );
};

export default DealFilters;