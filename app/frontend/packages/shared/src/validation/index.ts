/**
 * Shared validation schemas using Zod.
 * Used by both web and mobile for form validation.
 */

import { z } from 'zod';

// ============================================================
// Auth Validation
// ============================================================

export const emailSchema = z.string().email('Invalid email address').min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['job_seeker', 'company']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============================================================
// Profile Validation
// ============================================================

export const jobSeekerProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  middleName: z.string().max(100).optional(),
  email: emailSchema,
  phone: z.string().max(20).optional(),
  nationality: z.string().max(100).optional(),
  currentLocation: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  headline: z.string().max(200).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  preferredEmploymentType: z.enum(['full-time', 'part-time', 'contract', 'remote', 'internship']).optional(),
  preferredSalaryMin: z.number().min(0).optional(),
  preferredSalaryMax: z.number().min(0).optional(),
  willingToRelocate: z.boolean().optional(),
});

export const companyProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  legalName: z.string().max(200).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  industry: z.string().max(100).optional(),
  companySize: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  mission: z.string().max(1000).optional(),
});

// ============================================================
// Job Validation
// ============================================================

export const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  requirements: z.string().max(3000).optional(),
  responsibilities: z.string().max(3000).optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'remote', 'internship']),
  experienceMin: z.number().min(0).max(50),
  experienceMax: z.number().min(0).max(50).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  isRemote: z.boolean().optional(),
  requiredSkills: z.array(z.string()).max(20).optional(),
  benefits: z.array(z.string()).max(20).optional(),
});

// ============================================================
// Message Validation
// ============================================================

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
});

// ============================================================
// Support Ticket Validation
// ============================================================

export const supportTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type JobSeekerProfileInput = z.infer<typeof jobSeekerProfileSchema>;
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;