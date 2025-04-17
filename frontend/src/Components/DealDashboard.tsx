import React from 'react';
import OrganizationDropdown from './OrganizationDropDown';
import './DealDashboard.css';

interface DashboardProps {
  organizations: { id: number; name: string }[];
  selectedOrganizationId: number | null;
  onOrganizationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onNewOrganizationClick: () => void;
  onDeleteOrganizationClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  organizations,
  selectedOrganizationId,
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
          selectedOrganizationId={selectedOrganizationId}
          onOrganizationChange={onOrganizationChange}
          onNewOrganizationClick={onNewOrganizationClick}
          onDeleteOrganizationClick={onDeleteOrganizationClick}
        />
      </div>
      {/* Other content of your dashboard */}
    </div>
  );
};

export default Dashboard;