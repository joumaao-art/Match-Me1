/**
 * Common/shared types used across all domains.
 */

export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';
export type Theme = 'light' | 'dark' | 'system';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface FileUpload {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}