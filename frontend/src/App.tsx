import React, { useState, useEffect } from 'react';
import Dashboard from './Components/DealDashboard';
import axios from 'axios';

interface Organization {
  id: number;
  name: string;
}

const App: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [showNewOrgInput, setShowNewOrgInput] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get<Organization[]>(`${apiUrl}/organizations`);
      setOrganizations(response.data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleOrganizationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(event.target.value);
    setSelectedOrganizationId(selectedId);
  };

  const handleNewOrganizationClick = () => {
    setShowNewOrgInput(true);
  };

  const handleCreateNewOrganization = async () => {
    if (newOrgName.trim()) {
      try {
        await axios.post<Organization>(`${apiUrl}/organizations`, { name: newOrgName });
        fetchOrganizations();
        setShowNewOrgInput(false);
        setNewOrgName('');
      } catch (error) {
        console.error('Error creating organization:', error);
      }
    }
  };

  const handleDeleteOrganizationClick = async () => {
    // Handle Delete
  }

  return (
    <div>
      <Dashboard
        organizations={organizations}
        onOrganizationChange={handleOrganizationChange}
        onNewOrganizationClick={handleNewOrganizationClick}
        onDeleteOrganizationClick={handleDeleteOrganizationClick}
      />
      {showNewOrgInput && (
        <div>
          <input
            type="text"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="New Organization Name"
          />
          <button onClick={handleCreateNewOrganization}>Create</button>
          <button onClick={handleDeleteOrganizationClick}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default App;