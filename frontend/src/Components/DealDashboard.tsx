import React from 'react';
import OrganizationDropdown from './OrganizationDropDown';
import DealStatusBoxes from './DealStatusBoxes';
import { Deal } from '../Models/deal';
import './DealDashboard.css';

interface DashboardProps {
  organizations: { id: number; name: string }[];
  selectedOrganizationId: number | null;
  selectedOrganizationName: string; // Add this prop
  onOrganizationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onNewOrganizationClick: () => void;
  onDeleteOrganizationClick: () => void;
  deals: Deal[];
}

const Dashboard: React.FC<DashboardProps> = ({
  organizations,
  selectedOrganizationId,
  selectedOrganizationName, // Use this prop
  onOrganizationChange,
  onNewOrganizationClick,
  onDeleteOrganizationClick,
  deals,
}) => {
  return (
    <div className="dashboard-container">
      <div className="top-bar">
        <div className="top-left-organization">
          <strong>{selectedOrganizationName}</strong> {/* Display selected name */}
        </div>
        <div className="top-right-controls">
          <OrganizationDropdown
            organizations={organizations}
            selectedOrganizationId={selectedOrganizationId}
            onOrganizationChange={onOrganizationChange}
            onNewOrganizationClick={onNewOrganizationClick}
            onDeleteOrganizationClick={onDeleteOrganizationClick}
          />
        </div>
      </div>
      <hr />
      <DealStatusBoxes deals={deals} />
    </div>
  );
};

export default Dashboard;