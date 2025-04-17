import { Account } from "./account";

export interface Deal {
  id: number;
  account_id: number;
  value: number;
  status: 'build_proposal' | 'pitch_proposal' | 'negotiation' | 'awaiting_signoff' | 'signed' | 'cancelled' | 'lost';
  account?: Account;
  updated_at: Date;
}