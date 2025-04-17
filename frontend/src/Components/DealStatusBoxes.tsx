import React from 'react';
import { Deal } from '../Models/deal';
import './DealStatusBoxes.css';
import { Account } from '../Models/account';

interface DealStatusBoxesProps {
  selectedOrganizationId: number | null;
  deals: Deal[];
  activeFilterType: Deal['status'] | 'all';
  organizationAccounts: Account[]
}

const DealStatusBoxes: React.FC<DealStatusBoxesProps> = ({ selectedOrganizationId, deals, activeFilterType, organizationAccounts }) => {
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

  const renderDeals = (stage: typeof dealStages[number]) => {
    const filteredDeals = deals.filter(deal => deal.status === stage);
  
    return (
      <ul className="deal-list">
        {filteredDeals.map((deal) => {
          const account = organizationAccounts.find((acc) => acc.id === deal.account_id);
          return (
            <li key={deal.id} className="deal-row">
              <span className="deal-account">{account?.name}</span>
              <span className="deal-value">${deal.value.toLocaleString()}</span>
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
                {selectedOrganizationId != null && selectedOrganizationId !== 0 ? dealsByStage[stage].length : 0} Deals
              </span>
              <span className="stage-total">
                Total: ${calculateStageTotal(stage).toFixed(2)}
              </span>
            </div>
            <hr />
            {renderDeals(stage)}
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
              {renderDeals(stage)}
            </div>
          ))
      )}
    </div>
  );
};

export default DealStatusBoxes;
