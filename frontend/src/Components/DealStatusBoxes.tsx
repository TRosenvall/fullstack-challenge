import React from 'react';
import { Deal } from '../Models/deal'
import './DealStatusBoxes.css';

interface DealStatusBoxesProps {
  deals: Deal[];
}

const DealStatusBoxes: React.FC<DealStatusBoxesProps> = ({ deals }) => {
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

  return (
    <div className="deal-status-boxes-container">
      {dealStages.map(stage => (
        <div key={stage} className={`deal-status-box ${stage}`}>
          <h3>{stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
          <p className="deal-count">{dealsByStage[stage].length} Deals</p>
          {/* You can add more detailed information here if needed */}
        </div>
      ))}
    </div>
  );
};

export default DealStatusBoxes;