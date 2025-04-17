import React from 'react';
import OrganizationDropdown from './OrganizationDropDown';
import './DealDashboard.css';
import DealStatusBoxes from './DealStatusBoxes';
import DealFilters from './DealFilters';
import { Deal } from '../Models/deal';

interface DashboardProps {
  organizations: { id: number; name: string }[];
  selectedOrganizationId: number | null;
  selectedOrganizationName: string;
  onOrganizationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onNewOrganizationClick: () => void;
  onDeleteOrganizationClick: () => void;
  deals: Deal[];
  onFilterByType: (type: Deal['status'] | 'all') => void;
  onFilterByYear: (year: number | 'all') => void;
  resetDropdown: boolean;
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
      <DealFilters onFilterByType={onFilterByType} onFilterByYear={onFilterByYear} deals={deals} />
      <DealStatusBoxes deals={deals} />
    </div>
  );
};

export default Dashboard;