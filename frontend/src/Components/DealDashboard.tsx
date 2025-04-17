import React from 'react';
import OrganizationDropdown from './OrganizationDropDown';
import './DealDashboard.css';

interface DashboardProps {
  organizations: { id: number; name: string }[];
  onOrganizationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onNewOrganizationClick: () => void;
  onDeleteOrganizationClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  organizations,
  onOrganizationChange,
  onNewOrganizationClick,
  onDeleteOrganizationClick,
}) => {
  return (
    <div className="dashboard-container">
      <div className="top-left-organization">
        <strong>Organization</strong>
      </div>
      <div className="top-right-controls">
        <OrganizationDropdown
          organizations={organizations}
          onOrganizationChange={onOrganizationChange}
          onNewOrganizationClick={onNewOrganizationClick}
          onDeleteOrganizationClick={onDeleteOrganizationClick}
        />
      </div>
    </div>
  );
};

export default Dashboard;