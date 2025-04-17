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
  const dealStages: Deal['status'][] = [
    'build_proposal',
    'pitch_proposal',
    'negotiation',
    'awaiting_signoff',
    'signed',
    'cancelled',
    'lost',
  ];

  const dealsByStage = dealStages.reduce((acc, stage) => {
    acc[stage] = deals.filter(deal => deal.status === stage);
    return acc;
  }, {} as Record<Deal['status'], Deal[]>);

  const getPreviousStage = (currentStage: Deal['status']): Deal['status'] | undefined => {
    const currentIndex = dealStages.indexOf(currentStage);
    return currentIndex > 0 ? dealStages[currentIndex - 1] : undefined;
  };

  const getNextStage = (currentStage: Deal['status']): Deal['status'] | undefined => {
    const currentIndex = dealStages.indexOf(currentStage);
    return currentIndex < dealStages.length - 1 ? dealStages[currentIndex + 1] : undefined;
  };

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
                  (account.name.length < 12 || isFiltered) ? account?.name : account?.name.substring(0, 6) + "..."
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
