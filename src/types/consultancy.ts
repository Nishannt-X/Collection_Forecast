
export type ContractType = 'time-based' | 'milestone-based';
export type ClientType = 'support-assistance' | 'sap-implementation';

export interface ConsultancyClient {
  id: string;
  name: string;
  clientType: ClientType;
  contractType: ContractType;
  monthlyValue?: number; // For time-based contracts
  projectPhase?: string; // For milestone-based contracts
  nextMilestone?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ConsultancyInvoice {
  id: string;
  clientId: string;
  contractType: ContractType;
  amount: number;
  billingPeriod?: string; // For time-based monthly billing
  milestoneDescription?: string; // For milestone-based
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
}
