import React from 'react';
import { Deal } from '../Models/deal';
import './DealStatusBoxes.css';
import { Account } from '../Models/account';

interface DealStatusBoxesProps {
  selectedOrganizationId: number | null;
  deals: Deal[];
  activeFilterType: Deal['status'] | 'all';
  organizationAccounts: Account[]
  handleUpdateDealStatus(id: number, stage: Deal['status']): void
  formatAsCurrency(amount: number, locale: string, currency: string): string
}

const DealStatusBoxes: React.FC<DealStatusBoxesProps> = ({ 
  selectedOrganizationId, 
  deals, 
  activeFilterType, 
  organizationAccounts,
  handleUpdateDealStatus,
  formatAsCurrency
}) => {
  /**
   * An array defining the ordered stages for a deal in the sales process.
   * Each element represents a valid `Deal['status']` value.
   *
   * @constant dealStages
   * @type {Deal['status'][]}
   * @readonly
   *
   * @remarks
   * - Defines the sequence of steps a deal typically progresses through.
   * - Used for determining the previous and next possible statuses for a deal.
   */
  const dealStages: Deal['status'][] = [
    'build_proposal',
    'pitch_proposal',
    'negotiation',
    'awaiting_signoff',
    'signed',
    'cancelled',
    'lost',
  ];

  /**
   * An object that groups deals by their current status.
   * The keys of the object are `Deal['status']` values, and the values are 
   * arrays of `Deal` objects with that status.
   *
   * @constant dealsByStage
   * @type {Record<Deal['status'], Deal[]>}
   * @readonly
   *
   * @remarks
   * - Created using the `reduce` method on the `dealStages` array.
   * - For each stage, it filters the `deals` array to include only deals with 
   * that specific status.
   * - Provides an efficient way to access deals belonging to a particular stage.
   */
  const dealsByStage = dealStages.reduce((acc, stage) => {
    acc[stage] = deals.filter(deal => deal.status === stage);
    return acc;
  }, {} as Record<Deal['status'], Deal[]>);

  /**
   * Determines the previous stage in the `dealStages` array for a given current 
   * deal status.
   *
   * @function getPreviousStage
   * @param {Deal['status']} currentStage - The current status of the deal.
   * @returns {Deal['status'] | undefined} The status of the previous stage, or 
   * `undefined` if the current stage is the first one.
   *
   * @remarks
   * - Finds the index of the `currentStage` within the `dealStages` array.
   * - If the index is greater than 0, it returns the status at the preceding 
   * index.
   * - If the current stage is the first in the array, there is no previous 
   * stage, so it returns `undefined`.
   */
  const getPreviousStage = (currentStage: Deal['status']): Deal['status'] | undefined => {
    const currentIndex = dealStages.indexOf(currentStage);
    return currentIndex > 0 ? dealStages[currentIndex - 1] : undefined;
  };

  /**
   * Determines the next stage in the `dealStages` array for a given current 
   * deal status.
   *
   * @function getNextStage
   * @param {Deal['status']} currentStage - The current status of the deal.
   * @returns {Deal['status'] | undefined} The status of the next stage, or 
   * `undefined` if the current stage is the last one.
   *
   * @remarks
   * - Finds the index of the `currentStage` within the `dealStages` array.
   * - If the index is less than the last index of the array, it returns the 
   * status at the succeeding index.
   * - If the current stage is the last in the array, there is no next stage, so 
   * it returns `undefined`.
   */
  const getNextStage = (currentStage: Deal['status']): Deal['status'] | undefined => {
    const currentIndex = dealStages.indexOf(currentStage);
    return currentIndex < dealStages.length - 1 ? dealStages[currentIndex + 1] : undefined;
  };

  /**
   * Renders a list of deals for a specific deal stage. Each deal item includes 
   * buttons to move it to the previous or next stage.
   *
   * @function renderDeals
   * @param {Deal['status']} stage - The current deal stage for which to render 
   * deals.
   * @param {boolean} isFiltered - A boolean indicating if the deal list is 
   * currently filtered (used for conditional rendering of account name).
   * @returns {JSX.Element} An unordered list (`<ul>`) containing the deals for 
   * the given stage.
   *
   * @remarks
   * - Retrieves the deals for the specified `stage` from the `dealsByStage` 
   * object.
   * - Maps over the filtered deals to render each as a list item (`<li>`).
   * - For each deal, it fetches the associated account name.
   * - Renders a left arrow button to move the deal to the previous stage 
   * (disabled if it's the first stage).
   * - Displays the account name (truncated if longer than 11 characters and not 
   * filtered) and the deal value formatted as currency.
   * - Renders a right arrow button to move the deal to the next stage (disabled 
   * if it's the last stage).
   * - Calls `handleUpdateDealStatus` when an arrow button is clicked.
   */
  const renderDeals = (stage: Deal['status'], isFiltered: boolean) => {
    const filteredDeals = dealsByStage[stage] || [];

    return (
      <ul className="deal-list">
        {filteredDeals.map((deal) => {
          const account = organizationAccounts.find((acc) => acc.id === deal.account_id);
          const previousStage = getPreviousStage(deal.status);
          const nextStage = getNextStage(deal.status);

          return (
            <li key={deal.id} className="deal-row">
              <button
                className="arrow-button left-arrow"
                onClick={() => previousStage && handleUpdateDealStatus(deal.id, previousStage)}
                disabled={!previousStage}
              >
                &lt;
              </button>
              <div className="deal-info">
                <span className="deal-account">{ 
                  (account?.name === null || account?.name === undefined) ? "Unknown" : 
                  (account.name.length < 12 || isFiltered) ? account?.name : account?.name.substring(0, 11) + "..."
                }</span>
                <span className="deal-value">{formatAsCurrency(deal.value, 'en-US', 'USD')}</span>
              </div>
              <button
                className="arrow-button right-arrow"
                onClick={() => nextStage && handleUpdateDealStatus(deal.id, nextStage)}
                disabled={!nextStage}
              >
                &gt;
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  /**
   * Calculates the total value of all deals within a specific deal stage.
   *
   * @function calculateStageTotal
   * @param {Deal['status']} stage - The deal stage for which to calculate the 
   * total value.
   * @returns {number} The sum of the `value` property of all deals in the given 
   * stage.
   *
   * @remarks
   * - Retrieves the deals for the specified `stage` from the `dealsByStage` 
   * object.
   * - Uses the `reduce` method to sum the `value` of all deals in that stage.
   * - Returns 0 if there are no deals in the specified stage.
   */
  const calculateStageTotal = (stage: Deal['status']): number => {
    return dealsByStage[stage].reduce((sum, deal) => sum + deal.value, 0);
  };

  return (
    <div className="deal-status-boxes-container">
      {activeFilterType === 'all' ? (
        dealStages.map(stage => (
          <div key={stage} className={`deal-status-box ${stage}`}>
            <h3>{stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
            <div className="stage-summary">
              <span className="deal-count">
                {selectedOrganizationId != null && selectedOrganizationId !== 0 ? dealsByStage[stage].length : 0} 
                {(selectedOrganizationId != null && selectedOrganizationId !== 0) && dealsByStage[stage].length === 1 ? " Deal" : " Deals"}
              </span>
              <span className="stage-total">
                Total: {formatAsCurrency(calculateStageTotal(stage), 'en-US', 'USD')}
              </span>
            </div>
            <hr />
            {renderDeals(stage, false)}
          </div>
        ))
      ) : (
        dealStages
          .filter(stage => stage === activeFilterType)
          .map(stage => (
            <div key={stage} className={`deal-status-box filtered-stage ${stage}`}>
              <h3>{stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
              <div className="stage-summary">
                <span className="deal-count">
                  {selectedOrganizationId != null && selectedOrganizationId !== 0 ? dealsByStage[stage].length : 0} Deals
                </span>
                <span className="stage-total">
                  Total: ${calculateStageTotal(stage).toFixed(2)}
                </span>
              </div>
              <hr />
              {renderDeals(stage, true)}
            </div>
          ))
      )}
    </div>
  );
};

export default DealStatusBoxes;
