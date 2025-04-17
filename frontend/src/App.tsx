import React, { useState, useEffect } from 'react';
import Dashboard from './Components/DealDashboard';
import axios from 'axios';
import './App.css';
import { Organization } from './Models/organization';
import { Account } from './Models/account';
import { Deal } from './Models/deal';

const App: React.FC = () => {
  // Values to be used through the app
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

  // Handle setup, local storage, and filtering
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

  // If I were to edit a thing, I'd remove the axios calls to a hooks file 
  // and keep them out of this base file. However as it stands, all my axios 
  // calls are within this file only.

  /**
   * Fetches a list of organizations from the API and updates the local state 
   * with a sorted array.
   *
   * @function fetchOrganizations
   * @async
   *
   * @returns {Promise<void>} A promise that resolves when the organizations 
   * have been fetched and the state has been updated.
   *
   * @throws Will log an error to the console if the API request fails.
   *
   * @remarks
   * - Makes a GET request to the endpoint `${apiUrl}/organizations`.
   * - Expects the response to be an array of `Organization` objects.
   * - The resulting list is sorted alphabetically by the organization's `name` 
   * property before being passed to `setOrganizations`.
   * 
   * @example
   * // Typical usage inside a React useEffect hook:
   * useEffect(() => {
   *   fetchOrganizations();
   * }, []);
   */
  const fetchOrganizations = async () => {
    try {
      const response = await axios.get<Organization[]>(`${apiUrl}/organizations`);
      setOrganizations(response.data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  /**
   * Fetches a list of deals from the API and updates the local state with 
   * the results.
   *
   * @function fetchDeals
   * @async
   *
   * @returns {Promise<void>} A promise that resolves when the deals have been 
   * fetched and state is updated.
   *
   * @throws Will log an error to the console if the API request fails.
   *
   * @remarks
   * - Sends a GET request to `${apiUrl}/deals`.
   * - Expects an array of `Deal` objects in the response.
   * - The response is passed directly to `setAllDeals`.
   */
  const fetchDeals = async () => {
    try {
      const response = await axios.get<Deal[]>(`${apiUrl}/deals`);
      setAllDeals(response.data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  /**
   * Handles the event when a user selects a different organization from a 
   * dropdown.
   *
   * @function handleOrganizationChange
   * @async
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event from 
   * the select input.
   *
   * @returns {Promise<void>} A promise that resolves when the organization has 
   * been updated.
   *
   * @remarks
   * - Parses the selected organization ID from the dropdown.
   * - Passes the parsed ID to `updateSelectedOrganization`.
   */
  const handleOrganizationChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(event.target.value);
    updateSelectedOrganization(selectedId)
  };

  /**
   * Updates the selected organization and persists the selection in local 
   * storage.
   *
   * @function updateSelectedOrganization
   * @async
   *
   * @param {number} selectedId - The ID of the selected organization. Use `0` 
   * to deselect.
   *
   * @returns {Promise<void>} A promise that resolves when the selection is 
   * applied and related data is refreshed.
   *
   * @remarks
   * - Updates local state with the selected organization ID and name.
   * - Stores the selection in `localStorage` under the key defined by 
   * `LOCAL_STORAGE_KEY`.
   * - Resets the dropdown temporarily to force UI re-rendering.
   * - Triggers a fetch for organization-specific accounts.
   */
  const updateSelectedOrganization = async (selectedId: number) => {
    setSelectedOrganizationId(selectedId === 0 ? null : selectedId);
    const selectedOrg = organizations.find(org => org.id === selectedId);
    setSelectedOrganizationName(selectedOrg ? selectedOrg.name : "Organization");
    localStorage.setItem(LOCAL_STORAGE_KEY, selectedId.toString()); // I persisted the selected organization so refreshing the page kept you on the organization last worked on.
    setResetDropdown(true);
    setTimeout(() => setResetDropdown(true), 0); // This was used to reset the dropdown list so it retains it's Select Organization value.
    await fetchOrganizationAccounts();
  }

  /**
   * Applies a filter to the current account view based on the selected deal 
   * status.
   *
   * @function handleFilterByType
   * @async
   *
   * @param {Deal['status'] | 'all'} type - The status type to filter by, or 
   * 'all' to show all deals.
   *
   * @returns {Promise<void>} A promise that resolves after filtering is applied 
   * and data is refreshed.
   *
   * @remarks
   * - Refreshes organization accounts by calling `fetchOrganizationAccounts`.
   * - Updates local filter state with the selected type.
   * - Resets the dropdown selection to indicate the filter state visually.
   */
  const handleFilterByType = async (type: Deal['status'] | 'all') => {
    await fetchOrganizationAccounts();
    setFilterType(type);
    setResetDropdown(false);
  };

  /**
   * Filters the organization deals by the selected year.
   *
   * @function handleFilterByYear
   * @async
   *
   * @param {number | 'all'} year - The year to filter by, or 'all' to clear 
   * the filter.
   *
   * @returns {Promise<void>} A promise that resolves once the filter is applied.
   *
   * @remarks
   * - Triggers a refresh of the organization's accounts.
   * - Updates the year filter state.
   * - Resets the dropdown to visually reflect filter status.
   */
  const handleFilterByYear = async (year: number | 'all') => {
    await fetchOrganizationAccounts();
    setFilterYear(year);
    setResetDropdown(false);
  };

  /**
   * Applies all active filters (organization, type, year) to the full list of 
   * deals.
   *
   * @function applyFilters
   * @async
   *
   * @returns {Promise<void>} A promise that resolves after all filters are 
   * applied and state is updated.
   *
   * @remarks
   * - Filters deals by account IDs associated with the selected organization.
   * - Applies additional filters for deal `status` and `year_of_creation` if set.
   * - Updates `setAllOrganizationDeals` and `setFilteredDeals` with the 
   * resulting data.
   */
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

  /**
   * Opens the modal to create a new organization.
   *
   * @function handleNewOrganizationClick
   *
   * @returns {void}
   *
   * @remarks
   * - Sets the modal visibility state to `true` to display the new organization 
   * form.
   */
  const handleNewOrganizationClick = () => {
    setShowNewOrgModal(true);
  };

  /**
   * Closes the new organization modal and resets related state.
   *
   * @function handleCloseNewOrgModal
   *
   * @returns {void}
   *
   * @remarks
   * - Hides the modal.
   * - Clears the input field for new organization name.
   * - Resets the dropdown to ensure consistent UI behavior.
   */
  const handleCloseNewOrgModal = () => {
    setShowNewOrgModal(false);
    setNewOrgName('');
    setResetDropdown(false);
  };

  /**
   * Updates the new organization name input state and refreshes accounts.
   *
   * @function handleNewOrgNameChange
   * @async
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The input change event 
   * from the text field.
   *
   * @returns {Promise<void>} A promise that resolves after the organization 
   * accounts are refreshed.
   *
   * @remarks
   * - Updates `newOrgName` with the current input value.
   * - Refreshes organization accounts, possibly to support real-time validations 
   * or associations.
   */
  const handleNewOrgNameChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewOrgName(event.target.value);
    await fetchOrganizationAccounts();
  };

  /**
   * Creates a new organization using the current input and updates the state 
   * accordingly.
   *
   * @function handleCreateNewOrganization
   * @async
   *
   * @returns {Promise<void>} A promise that resolves after the organization is 
   * created, selected, and UI is updated.
   *
   * @throws Will log an error to the console if the API request to create the 
   * organization fails.
   *
   * @remarks
   * - Sends a POST request to create a new organization.
   * - Refreshes the list of organizations and closes the modal.
   * - Selects the newly created organization and updates state accordingly.
   */
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

   /**
   * Handles the click event to initiate the organization deletion process.
   * If an organization is selected, it displays the delete confirmation modal.
   *
   * @function handleDeleteOrganizationClick
   * @returns {void}
   *
   * @remarks
   * - Checks if an organization is currently selected (`selectedOrganizationId` 
   * is not null).
   * - If an organization is selected, sets the state to show the delete 
   * confirmation modal (`setShowDeleteConfirmModal(true)`).
   * - Does nothing if no organization is currently selected.
   */
  const handleDeleteOrganizationClick = () => {
    if (selectedOrganizationId !== null) {
      setShowDeleteConfirmModal(true);
    }
  };

  /**
   * Handles the event to close the organization deletion confirmation modal.
   * It updates the state to hide the modal and resets the dropdown reset flag.
   *
   * @function handleCloseDeleteConfirmModal
   * @returns {void}
   *
   * @remarks
   * - Sets the state to hide the delete confirmation modal 
   * (`setShowDeleteConfirmModal(false)`).
   * - Resets the dropdown reset flag to false (`setResetDropdown(false)`).
   */
  const handleCloseDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
    setResetDropdown(false);
  };

  /**
   * Handles the confirmation of the organization deletion.
   * It deletes the selected organization, its associated accounts, and 
   * their deals from the database. After successful deletion, it refreshes 
   * the organization list, resets the selected organization, clears local 
   * storage, and closes the confirmation modal.
   *
   * @function handleDeleteConfirmed
   * @async
   * @returns {Promise<void>} A promise that resolves after all deletion 
   * operations and state updates are complete.
   *
   * @throws Will log an error to the console if any of the API requests 
   * (fetching accounts, deleting deals, deleting accounts, or deleting the 
   * organization) fail.
   *
   * @remarks
   * - Checks if an organization is currently selected (`selectedOrganizationId` 
   * is not null).
   * - Fetches all accounts associated with the selected organization.
   * - Identifies all deals associated with the fetched accounts.
   * - Deletes each of the identified deals.
   * - Deletes each of the fetched accounts.
   * - Deletes the selected organization.
   * - Refreshes the list of organizations (`fetchOrganizations()`).
   * - Resets the selected organization ID and name.
   * - Clears the organization ID from local storage.
   * - Hides the delete confirmation modal.
   * - Triggers a reset of the organization dropdown.
   */
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

  /**
   * Handles the click event to display the modal for creating a new deal and 
   * account.
   *
   * @function handleCreateNewDealClick
   * @returns {void}
   *
   * @remarks
   * - Sets the state to show the new deal modal (`setShowNewDealModal(true)`).
   */
  const handleCreateNewDealClick = () => {
    setShowNewDealModal(true);
  };

  /**
   * Handles the event to close the new deal and account creation modal.
   * It updates the state to hide the modal and resets the input fields and 
   * fetches organization accounts.
   *
   * @function handleCloseNewDealModal
   * @async
   * @returns {Promise<void>} A promise that resolves after the modal is closed 
   * and organization accounts are fetched.
   *
   * @remarks
   * - Sets the state to hide the new deal modal (`setShowNewDealModal(false)`).
   * - Resets the new deal creation year to 2025 (`setNewDealCreationDate(2025)`).
   * - Clears the new account name input (`setNewAccountName('')`).
   * - Resets the new deal value input to 0.00 (`setNewDealValue(0.00)`).
   * - Refreshes the list of organization accounts (`fetchOrganizationAccounts()`).
   */
  const handleCloseNewDealModal = async () => {
    setShowNewDealModal(false);
    setNewDealCreationDate(2025);
    setNewAccountName('');
    setNewDealValue(0.00);
    await fetchOrganizationAccounts()
  };

  /**
   * Handles the change event for the new deal creation year input field.
   * It updates the state with the parsed float value of the input.
   *
   * @function handleNewDealCreationDateChange
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event object.
   * @returns {void}
   *
   * @remarks
   * - Retrieves the value from the input element.
   * - If the value is an empty string, sets the state to an empty string.
   * - Otherwise, parses the value as a float and updates the 
   * `newDealCreationDate` state.
   */
  const handleNewDealCreationDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewDealCreationDate(event.target.value === '' ? '' : parseFloat(event.target.value));
  };

  /**
   * Handles the change event for the new account name input field.
   * It updates the state with the current value of the input.
   *
   * @function handleNewAccountNameChange
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event object.
   * @returns {void}
   *
   * @remarks
   * - Retrieves the value from the input element.
   * - Updates the `newAccountName` state with the input value.
   */
  const handleNewAccountNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewAccountName(event.target.value);
  };

  /**
   * Handles the submission to save a new deal and potentially a new account.
   * It validates the input fields, checks for existing accounts, creates a new 
   * account if necessary, creates the new deal, refreshes the deal list, and 
   * closes the modal.
   *
   * @function handleSaveNewDeal
   * @async
   * @returns {Promise<void>} A promise that resolves after the deal is saved, 
   * the deal list is refreshed, and the modal is closed.
   *
   * @throws Will display an alert if any of the following occur:
   * - Not all required fields (creation year, account name, deal value) are 
   * filled.
   * - Unable to retrieve existing accounts.
   * - Unable to create a new account.
   * - Unable to pull the created account details.
   * - Unable to create the new deal.
   *
   * @remarks
   * - Checks if the new deal creation year, account name, and deal value are 
   * filled.
   * - Fetches a list of existing account names.
   * - If the entered account name does not exist, it creates a new account 
   * associated with the selected organization.
   * - Retrieves the details of the (potentially newly created) account.
   * - Creates a new deal associated with the retrieved account, the entered 
   * value, status, and creation year.
   * - Refreshes the list of deals (`fetchDeals()`).
   * - Closes the new deal modal (`handleCloseNewDealModal()`).
   */
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

  /**
   * Fetches the list of accounts associated with the currently selected 
   * organization and updates the state.
   *
   * @function fetchOrganizationAccounts
   * @async
   * @returns {Promise<void>} A promise that resolves after the organization 
   * accounts are fetched and the state is updated.
   *
   * @throws Will display an alert if the API request to fetch organization 
   * accounts fails.
   *
   * @remarks
   * - Sends a GET request to retrieve accounts filtered by the 
   * `selectedOrganizationId`.
   * - Updates the `organizationAccounts` state with the fetched data.
   */
  const fetchOrganizationAccounts = async () => {
    try {
      let organizationAccounts = (await axios.get<Account[]>(`${apiUrl}/accounts`)).data.filter(account => account.organization_id === selectedOrganizationId)
      setOrganizationAccounts(organizationAccounts)
    } catch(error) {
      alert(error)
    }
  }

  /**
   * Handles the update of a deal's status.
   * It sends a PUT request to the API to change the deal's status and then 
   * refreshes the deal list.
   *
   * @function handleUpdateDealStatus
   * @async
   * @param {number} dealId - The ID of the deal to update.
   * @param {Deal['status']} newStatus - The new status to set for the deal.
   * @returns {Promise<void>} A promise that resolves after the deal status is 
   * updated and the deal list is refreshed.
   *
   * @throws Will log an error to the console and display an alert if the API 
   * request to update the deal status fails.
   *
   * @remarks
   * - Sends a PUT request to the specified API endpoint to update the status of 
   * the deal with the given `dealId`.
   * - Refreshes the list of deals (`fetchDeals()`) to reflect the updated status 
   * in the UI.
   */
  const handleUpdateDealStatus = async (dealId: number, newStatus: Deal['status']) => {
    try {
      await axios.put(`${apiUrl}/deals/${dealId}`, { status: newStatus });
      fetchDeals()
    } catch (error) {
      console.error('Error updating deal status:', error);
      alert(error);
    }
  };

  /**
   * Formats a number as a currency string according to the specified locale and 
   * currency.
   *
   * @function formatAsCurrency
   * @param {number} amount - The number to format.
   * @param {string} [locale='en-US'] - The locale to use for formatting 
   * (e.g., 'en-US', 'de-DE'). Defaults to 'en-US'.
   * @param {string} [currency='USD'] - The currency code to use 
   * (e.g., 'USD', 'EUR', 'GBP'). Defaults to 'USD'.
   * @returns {string} The formatted currency string.
   *
   * @remarks
   * - Uses the `Intl.NumberFormat` object to perform the currency formatting.
   */
  const formatAsCurrency = (amount: number, locale: string = 'en-US', currency: string = 'USD'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  /**
   * Handles the blur event for the new deal value input field.
   * If the input has a valid number, it formats it as currency and updates the 
   * input display.
   * If the input is a string, it keeps the string value.
   * If the input is not a valid number, it clears the input display.
   *
   * @function handleNewDealValueBlur
   * @returns {void}
   *
   * @remarks
   * - Checks the type of `newDealValue`.
   * - If it's a number, formats it as currency using `formatAsCurrency` and 
   * updates the `dealInput` state.
   * - If it's a string, keeps the existing `dealInput` value.
   * - If it's neither a number nor a string (or `null`), clears the `dealInput` 
   * state.
   */
  const handleNewDealValueBlur = () => {
    if (newDealValue !== null && typeof newDealValue === 'number') {
      setDealInput(formatAsCurrency(newDealValue));
    } else if (newDealValue !== null && typeof newDealValue === 'string') {
      setDealInput(newDealValue)
    } else {
      setDealInput('');
    }
  };

  /**
   * Handles the change event for the new deal value input field.
   * It filters the input to allow only digits and a single decimal point, updates 
   * the `dealInput` state,
   * and attempts to parse the input as a float to update the `newDealValue` state.
   *
   * @function handleNewDealValueChange
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event object.
   * @returns {void}
   *
   * @remarks
   * - Retrieves the input value and removes any characters that are not digits 
   * or a decimal point.
   * - Updates the `dealInput` state with the filtered input value.
   * - Attempts to parse the filtered input as a float.
   * - If parsing is successful, updates the `newDealValue` state with the parsed 
   * number.
   * - If parsing fails (results in `NaN`), sets the `newDealValue` state to `null`.
   */
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