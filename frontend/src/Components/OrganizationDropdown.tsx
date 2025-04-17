import React from 'react';
import './OrganizationDropdown.css';

interface OrganizationDropdownProps {
  organizations: { id: number; name: string }[];
  onOrganizationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onNewOrganizationClick: () => void;
  onDeleteOrganizationClick: () => void;
}

const OrganizationDropdown: React.FC<OrganizationDropdownProps> = ({
  organizations,
  onOrganizationChange,
  onNewOrganizationClick,
  onDeleteOrganizationClick,
}) => {
  return (
    <div className="organization-dropdown-container">
      <select onChange={onOrganizationChange} defaultValue="">
        <option value="" disabled>Select Organization</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <button onClick={onNewOrganizationClick}>+</button>
      <button onClick={onDeleteOrganizationClick}>-</button>
    </div>
  );
};

export default OrganizationDropdown;