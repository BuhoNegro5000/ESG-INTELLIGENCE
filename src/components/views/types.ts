import type { IRO, Portfolio, Workspace } from '@/lib/types';
import type { ViewKey } from '@/lib/views';

export interface AppActions {
  navigate: (view: ViewKey) => void;
  openIRO: (iro: IRO) => void;
  createIRO: () => void;
  openReport: () => void;
  selectCompany: (companyId: string) => void;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}

export interface ViewProps {
  workspace: Workspace;
  portfolio: Portfolio;
  actions: AppActions;
}
