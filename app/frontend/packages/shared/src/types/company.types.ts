/**
 * Company-specific types.
 */

export interface CompanyBranch {
  id: string;
  companyId: string;
  branchName: string;
  isHeadquarters: boolean;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  totalMatches: number;
  totalHires: number;
  responseRate: number;
  averageTimeToHire: number;
}