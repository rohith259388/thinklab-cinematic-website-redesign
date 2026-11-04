/**
 * Leads captured from the contact chamber — the moment a visitor's idea
 * re-enters the laboratory.
 */
export interface Lead {
  _id?: string;
  name: string;
  email: string;
  company?: string | null;
  service?: string | null;
  message: string;
  source: string;
  createdAt: Date;
}
