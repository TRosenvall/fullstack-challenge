import React, { ChangeEvent } from 'react';
import OrganizationDropdown from './OrganizationDropdown';
import './DealDashboard.css';
import DealStatusBoxes from './DealStatusBoxes';
import DealFilters from './DealFilters';
import { Deal } from '../Models/deal';
import { Account } from '../Models/account';

interface DashboardProps {
  organizations: { id: number; name: string }[];
  selectedOrganizationId: number | null;
  selectedOrganizationName: string;
  onOrganizationChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onNewOrganizationClick: () => void;
  onDeleteOrganizationClick: () => void;
  deals: Deal[];
  onFilterByType: (type: Deal['status'] | 'all') => void;
  onFilterByYear: (year: number | 'all') => void;
  resetDropdown: boolean;
  onCreateNewDealClick: () => void;
  activeFilterType: Deal['status'] | 'all';
  organizationAccounts: Account[];
  allOrganizationDeals: Deal[];
  handleUpdateDealStatus: (id: number, stage: Deal['status']) => void
  formatAsCurrency: (amount: number, locale: string, currency: string) => string
}

const Dashboard: React.FC<DashboardProps> = ({
  organizations,
  selectedOrganizationId,
  selectedOrganizationName,
  onOrganizationChange,
  onNewOrganizationClick,
  onDeleteOrganizationClick,
  deals,
  onFilterByType,
  onFilterByYear,
  resetDropdown,
  onCreateNewDealClick,
  activeFilterType,
  organizationAccounts,
  allOrganizationDeals,
  handleUpdateDealStatus,
  formatAsCurrency,
}) => {
  // Calculate sums based on deal status
  const potentialSum = allOrganizationDeals
    .filter(deal => ['build_proposal', 'pitch_proposal', 'negotiation', 'awaiting_signoff'].includes(deal.status))
    .reduce((sum, deal) => sum + deal.value, 0);

  const actualSum = allOrganizationDeals
    .filter(deal => deal.status === 'signed')
    .reduce((sum, deal) => sum + deal.value, 0);

  const unavailableSum = allOrganizationDeals
    .filter(deal => ['cancelled', 'lost'].includes(deal.status))
    .reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="dashboard-container">
      <div className="top-bar">
        <div className="top-left-organization">
          <strong>{selectedOrganizationName}</strong>
        </div>
        <div className="top-right-controls">
          <div className="deal-summary-box">
            <div>Potential: {formatAsCurrency(potentialSum, 'en-US', 'USD')}</div>
            <div>Actual: {formatAsCurrency(actualSum, 'en-US', 'USD')}</div>
            <div>Lost/Cancelled: {formatAsCurrency(unavailableSum, 'en-US', 'USD')}</div>
          </div>
          <OrganizationDropdown
            organizations={organizations}
            selectedOrganizationId={selectedOrganizationId}
            onOrganizationChange={onOrganizationChange}
            onNewOrganizationClick={onNewOrganizationClick}
            onDeleteOrganizationClick={onDeleteOrganizationClick}
            resetDropdown={resetDropdown}
          />
        </div>
      </div>
      <hr />
      <DealFilters
        selectedOrganizationId={selectedOrganizationId}
        onFilterByType={onFilterByType}
        onFilterByYear={onFilterByYear}
        allOrganizationDeals={allOrganizationDeals}
        onCreateNewDealClick={onCreateNewDealClick}
      />
      <DealStatusBoxes 
        selectedOrganizationId={selectedOrganizationId}
        deals={deals} 
        activeFilterType={activeFilterType}
        organizationAccounts={organizationAccounts}
        handleUpdateDealStatus={handleUpdateDealStatus}
        formatAsCurrency={formatAsCurrency}
      />
    </div>
  );
};

export default Dashboard;