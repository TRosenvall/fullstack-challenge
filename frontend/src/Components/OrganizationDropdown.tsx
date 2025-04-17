import React from 'react';
import './OrganizationDropdown.css';

interface OrganizationDropdownProps {
  organizations: { id: number; name: string }[];
  selectedOrganizationId: number | null;
  onOrganizationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onNewOrganizationClick: () => void;
  onDeleteOrganizationClick: () => void;
}

const OrganizationDropdown: React.FC<OrganizationDropdownProps> = ({
  organizations,
  selectedOrganizationId,
  onOrganizationChange,
  onNewOrganizationClick,
  onDeleteOrganizationClick,
}) => {
  return (
    <div className="organization-dropdown-container">
      <select onChange={onOrganizationChange} defaultValue={selectedOrganizationId === null ? "" : selectedOrganizationId}>
        <option value="" disabled>Select Organization</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <div className="organization-buttons">
        <button onClick={onNewOrganizationClick}>+</button>
        <button onClick={onDeleteOrganizationClick}>-</button>
      </div>
    </div>
  );
};

export default OrganizationDropdown;