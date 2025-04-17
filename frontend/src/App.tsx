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
  const [newDealValue, setNewDealValue] = useState<number | '' | null>(0);
  const [newDealStatus, setNewDealStatus] = useState<Deal['status']>('build_proposal');
  const [selectedOrganizationAccounts, setOrganizationAccounts] = useState<Account[]>([]);
  const [allOrganizationDeals, setAllOrganizationDeals] = useState<Deal[]>([]);
  const [dealInput, setDealInput] = useState<string>('');
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
    fetchOrganizationAccounts()
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

  const handleOrganizationChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(event.target.value);
    updateSelectedOrganization(selectedId)
  };

  const updateSelectedOrganization = async (selectedId: number) => {
    setSelectedOrganizationId(selectedId === 0 ? null : selectedId);
    const selectedOrg = organizations.find(org => org.id === selectedId);
    setSelectedOrganizationName(selectedOrg ? selectedOrg.name : "Organization");
    localStorage.setItem(LOCAL_STORAGE_KEY, selectedId.toString());
    setResetDropdown(true);
    setTimeout(() => setResetDropdown(true), 0);
    await fetchOrganizationAccounts();
  }

  const handleFilterByType = async (type: Deal['status'] | 'all') => {
    await fetchOrganizationAccounts();
    setFilterType(type);
    setResetDropdown(false);
  };

  const handleFilterByYear = async (year: number | 'all') => {
    await fetchOrganizationAccounts();
    setFilterYear(year);
    setResetDropdown(false);
  };

  const applyFilters = async () => {
    let filtered = [...allDeals];

    const accountIds = selectedOrganizationAccounts.map(account => account.id);
    filtered = filtered.filter(deal => accountIds.includes(deal.account_id));
    setAllOrganizationDeals(filtered);

    if (filterType !== 'all') {
      filtered = filtered.filter(deal => deal.status === filterType);
    }
    if (filterYear !== 'all') {
      filtered = filtered.filter(deal => deal.year_of_creation === filterYear);
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

  const handleNewOrgNameChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewOrgName(event.target.value);
    await fetchOrganizationAccounts();
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
        
        const newOrg = (await axios.get<Organization[]>(`${apiUrl}/organizations`)).data.find(organization => organization.name == newOrgName)
        if (newOrg) {
          await updateSelectedOrganization(newOrg.id)
        }
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
        let organizationAccountIds = (await axios.get<Account[]>(`${apiUrl}/accounts`)).data
          .filter(account => account.organization_id === selectedOrganizationId)
          .map(account => account.id)
        var dealIds: number[] = [];
        var deals = [...allDeals];
        for (var i = 0; i < deals.length; i++) {
          if (organizationAccountIds.includes(deals[i].account_id)) {
            dealIds.push(deals[i].id)
          }
        }

        for (var i = 0; i < dealIds.length; i++) {
          await axios.delete(`${apiUrl}/deals/${dealIds[i]}`);
        }

        for (var i = 0; i < organizationAccountIds.length; i++) {
          await axios.delete(`${apiUrl}/accounts/${organizationAccountIds[i]}`);
        }

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

  const handleCloseNewDealModal = async () => {
    setShowNewDealModal(false);
    setNewDealCreationDate(2025);
    setNewAccountName('');
    setNewDealValue(0.00);
    await fetchOrganizationAccounts()
  };

  const handleNewDealCreationDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewDealCreationDate(event.target.value === '' ? '' : parseFloat(event.target.value));
  };

  const handleNewAccountNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewAccountName(event.target.value);
  };

  const handleSaveNewDeal = async () => {
    if (!newDealCreationDate || !newAccountName || newDealValue === null || isNaN(newDealValue as number)) {
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

    fetchDeals();
    handleCloseNewDealModal();
  };

  const fetchOrganizationAccounts = async () => {
    try {
      let organizationAccounts = (await axios.get<Account[]>(`${apiUrl}/accounts`)).data.filter(account => account.organization_id === selectedOrganizationId)
      setOrganizationAccounts(organizationAccounts)
    } catch(error) {
      alert(error)
    }
  }

  const handleUpdateDealStatus = async (dealId: number, newStatus: Deal['status']) => {
    try {
      await axios.put(`${apiUrl}/deals/${dealId}`, { status: newStatus });
      fetchDeals()
    } catch (error) {
      console.error('Error updating deal status:', error);
      alert(error);
    }
  };

  const formatAsCurrency = (amount: number, locale: string = 'en-US', currency: string = 'USD'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleNewDealValueBlur = () => {
    if (newDealValue !== null && typeof newDealValue === 'number') {
      setDealInput(formatAsCurrency(newDealValue));
    } else if (newDealValue !== null && typeof newDealValue === 'string') {
      setDealInput(newDealValue)
    } else {
      setDealInput('');
    }
  };

  const handleNewDealValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9.]/g, ''); // allow digits and decimal
    setDealInput(input);
  
    const parsed = parseFloat(input);
    if (!isNaN(parsed)) {
      setNewDealValue(parsed);
    } else {
      setNewDealValue(null);
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
        deals={filteredDeals}
        onFilterByType={handleFilterByType}
        onFilterByYear={handleFilterByYear}
        resetDropdown={resetDropdown}
        onCreateNewDealClick={handleCreateNewDealClick}
        activeFilterType={filterType}
        organizationAccounts={selectedOrganizationAccounts}
        allOrganizationDeals={allOrganizationDeals}
        handleUpdateDealStatus={handleUpdateDealStatus}
        formatAsCurrency={formatAsCurrency}
      />

      {showNewDealModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="new-deal-modal">
              <h3>Create New Deal & Account</h3>
              <label htmlFor="account-name">Account Name:</label>
              <input type="text" id="account-name" value={newAccountName} onChange={handleNewAccountNameChange} required />

              <label htmlFor="deal-status">Deal Status:</label>
              <select className="input-field" id="deal-status" value={newDealStatus} onChange={(e) => setNewDealStatus(e.target.value as Deal['status'])}>
                {DEAL_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>

              <div className="deal-creation-value-selector">
                <label htmlFor="deal-value">Deal Value:</label>
                <input
                  className="input-field"
                  type="text"
                  id="deal-value"
                  value={dealInput}
                  onChange={handleNewDealValueChange}
                  onBlur={handleNewDealValueBlur} // format when they leave the field
                  required
                />
              </div>

              <div className="deal-creation-date-selector">
                <label htmlFor="deal-creation-date">Deal Year:</label>
                <input className="input-field" type="number" id="deal-creation-date" value={newDealCreationDate} onChange={handleNewDealCreationDateChange} required />
              </div>

              <div className="modal-buttons">
                <button onClick={handleSaveNewDeal}>Save Deal</button>
                <button onClick={handleCloseNewDealModal}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewOrgModal && (
        <div className="new-organization-modal-overlay">
          <div className="new-organization-modal-content">
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
        <div className="new-organization-modal-overlay">
          <div className="new-organization-modal-content">
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