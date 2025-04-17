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
  organizationDeals: Deal[];
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
  organizationDeals
}) => {
  return (
    <div className="dashboard-container">
      <div className="top-bar">
        <div className="top-left-organization">
          <strong>{selectedOrganizationName}</strong>
        </div>
        <div className="top-right-controls">
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
        deals={deals}
        onCreateNewDealClick={onCreateNewDealClick}
      />
      <DealStatusBoxes 
        selectedOrganizationId={selectedOrganizationId}
        deals={deals} 
        activeFilterType={activeFilterType}
        organizationAccounts={organizationAccounts}
        organizationDeals={organizationDeals}
      />
    </div>
  );
};

export default Dashboard;