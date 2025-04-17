import React, { useState, useEffect } from 'react';
import Dashboard from './Components/DealDashboard';
import axios from 'axios';
import './App.css';
import { Organization } from './Models/organization';
import { Account } from './Models/account';
import { Deal } from './Models/deal';

const App: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null); // Still tracks the actual selection
  const [selectedOrganizationName, setSelectedOrganizationName] = useState<string>("Organization");
  const [showNewOrgModal, setShowNewOrgModal] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [filterType, setFilterType] = useState<Deal['status'] | 'all'>('all');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [resetDropdown, setResetDropdown] = useState<boolean>(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const LOCAL_STORAGE_KEY = 'lastSelectedOrganizationId';
  const [showNewDealModal, setShowNewDealModal] = useState<boolean>(false);
  const [newDealCreationDate, setNewDealCreationDate] = useState<number | ''>(2025);
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newDealValue, setNewDealValue] = useState<number | ''>(0);
  const [newDealStatus, setNewDealStatus] = useState<Deal['status']>('build_proposal');
  const [selectedOrganizationAccounts, setOrganizationAccounts] = useState<Account[]>([]);
  const DEAL_STATUS_OPTIONS: Deal['status'][] = [
    'build_proposal',
    'pitch_proposal',
    'negotiation',
    'awaiting_signoff',
    'signed',
    'cancelled',
    'lost',
  ];

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

  useEffect(() => {
    applyFilters();
  }, [allDeals, filterType, filterYear]);

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
      setAllDeals(response.data);
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
    setResetDropdown(true);
    setTimeout(() => setResetDropdown(true), 0);
    // TODO: - Rerender Deals
  };

  const handleFilterByType = (type: Deal['status'] | 'all') => {
    setFilterType(type);
    setResetDropdown(false);
  };

  const handleFilterByYear = (year: number | 'all') => {
    setFilterYear(year);
    setResetDropdown(false);
  };

  const applyFilters = async () => {
    let filtered = [...allDeals];

    await fetchOrganizationAccounts()
    const accountIds = new Set(selectedOrganizationAccounts.map(account => account.id));
    filtered = filtered.filter(deal => accountIds.has(deal.account_id));

    if (filterType !== 'all') {
      filtered = filtered.filter(deal => deal.status === filterType);
    }
    if (filterYear !== 'all') {
      filtered = filtered.filter(deal => new Date(deal.updated_at).getFullYear() === filterYear);
    }
    setFilteredDeals(filtered);
  };

  const handleNewOrganizationClick = () => {
    setShowNewOrgModal(true);
  };

  const handleCloseNewOrgModal = () => {
    setShowNewOrgModal(false);
    setNewOrgName('');
    setResetDropdown(false);
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
        setResetDropdown(true);
        setTimeout(() => setResetDropdown(false), 0);
        // Optionally, you might want to select the new organization
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
    setResetDropdown(false);
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
        setResetDropdown(true);
        setTimeout(() => setResetDropdown(false), 0);
      } catch (error) {
        console.error('Error deleting organization:', error);
      }
    }
  };

  const handleCreateNewDealClick = () => {
    setShowNewDealModal(true);
  };

  const handleCloseNewDealModal = () => {
    setShowNewDealModal(false);
    setNewDealCreationDate(2025);
    setNewAccountName('');
    setNewDealValue(0);
  };

  const handleNewDealCreationDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewDealCreationDate(event.target.value === '' ? '' : parseFloat(event.target.value));
  };

  const handleNewAccountNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewAccountName(event.target.value);
  };

  const handleNewDealValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewDealValue(event.target.value === '' ? '' : parseFloat(event.target.value));
  };

  const handleSaveNewDeal = async () => {
    if (!newDealCreationDate || !newAccountName || !(typeof newDealValue === 'number')) {
      alert("Please fill in all the details")
    }
    var accountNames: String[] = []
    try {
      accountNames = (await axios.get<Account[]>(`${apiUrl}/accounts`)).data.map(account => account.name);
    } catch(error) {
      alert("Unable to retrieve accounts");
      alert(error);
      return
    }

    if (!accountNames.includes(newAccountName)) {
      try {
      await axios.post<Account>(`${apiUrl}/accounts`, { name: newAccountName, organization_id: selectedOrganizationId });
      } catch(error) {
        alert("Unable to create new account")
        alert(error);
        return
      }
    }

    var account: Account
    try {
      account = (await axios.get<Account[]>(`${apiUrl}/accounts`)).data.filter( account => account.name === newAccountName )[0];
    } catch(error) {
      alert("Unable to pull account")
      alert(error)
      return
    }

    try {
      await axios.post<Deal>(`${apiUrl}/deals`, { account_id: account.id, value: newDealValue, status: newDealStatus, year_of_creation: newDealCreationDate });
    } catch(error) {
      alert("Unable to create new deal")
      alert(error)
      return
    }

    // Handle successful creation (e.g., refresh deals list, show success message)
    fetchDeals();
    handleCloseNewDealModal();
  };

  const fetchOrganizationAccounts = async () => {
    try {
      let organizationAccounts = (await axios.get<Account[]>(`${apiUrl}/accounts`)).data.filter(account => account.id === selectedOrganizationId)
      setOrganizationAccounts(organizationAccounts)
    } catch(error) {
      alert(error)
    }
  }

  return (
    <div className="app-container">
      <Dashboard
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        selectedOrganizationName={selectedOrganizationName}
        onOrganizationChange={handleOrganizationChange}
        onNewOrganizationClick={handleNewOrganizationClick}
        onDeleteOrganizationClick={handleDeleteOrganizationClick}
        deals={filteredDeals}
        onFilterByType={handleFilterByType}
        onFilterByYear={handleFilterByYear}
        resetDropdown={resetDropdown}
        onCreateNewDealClick={handleCreateNewDealClick}
        activeFilterType={filterType}
        organizationAccounts={selectedOrganizationAccounts}
      />

      {showNewDealModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Deal & Account</h3>
            <label htmlFor="account-name">Account Name:</label>
            <input type="text" id="account-name" value={newAccountName} onChange={handleNewAccountNameChange} required />

            <label htmlFor="deal-status">Deal Status:</label>
            <select id="deal-status" value={newDealStatus} onChange={(e) => setNewDealStatus(e.target.value as Deal['status'])}>
              {DEAL_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>

            <div className="deal-creation-value-selector">
              <label htmlFor="deal-value">Deal Value:</label>
              <input type="number" id="deal-value" value={newDealValue} onChange={handleNewDealValueChange} required />
            </div>

            <div className="deal-creation-date-selector">
              <label htmlFor="deal-creation-date">Deal Creation Year:</label>
              <input type="number" id="deal-creation-date" value={newDealCreationDate} onChange={handleNewDealCreationDateChange} required />
            </div>

            <div className="modal-buttons">
              <button onClick={handleSaveNewDeal}>Save Deal</button>
              <button onClick={handleCloseNewDealModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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