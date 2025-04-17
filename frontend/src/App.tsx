import React, { useState, useEffect } from 'react';
import Dashboard from './Components/DealDashboard';
import axios from 'axios';
import './App.css';

interface Organization {
  id: number;
  name: string;
}

const App: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [showNewOrgModal, setShowNewOrgModal] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const LOCAL_STORAGE_KEY = 'lastSelectedOrganizationId';

  useEffect(() => {
    fetchOrganizations();
    // Load the last selected organization ID from localStorage on component mount
    const storedId = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedId) {
      setSelectedOrganizationId(parseInt(storedId, 10));
    }
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
    setSelectedOrganizationId(selectedId === 0 ? null : selectedId);
    // Store the selected ID in localStorage whenever it changes
    localStorage.setItem(LOCAL_STORAGE_KEY, selectedId.toString());
    // You might want to trigger a re-render of deals based on the selected organization here
  };

  const handleNewOrganizationClick = () => {
    setShowNewOrgModal(true);
  };

  const handleCloseNewOrgModal = () => {
    setShowNewOrgModal(false);
    setNewOrgName('');
  };

  const handleNewOrgNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewOrgName(event.target.value);
  };

  const handleCreateNewOrganization = async () => {
    if (newOrgName.trim()) {
      try {
        await axios.post<Organization>(`${apiUrl}/organizations`, { name: newOrgName });
        fetchOrganizations();
        setShowNewOrgModal(false);
        setNewOrgName('');
      } catch (error) {
        console.error('Error creating organization:', error);
      }
    }
  };

  // If no organization is selected, the button does nothing
  const handleDeleteOrganizationClick = () => {
    if (selectedOrganizationId !== null) {
      setShowDeleteConfirmModal(true);
    }
  };

  const handleCloseDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteConfirmed = async () => {
    if (selectedOrganizationId !== null) {
      try {
        await axios.delete(`${apiUrl}/organizations/${selectedOrganizationId}`);
        fetchOrganizations();
        setSelectedOrganizationId(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setShowDeleteConfirmModal(false);
      } catch (error) {
        console.error('Error deleting organization:', error);
      }
    }
  };

  return (
    <div className="app-container">
      <Dashboard
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        onOrganizationChange={handleOrganizationChange}
        onNewOrganizationClick={handleNewOrganizationClick}
        onDeleteOrganizationClick={handleDeleteOrganizationClick}
      />

      {showNewOrgModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Organization</h3>
            <input
              type="text"
              value={newOrgName}
              onChange={handleNewOrgNameChange}
              placeholder="Organization Name"
            />
            <div className="modal-buttons">
              <button onClick={handleCreateNewOrganization}>Create</button>
              <button onClick={handleCloseNewOrgModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this organization?</p>
            <div className="modal-buttons">
              <button onClick={handleDeleteConfirmed}>Delete</button>
              <button onClick={handleCloseDeleteConfirmModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;