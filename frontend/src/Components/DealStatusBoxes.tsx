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

const DealStatusBoxes: React.FC<DealStatusBoxesProps> = ({ selectedOrganizationId, deals, activeFilterType }) => {
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

  const renderNumberList = () => (
    <ul className="number-list">
      {Array.from({ length: 11 }, (_, i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );

  return (
    <div className="deal-status-boxes-container">
      {activeFilterType === 'all' ? (
        dealStages.map(stage => (
          <div key={stage} className={`deal-status-box ${stage}`}>
            <h3>{stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
            <p className="deal-count">
              {selectedOrganizationId != null && selectedOrganizationId !== 0 ? dealsByStage[stage].length : 0} Deals
            </p>
            <hr/>
            {renderNumberList()}
          </div>
        ))
      ) : (
        dealStages
          .filter(stage => stage === activeFilterType)
          .map(stage => (
            <div key={stage} className={`deal-status-box filtered-stage ${stage}`}>
              <h3>{stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
              <p className="deal-count">
                {selectedOrganizationId != null && selectedOrganizationId !== 0 ? dealsByStage[stage].length : 0} Deals
              </p>
              <hr/>
              {renderNumberList()}
            </div>
          ))
      )}
    </div>
  );
};

export default DealStatusBoxes;
