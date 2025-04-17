import { Organization } from "./organization";

export interface Account {
  id: number;
  name: string;
  organization_id: number;
  organization?: Organization;
}