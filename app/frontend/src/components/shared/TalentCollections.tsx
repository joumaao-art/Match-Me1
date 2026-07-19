/**
 * Talent Collections - First implementation of the Universal Collections Engine
 * 
 * Replaces the broken EnhancedSavedCandidatesView with a fully functional
 * collection system where folders can be opened and candidates viewed inside.
 * 
 * Uses the CollectionEngine with candidate-specific configuration.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  User, MapPin, Briefcase, GraduationCap, Star, Sparkles, Clock,
  Eye, Send, Download, Tag, GitBranch, Trash2, Copy, MoreVertical,
  CheckCircle2, Globe, Shield, Heart, Zap, Brain
} from 'lucide-react';
import CollectionEngine, {
  type Collection, type CollectionEngineConfig, type CollectionStatistics,
  type EntityFieldConfig, type EntityActionConfig
} from './CollectionEngine';
import { CollectionEnterpriseSidebar, AISuggestions } from './CollectionEnterprise';
import { toast } from 'sonner';

// ============================================================
// Candidate Entity Type for Collections
// ============================================================

export interface CollectionCandidate {
  id: string;
  name: string;
  avatar?: string;
  headline: string;
  currentPosition: string;
  company?: string;
  experience: number;
  location: string;
  skills: string[];
  languages: string[];
  availability: 'immediate' | 'two_weeks' | 'one_month' | 'not_available';
  aiMatchScore: number;
  profileStrength: number;
  profileCompletion: number;
  openToWork: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  savedDate: string;
  addedBy: string;
  notes?: string;
  tags?: string[];
}

// ============================================================
// Mock Data
// ============================================================

const MOCK_CANDIDATES: Record<string, CollectionCandidate[]> = {
  '1': [ // Engineering
    { id: 'c1', name: 'Ahmed Al-Rashid', headline: 'Senior React Developer', currentPosition: 'Lead Frontend Engineer', company: 'TechCorp', experience: 7, location: 'Riyadh, SA', skills: ['React', 'TypeScript', 'Node.js', 'AWS'], languages: ['Arabic', 'English'], availability: 'two_weeks', aiMatchScore: 94, profileStrength: 92, profileCompletion: 98, openToWork: true, isVerified: true, isFeatured: true, savedDate: '2026-07-15', addedBy: 'HR Manager', notes: 'Excellent cultural fit', tags: ['priority', 'senior'] },
    { id: 'c2', name: 'Sara Mohammed', headline: 'Full Stack Engineer', currentPosition: 'Software Engineer II', company: 'DataFlow', experience: 5, location: 'Jeddah, SA', skills: ['Python', 'React', 'PostgreSQL', 'Docker'], languages: ['Arabic', 'English', 'French'], availability: 'immediate', aiMatchScore: 91, profileStrength: 88, profileCompletion: 95, openToWork: true, isVerified: true, isFeatured: false, savedDate: '2026-07-14', addedBy: 'Tech Lead', tags: ['fullstack'] },
    { id: 'c3', name: 'Omar Hassan', headline: 'DevOps Engineer', currentPosition: 'Cloud Architect', company: 'CloudFirst', experience: 8, location: 'Dubai, UAE', skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD'], languages: ['Arabic', 'English'], availability: 'one_month', aiMatchScore: 87, profileStrength: 85, profileCompletion: 90, openToWork: false, isVerified: true, isFeatured: false, savedDate: '2026-07-12', addedBy: 'CTO', notes: 'Strong infrastructure background', tags: ['devops', 'cloud'] },
    { id: 'c4', name: 'Fatima Al-Zahra', headline: 'Mobile Developer', currentPosition: 'Senior iOS Developer', company: 'AppWorks', experience: 6, location: 'Riyadh, SA', skills: ['Swift', 'React Native', 'Flutter', 'Kotlin'], languages: ['Arabic', 'English'], availability: 'immediate', aiMatchScore: 89, profileStrength: 90, profileCompletion: 96, openToWork: true, isVerified: false, isFeatured: false, savedDate: '2026-07-10', addedBy: 'HR Manager', tags: ['mobile'] },
    { id: 'c5', name: 'Khalid Ibrahim', headline: 'Backend Engineer', currentPosition: 'Staff Engineer', company: 'ScaleUp', experience: 10, location: 'Dammam, SA', skills: ['Java', 'Microservices', 'Kafka', 'Redis'], languages: ['Arabic', 'English'], availability: 'two_weeks', aiMatchScore: 92, profileStrength: 95, profileCompletion: 100, openToWork: true, isVerified: true, isFeatured: true, savedDate: '2026-07-08', addedBy: 'VP Engineering', notes: 'Top performer, great references', tags: ['senior', 'priority', 'backend'] },
    { id: 'c6', name: 'Nora Al-Saud', headline: 'QA Automation Lead', currentPosition: 'SDET Manager', company: 'QualityFirst', experience: 6, location: 'Riyadh, SA', skills: ['Selenium', 'Cypress', 'Python', 'CI/CD'], languages: ['Arabic', 'English'], availability: 'one_month', aiMatchScore: 83, profileStrength: 82, profileCompletion: 88, openToWork: true, isVerified: true, isFeatured: false, savedDate: '2026-07-06', addedBy: 'QA Director', tags: ['qa', 'automation'] },
    { id: 'c7', name: 'Youssef Mansour', headline: 'Data Engineer', currentPosition: 'Senior Data Engineer', company: 'DataLake Inc', experience: 5, location: 'Cairo, EG', skills: ['Spark', 'Python', 'Airflow', 'BigQuery'], languages: ['Arabic', 'English'], availability: 'immediate', aiMatchScore: 86, profileStrength: 84, profileCompletion: 92, openToWork: true, isVerified: false, isFeatured: false, savedDate: '2026-07-04', addedBy: 'Data Team Lead', tags: ['data'] },
    { id: 'c8', name: 'Layla Abdulrahman', headline: 'Security Engineer', currentPosition: 'AppSec Engineer', company: 'SecureNet', experience: 4, location: 'Riyadh, SA', skills: ['Penetration Testing', 'OWASP', 'Python', 'AWS Security'], languages: ['Arabic', 'English'], availability: 'two_weeks', aiMatchScore: 80, profileStrength: 78, profileCompletion: 85, openToWork: true, isVerified: true, isFeatured: false, savedDate: '2026-07-02', addedBy: 'CISO', tags: ['security'] },
    { id: 'c9', name: 'Tariq Al-Fahad', headline: 'ML Engineer', currentPosition: 'AI Research Engineer', company: 'DeepMind SA', experience: 4, location: 'Riyadh, SA', skills: ['PyTorch', 'TensorFlow', 'NLP', 'Computer Vision'], languages: ['Arabic', 'English', 'German'], availability: 'one_month', aiMatchScore: 88, profileStrength: 86, profileCompletion: 93, openToWork: false, isVerified: true, isFeatured: true, savedDate: '2026-07-01', addedBy: 'AI Director', notes: 'PhD candidate, published papers', tags: ['ai', 'ml', 'research'] },
    { id: 'c10', name: 'Reem Al-Otaibi', headline: 'Frontend Developer', currentPosition: 'UI Engineer', company: 'DesignTech', experience: 3, location: 'Jeddah, SA', skills: ['React', 'Vue', 'CSS', 'Figma'], languages: ['Arabic', 'English'], availability: 'immediate', aiMatchScore: 82, profileStrength: 80, profileCompletion: 87, openToWork: true, isVerified: false, isFeatured: false, savedDate: '2026-06-28', addedBy: 'Design Lead', tags: ['frontend', 'ui'] },
    { id: 'c11', name: 'Hassan Mahmoud', headline: 'Platform Engineer', currentPosition: 'SRE', company: 'ReliableSys', experience: 6, location: 'Riyadh, SA', skills: ['Go', 'Kubernetes', 'Prometheus', 'Linux'], languages: ['Arabic', 'English'], availability: 'two_weeks', aiMatchScore: 85, profileStrength: 87, profileCompletion: 91, openToWork: true, isVerified: true, isFeatured: false, savedDate: '2026-06-25', addedBy: 'Platform Director', tags: ['sre', 'platform'] },
    { id: 'c12', name: 'Maha Al-Dosari', headline: 'Tech Lead', currentPosition: 'Engineering Manager', company: 'GrowthCo', experience: 9, location: 'Riyadh, SA', skills: ['Architecture', 'Team Leadership', 'Java', 'System Design'], languages: ['Arabic', 'English'], availability: 'one_month', aiMatchScore: 96, profileStrength: 94, profileCompletion: 99, openToWork: true, isVerified: true, isFeatured: true, savedDate: '2026-06-20', addedBy: 'VP Engineering', notes: 'Outstanding leadership track record', tags: ['leadership', 'senior', 'priority'] },
  ],
  '2': [ // Marketing
    { id: 'c20', name: 'Lina Al-Harbi', headline: 'Digital Marketing Manager', currentPosition: 'Head of Digital', company: 'BrandCo', experience: 6, location: 'Riyadh, SA', skills: ['SEO', 'Google Ads', 'Content Strategy', 'Analytics'], languages: ['Arabic', 'English'], availability: 'immediate', aiMatchScore: 88, profileStrength: 86, profileCompletion: 94, openToWork: true, isVerified: true, isFeatured: false, savedDate: '2026-07-16', addedBy: 'CMO', tags: ['digital'] },
    { id: 'c21', name: 'Faisal Al-Mutairi', headline: 'Content Strategist', currentPosition: 'Senior Content Lead', company: 'MediaHub', experience: 5, location: 'Jeddah, SA', skills: ['Copywriting', 'SEO', 'Social Media', 'Brand Strategy'], languages: ['Arabic', 'English', 'French'], availability: 'two_weeks', aiMatchScore: 84, profileStrength: 82, profileCompletion: 90, openToWork: true, isVerified: false, isFeatured: false, savedDate: '2026-07-14', addedBy: 'Marketing Director', tags: ['content'] },
    { id: 'c22', name: 'Noura Al-Qahtani', headline: 'Growth Marketer', currentPosition: 'Growth Lead', company: 'StartupX', experience: 4, location: 'Riyadh, SA', skills: ['Growth Hacking', 'A/B Testing', 'Funnel Optimization', 'Paid Ads'], languages: ['Arabic', 'English'], availability: 'immediate', aiMatchScore: 90, profileStrength: 88, profileCompletion: 92, openToWork: true, isVerified: true, isFeatured: true, savedDate: '2026-07-12', addedBy: 'CEO', notes: 'Drove 300% user growth at previous company', tags: ['growth', 'priority'] },
    { id: 'c23', name: 'Abdulaziz Al-Shehri', headline: 'Brand Manager', currentPosition: 'Senior Brand Strategist', company: 'LuxBrands', experience: 7, location: 'Dubai, UAE', skills: ['Brand Strategy', 'Market Research', 'Campaign Management', 'PR'], languages: ['Arabic', 'English'], availability: 'one_month', aiMatchScore: 82, profileStrength: 84, profileCompletion: 88, openToWork: false, isVerified: true, isFeatured: false, savedDate: '2026-07-10', addedBy: 'VP Marketing', tags: ['brand'] },
    { id: 'c24', name: 'Huda Al-Zahrani', headline: 'Social Media Manager', currentPosition: 'Social Media Director', company: 'ViralCo', experience: 4, location: 'Riyadh, SA', skills: ['Instagram', 'TikTok', 'Community Management', 'Influencer Marketing'], languages: ['Arabic', 'English'], availability: 'immediate', aiMatchScore: 79, profileStrength: 76, profileCompletion: 85, openToWork: true, isVerified: false, isFeatured: false, savedDate: '2026-07-08', addedBy: 'Marketing Manager', tags: ['social'] },
  ],
  '3': [ // Finance
    { id: 'c30', name: 'Mohammed Al-Ghamdi', headline: 'Financial Analyst', currentPosition: 'Senior Financial Analyst', company: 'FinanceCorp', experience: 5, location: 'Riyadh, SA', skills: ['Financial Modeling', 'Excel', 'SAP', 'Budgeting'], languages: ['Arabic', 'English'], availability: 'two_weeks', aiMatchScore: 85, profileStrength: 83, profileCompletion: 91, openToWork: true, isVerified: true, isFeatured: false, savedDate: '2026-07-15', addedBy: 'CFO', tags: ['finance'] },
    { id: 'c31', name: 'Aisha Al-Rashidi', headline: 'Accountant', currentPosition: 'Senior Accountant', company: 'AuditPro', experience: 6, location: 'Jeddah, SA', skills: ['IFRS', 'Auditing', 'Tax Planning', 'QuickBooks'], languages: ['Arabic', 'English'], availability: 'immediate', aiMatchScore: 81, profileStrength: 80, profileCompletion: 88, openToWork: true, isVerified: true, isFeatured: false, savedDate: '2026-07-12', addedBy: 'Finance Director', tags: ['accounting'] },
    { id: 'c32', name: 'Sultan Al-Dosari', headline: 'Investment Analyst', currentPosition: 'VP Investments', company: 'CapitalGroup', experience: 8, location: 'Riyadh, SA', skills: ['Valuation', 'Due Diligence', 'M&A', 'Private Equity'], languages: ['Arabic', 'English', 'French'], availability: 'one_month', aiMatchScore: 92, profileStrength: 90, profileCompletion: 96, openToWork: false, isVerified: true, isFeatured: true, savedDate: '2026-07-10', addedBy: 'CEO', notes: 'Exceptional track record in PE deals', tags: ['investment', 'senior', 'priority'] },
  ],
  '4': [ // Sales
    { id: 'c40', name: 'Bandar Al-Otaibi', headline: 'Enterprise Sales Manager', currentPosition: 'Regional Sales Director', company: 'SalesPro', experience: 8, location: 'Riyadh, SA', skills: ['Enterprise Sales', 'CRM', 'Negotiation', 'Account Management'], languages: ['Arabic', 'English'], availability: 'immediate', aiMatchScore: 90, profileStrength: 88, profileCompletion: 94, openToWork: true, isVerified: true, isFeatured: true, savedDate: '2026-07-16', addedBy: 'VP Sales', notes: 'Consistently exceeds quota by 150%', tags: ['enterprise', 'priority'] },
    { id: 'c41', name: 'Dalal Al-Harbi', headline: 'Business Development', currentPosition: 'BD Manager', company: 'GrowthPartners', experience: 5, location: 'Jeddah, SA', skills: ['Lead Generation', 'Partnerships', 'SaaS Sales', 'Presentations'], languages: ['Arabic', 'English'], availability: 'two_weeks', aiMatchScore: 86, profileStrength: 84, profileCompletion: 90, openToWork: true, isVerified: false, isFeatured: false, savedDate: '2026-07-14', addedBy: 'Sales Manager', tags: ['bd'] },
  ],
  '5': [ // Executive
    { id: 'c50', name: 'Dr. Fahad Al-Saud', headline: 'Chief Technology Officer', currentPosition: 'CTO', company: 'TechVentures', experience: 15, location: 'Riyadh, SA', skills: ['Strategy', 'Digital Transformation', 'AI/ML', 'Team Building'], languages: ['Arabic', 'English', 'German'], availability: 'one_month', aiMatchScore: 97, profileStrength: 98, profileCompletion: 100, openToWork: false, isVerified: true, isFeatured: true, savedDate: '2026-07-10', addedBy: 'CEO', notes: 'Top-tier executive, board-level connections', tags: ['c-suite', 'priority'] },
    { id: 'c51', name: 'Mona Al-Faisal', headline: 'VP of Engineering', currentPosition: 'VP Engineering', company: 'ScaleUp Inc', experience: 12, location: 'Dubai, UAE', skills: ['Engineering Leadership', 'Architecture', 'Agile', 'Hiring'], languages: ['Arabic', 'English'], availability: 'two_weeks', aiMatchScore: 95, profileStrength: 96, profileCompletion: 99, openToWork: true, isVerified: true, isFeatured: true, savedDate: '2026-07-08', addedBy: 'Board Member', notes: 'Built engineering team from 5 to 200', tags: ['leadership', 'executive', 'priority'] },
  ],
  '6': [ // Future Hiring
    { id: 'c60', name: 'Turki Al-Dossary', headline: 'Product Manager', currentPosition: 'Senior PM', company: 'ProductLab', experience: 6, location: 'Riyadh, SA', skills: ['Product Strategy', 'Agile', 'User Research', 'Data Analytics'], languages: ['Arabic', 'English'], availability: 'not_available', aiMatchScore: 84, profileStrength: 82, profileCompletion: 89, openToWork: false, isVerified: true, isFeatured: false, savedDate: '2026-07-15', addedBy: 'CPO', notes: 'Great for Q4 hiring', tags: ['product', 'future'] },
  ],
  '7': [ // Arabic Speakers
    { id: 'c70', name: 'Amira Khalil', headline: 'Technical Writer', currentPosition: 'Documentation Lead', company: 'DocuTech', experience: 4, location: 'Cairo, EG', skills: ['Technical Writing', 'API Documentation', 'Arabic Localization', 'Markdown'], languages: ['Arabic', 'English', 'French'], availability: 'immediate', aiMatchScore: 78, profileStrength: 76, profileCompletion: 84, openToWork: true, isVerified: false, isFeatured: false, savedDate: '2026-07-14', addedBy: 'Content Manager', tags: ['writing', 'arabic'] },
  ],
  '8': [ // Remote Ready
    { id: 'c80', name: 'Ziad Hamdan', headline: 'Remote DevOps Specialist', currentPosition: 'Senior DevOps', company: 'RemoteFirst', experience: 6, location: 'Amman, JO', skills: ['AWS', 'Terraform', 'Docker', 'GitOps'], languages: ['Arabic', 'English'], availability: 'immediate', aiMatchScore: 86, profileStrength: 84, profileCompletion: 91, openToWork: true, isVerified: true, isFeatured: false, savedDate: '2026-07-13', addedBy: 'Engineering Manager', tags: ['remote', 'devops'] },
  ],
};

// ============================================================
// Candidate Card Renderer
// ============================================================

function CandidateEntityCard({ candidate, selected, onSelect }: { candidate: CollectionCandidate; selected: boolean; onSelect: () => void }) {
  const { t } = useTranslation();

  const availabilityColor = {
    immediate: 'text-green-600 bg-green-50',
    two_weeks: 'text-blue-600 bg-blue-50',
    one_month: 'text-amber-600 bg-amber-50',
    not_available: 'text-gray-500 bg-gray-50',
  }[candidate.availability];

  const availabilityLabel = {
    immediate: t('available_immediately'),
    two_weeks: t('two_weeks_notice'),
    one_month: t('one_month_notice'),
    not_available: t('not_available'),
  }[candidate.availability];

  return (
    <Card className={`transition-all hover:shadow-sm ${selected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="mt-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Avatar */}
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-medium truncate">{candidate.name}</h4>
              {candidate.isVerified && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip><TooltipTrigger><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">{t('verified')}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {candidate.isFeatured && (
                <Badge variant="secondary" className="h-4 text-[9px] px-1.5 bg-amber-50 text-amber-700">
                  <Star className="w-2.5 h-2.5 me-0.5 fill-amber-500" />{t('featured')}
                </Badge>
              )}
              {candidate.openToWork && (
                <Badge variant="secondary" className="h-4 text-[9px] px-1.5 bg-green-50 text-green-700">
                  {t('open_to_work')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{candidate.headline}</p>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Briefcase className="w-3 h-3" />{candidate.experience}y
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />{candidate.location}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${availabilityColor}`}>
                {availabilityLabel}
              </span>
            </div>

            {/* Skills */}
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {candidate.skills.slice(0, 4).map(skill => (
                <Badge key={skill} variant="outline" className="h-5 text-[10px] px-1.5">{skill}</Badge>
              ))}
              {candidate.skills.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{candidate.skills.length - 4}</span>
              )}
            </div>

            {/* Tags */}
            {candidate.tags && candidate.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {candidate.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-primary bg-primary/5 px-1.5 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            )}

            {/* Notes */}
            {candidate.notes && (
              <p className="text-[10px] text-muted-foreground mt-1.5 italic border-s-2 border-primary/20 ps-2">
                {candidate.notes}
              </p>
            )}
          </div>

          {/* Right side - scores */}
          <div className="shrink-0 text-end space-y-1">
            <div className="flex items-center gap-1 justify-end">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-bold text-primary">{candidate.aiMatchScore}%</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t('profile')}: {candidate.profileStrength}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              {new Date(candidate.savedDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Talent Collections Configuration
// ============================================================

const CANDIDATE_FIELDS: EntityFieldConfig[] = [
  { key: 'name', labelKey: 'name', type: 'text', searchable: true, sortable: true },
  { key: 'headline', labelKey: 'headline', type: 'text', searchable: true },
  { key: 'skills', labelKey: 'skills', type: 'tags', searchable: true, filterable: true },
  { key: 'languages', labelKey: 'languages', type: 'tags', filterable: true },
  { key: 'location', labelKey: 'location', type: 'text', searchable: true, filterable: true },
  { key: 'experience', labelKey: 'experience', type: 'number', filterable: true, sortable: true },
  { key: 'aiMatchScore', labelKey: 'ai_match_score', type: 'number', filterable: true, sortable: true },
  { key: 'profileStrength', labelKey: 'profile_strength', type: 'number', filterable: true, sortable: true },
  { key: 'profileCompletion', labelKey: 'profile_completion', type: 'number', filterable: true, sortable: true },
  { key: 'availability', labelKey: 'availability', type: 'select', filterable: true, sortable: true, options: [
    { value: 'immediate', labelKey: 'available_immediately' },
    { value: 'two_weeks', labelKey: 'two_weeks_notice' },
    { value: 'one_month', labelKey: 'one_month_notice' },
    { value: 'not_available', labelKey: 'not_available' },
  ]},
  { key: 'openToWork', labelKey: 'open_to_work', type: 'boolean', filterable: true },
  { key: 'isVerified', labelKey: 'verified', type: 'boolean', filterable: true },
  { key: 'isFeatured', labelKey: 'featured', type: 'boolean', filterable: true },
  { key: 'tags', labelKey: 'tags', type: 'tags', searchable: true, filterable: true },
];

// ============================================================
// Main Talent Collections Component
// ============================================================

export default function TalentCollections() {
  const { t } = useTranslation();

  // Collection state
  const [collections, setCollections] = useState<Collection[]>([
    {
      id: '1', name: 'Engineering', description: 'Software engineering candidates across all levels', type: 'manual', visibility: 'team', color: '#3B82F6',
      entityType: 'candidate', entityCount: 12, owner: { id: '1', name: 'HR Manager' },
      createdAt: '2026-06-01', updatedAt: '2026-07-15', isPinned: true, isFavorite: false, isArchived: false,
      statistics: { totalEntities: 12, avgMatchScore: 88, avgExperience: 6, avgProfileStrength: 87, avgProfileCompletion: 93, recentlyAdded: 3, recentlyContacted: 4, invitationsSent: 2, interviews: 3, offers: 1, hires: 0 },
    },
    {
      id: '2', name: 'Marketing', description: 'Digital marketing and growth professionals', type: 'manual', visibility: 'team', color: '#10B981',
      entityType: 'candidate', entityCount: 5, owner: { id: '1', name: 'HR Manager' },
      createdAt: '2026-06-05', updatedAt: '2026-07-16', isPinned: false, isFavorite: true, isArchived: false,
      statistics: { totalEntities: 5, avgMatchScore: 85, avgExperience: 5, avgProfileStrength: 83, avgProfileCompletion: 90, recentlyAdded: 2, interviews: 1, offers: 0, hires: 0 },
    },
    {
      id: '3', name: 'Finance', description: 'Financial analysts and accountants', type: 'manual', visibility: 'private', color: '#F59E0B',
      entityType: 'candidate', entityCount: 3, owner: { id: '1', name: 'HR Manager' },
      createdAt: '2026-06-10', updatedAt: '2026-07-15', isPinned: false, isFavorite: false, isArchived: false,
      statistics: { totalEntities: 3, avgMatchScore: 86, avgExperience: 6, avgProfileStrength: 84, avgProfileCompletion: 92, recentlyAdded: 1, interviews: 0, offers: 0, hires: 0 },
    },
    {
      id: '4', name: 'Sales', description: 'Enterprise sales and business development', type: 'manual', visibility: 'team', color: '#EF4444',
      entityType: 'candidate', entityCount: 2, owner: { id: '1', name: 'HR Manager' },
      createdAt: '2026-06-15', updatedAt: '2026-07-16', isPinned: false, isFavorite: false, isArchived: false,
      statistics: { totalEntities: 2, avgMatchScore: 88, avgExperience: 7, avgProfileStrength: 86, avgProfileCompletion: 92, recentlyAdded: 1, interviews: 1, offers: 0, hires: 0 },
    },
    {
      id: '5', name: 'Executive', description: 'C-suite and VP-level leadership candidates', type: 'manual', visibility: 'private', color: '#8B5CF6',
      entityType: 'candidate', entityCount: 2, owner: { id: '1', name: 'CEO' },
      createdAt: '2026-06-20', updatedAt: '2026-07-10', isPinned: true, isFavorite: true, isArchived: false,
      statistics: { totalEntities: 2, avgMatchScore: 96, avgExperience: 14, avgProfileStrength: 97, avgProfileCompletion: 100, recentlyAdded: 0, interviews: 1, offers: 1, hires: 0 },
    },
    {
      id: '6', name: 'Future Hiring', description: 'Candidates for upcoming Q4 positions', type: 'manual', visibility: 'team', color: '#6366F1',
      entityType: 'candidate', entityCount: 1, owner: { id: '1', name: 'HR Manager' },
      createdAt: '2026-07-01', updatedAt: '2026-07-15', isPinned: false, isFavorite: false, isArchived: false,
      statistics: { totalEntities: 1, avgMatchScore: 84, avgExperience: 6, avgProfileStrength: 82, avgProfileCompletion: 89, recentlyAdded: 1, interviews: 0, offers: 0, hires: 0 },
    },
    {
      id: '7', name: 'Arabic Speakers', description: 'Candidates with strong Arabic language skills', type: 'smart', visibility: 'team', color: '#14B8A6',
      entityType: 'candidate', entityCount: 1, owner: { id: '1', name: 'HR Manager' },
      createdAt: '2026-06-25', updatedAt: '2026-07-14', isPinned: false, isFavorite: false, isArchived: false,
      rules: { id: 'root', connector: 'AND', rules: [{ id: 'r1', field: 'languages', operator: 'contains', value: 'Arabic' }] },
      statistics: { totalEntities: 1, avgMatchScore: 78, avgExperience: 4, avgProfileStrength: 76, avgProfileCompletion: 84, recentlyAdded: 1, interviews: 0, offers: 0, hires: 0 },
    },
    {
      id: '8', name: 'Remote Ready', description: 'Candidates open to fully remote positions', type: 'smart', visibility: 'organization', color: '#EC4899',
      entityType: 'candidate', entityCount: 1, owner: { id: '1', name: 'HR Manager' },
      createdAt: '2026-06-28', updatedAt: '2026-07-13', isPinned: false, isFavorite: false, isArchived: false,
      rules: { id: 'root', connector: 'AND', rules: [{ id: 'r1', field: 'availability', operator: 'not_equals', value: 'not_available' }, { id: 'r2', field: 'openToWork', operator: 'is_true', value: true, connector: 'AND' }] },
      statistics: { totalEntities: 1, avgMatchScore: 86, avgExperience: 6, avgProfileStrength: 84, avgProfileCompletion: 91, recentlyAdded: 1, interviews: 0, offers: 0, hires: 0 },
    },
  ]);

  // Get entities for a collection
  const getEntitiesForCollection = useCallback((collectionId: string): Record<string, unknown>[] => {
    return (MOCK_CANDIDATES[collectionId] || []) as unknown as Record<string, unknown>[];
  }, []);

  // Actions
  const candidateActions: EntityActionConfig[] = useMemo(() => [
    { id: 'view', labelKey: 'view_profile', icon: <Eye className="w-3 h-3" />, handler: (ids) => toast.info(`${t('viewing')} ${ids.length} ${t('candidates')}`), bulk: false },
    { id: 'contact', labelKey: 'contact', icon: <Send className="w-3 h-3" />, handler: (ids) => toast.success(`${t('contact_sent')} (${ids.length})`), bulk: true },
    { id: 'move', labelKey: 'move', icon: <GitBranch className="w-3 h-3" />, handler: (ids) => toast.success(`${t('moved')} ${ids.length} ${t('candidates')}`), bulk: true },
    { id: 'copy', labelKey: 'copy', icon: <Copy className="w-3 h-3" />, handler: (ids) => toast.success(`${t('copied')} ${ids.length} ${t('candidates')}`), bulk: true },
    { id: 'pipeline', labelKey: 'add_to_pipeline', icon: <GitBranch className="w-3 h-3" />, handler: (ids) => toast.success(`${t('added_to_pipeline')} (${ids.length})`), bulk: true },
    { id: 'remove', labelKey: 'remove', icon: <Trash2 className="w-3 h-3" />, handler: (ids) => toast.success(`${t('removed')} ${ids.length} ${t('candidates')}`), bulk: true, variant: 'destructive' },
  ], [t]);

  // Engine config
  const config: CollectionEngineConfig = useMemo(() => ({
    entityType: 'candidate',
    entityLabelKey: 'candidate',
    entityPluralKey: 'saved_candidates',
    parentBreadcrumb: { labelKey: 'candidates' },
    fields: CANDIDATE_FIELDS,
    actions: candidateActions,
    renderEntity: (entity, options) => {
      const candidate = entity as unknown as CollectionCandidate;
      return <CandidateEntityCard candidate={candidate} selected={options.selected} onSelect={options.onSelect} />;
    },
    smartCollectionFields: CANDIDATE_FIELDS.filter(f => f.filterable),
    enableDragDrop: true,
    enableBulkActions: true,
    enableSmartCollections: true,
    enableAICollections: true,
    enableSharing: true,
  }), [candidateActions]);

  const handleAcceptAISuggestion = useCallback((newCollection: Collection) => {
    setCollections(prev => [...prev, newCollection]);
  }, []);

  return (
    <CollectionEngine
      config={config}
      collections={collections}
      onCollectionsChange={setCollections}
      getEntitiesForCollection={getEntitiesForCollection}
      enableEnterprise
      renderEnterpriseSidebar={(collectionId, collection) => (
        <CollectionEnterpriseSidebar
          collectionId={collectionId}
          collection={collection}
          onAcceptAISuggestion={handleAcceptAISuggestion}
        />
      )}
      renderAISuggestions={() => (
        <AISuggestions onAccept={handleAcceptAISuggestion} />
      )}
    />
  );
}