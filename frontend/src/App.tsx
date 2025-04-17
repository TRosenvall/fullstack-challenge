import React, { useState, useEffect } from 'react';
import Dashboard from './Components/DealDashboard';
import axios from 'axios';
import './App.css';
import { Organization } from './Models/organization';
import { Deal } from './Models/deal';

const App: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [selectedOrganizationName, setSelectedOrganizationName] = useState<string>("Organization");
  const [showNewOrgModal, setShowNewOrgModal] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const LOCAL_STORAGE_KEY = 'lastSelectedOrganizationId';

  useEffect(() => {
    fetchOrganizations();
    fetchDeals();
    const storedId = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedId) {
      const parsedId = parseInt(storedId, 10);
      setSelectedOrganizationId(parsedId);
      const initialOrg = organizations.find(org => org.id === parsedId);
      setSelectedOrganizationName(initialOrg ? initialOrg.name : "Organization");
    }
  }, [organizations]);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get<Organization[]>(`${apiUrl}/organizations`);
      setOrganizations(response.data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await axios.get<Deal[]>(`${apiUrl}/deals`);
      setDeals(response.data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const handleOrganizationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(event.target.value);
    setSelectedOrganizationId(selectedId === 0 ? null : selectedId);
    const selectedOrg = organizations.find(org => org.id === selectedId);
    setSelectedOrganizationName(selectedOrg ? selectedOrg.name : "Organization");
    localStorage.setItem(LOCAL_STORAGE_KEY, selectedId.toString());
    // TODO: - Filtering
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
        await fetchOrganizations();
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
        await fetchOrganizations();
        setSelectedOrganizationId(null);
        setSelectedOrganizationName("Organization");
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
        selectedOrganizationName={selectedOrganizationName}
        onOrganizationChange={handleOrganizationChange}
        onNewOrganizationClick={handleNewOrganizationClick}
        onDeleteOrganizationClick={handleDeleteOrganizationClick}
        deals={deals}
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