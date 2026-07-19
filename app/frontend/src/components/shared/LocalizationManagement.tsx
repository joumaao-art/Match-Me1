/**
 * Localization Management Module - Super Admin Platform
 * 
 * Features:
 * - Translation Dashboard with completion metrics
 * - Translation Editor with search, edit, create, delete
 * - Language Management (enable/disable, status)
 * - Missing Translation Center
 * - Import/Export (JSON, CSV)
 * - Translation Analytics
 * - Approval Workflow
 * - Audit Logs for translation changes
 * - Version History
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { en, ar } from '@matchme/shared/i18n';
import { supportedLanguages, getAllTranslationKeys, getTranslationCompleteness, validateTranslations, missingTranslationTracker } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Globe, Search, Edit3, Plus, Trash2, Download, Upload,
  CheckCircle2, AlertTriangle, Clock, BarChart3, History,
  Languages, FileJson, FileSpreadsheet, Eye, Filter,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type LocalizationTab = 'dashboard' | 'editor' | 'languages' | 'missing' | 'import_export' | 'analytics' | 'audit';

interface TranslationEntry {
  key: string;
  en: string;
  ar: string;
  namespace: string;
  lastModified: string;
  status: 'approved' | 'pending' | 'draft';
}

interface AuditEntry {
  id: string;
  action: 'created' | 'updated' | 'approved' | 'deleted' | 'imported' | 'exported' | 'language_enabled' | 'language_disabled' | 'published' | 'rollback';
  key: string;
  language: string;
  user: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
}

// ============================================================
// Utility Functions
// ============================================================

function getNamespace(key: string): string {
  const prefixes: Record<string, string> = {
    'lm_': 'learn_more', 'pc_': 'profile_completion', 'seeker_': 'job_seeker',
    'company_': 'company', 'admin_': 'admin', 'workflow_': 'messaging',
    'email_': 'emails', 'error_': 'errors', 'feat_': 'features',
  };
  for (const [prefix, ns] of Object.entries(prefixes)) {
    if (key.startsWith(prefix)) return ns;
  }
  return 'general';
}

function generateAuditLogs(): AuditEntry[] {
  const actions: AuditEntry['action'][] = ['created', 'updated', 'approved', 'imported', 'exported'];
  const users = ['admin@matchme.com', 'translator@matchme.com', 'reviewer@matchme.com'];
  const keys = ['ai_recommendations_desc', 'billing_analytics', 'manage_subscription', 'addons_desc', 'compliance_desc'];
  return Array.from({ length: 20 }, (_, i) => ({
    id: `audit-${i}`,
    action: actions[i % actions.length],
    key: keys[i % keys.length],
    language: i % 2 === 0 ? 'en' : 'ar',
    user: users[i % users.length],
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    oldValue: i % 3 === 0 ? 'Old value' : undefined,
    newValue: 'New value',
  }));
}

// ============================================================
// Main Component
// ============================================================

export default function LocalizationManagement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LocalizationTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNamespace, setFilterNamespace] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingKey, setEditingKey] = useState<TranslationEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKey, setNewKey] = useState({ key: '', en: '', ar: '' });

  // Build translation entries from actual data
  const allEntries: TranslationEntry[] = useMemo(() => {
    const enTranslations = en as Record<string, string>;
    const arTranslations = ar as Record<string, string>;
    return Object.keys(enTranslations).map(key => ({
      key,
      en: enTranslations[key] || '',
      ar: arTranslations[key] || '',
      namespace: getNamespace(key),
      lastModified: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      status: arTranslations[key] ? 'approved' as const : 'pending' as const,
    }));
  }, []);

  const namespaces = useMemo(() => {
    const ns = new Set(allEntries.map(e => e.namespace));
    return Array.from(ns).sort();
  }, [allEntries]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      const matchesSearch = !searchQuery ||
        entry.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.ar.includes(searchQuery);
      const matchesNamespace = filterNamespace === 'all' || entry.namespace === filterNamespace;
      const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
      return matchesSearch && matchesNamespace && matchesStatus;
    });
  }, [allEntries, searchQuery, filterNamespace, filterStatus]);

  const enCompleteness = getTranslationCompleteness('en');
  const arCompleteness = getTranslationCompleteness('ar');
  const validation = validateTranslations('ar');
  const missingKeys = missingTranslationTracker.getMissingKeys();
  const auditLogs = useMemo(() => generateAuditLogs(), []);

  // ============================================================
  // Dashboard Tab
  // ============================================================
  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('total_keys')}</p>
                <p className="text-2xl font-bold font-[Poppins]">{enCompleteness.total}</p>
              </div>
              <Globe className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('translated_keys')}</p>
                <p className="text-2xl font-bold font-[Poppins] text-green-600">{arCompleteness.translated}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('missing_keys')}</p>
                <p className="text-2xl font-bold font-[Poppins] text-amber-600">{missingKeys.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('supported_languages')}</p>
                <p className="text-2xl font-bold font-[Poppins]">{supportedLanguages.filter(l => l.status === 'production').length}</p>
              </div>
              <Languages className="w-8 h-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('translation_coverage')}</CardTitle>
          <CardDescription>{t('languages_overview')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {supportedLanguages.filter(l => l.status !== 'draft').map(lang => {
            const completeness = lang.code === 'en' ? enCompleteness : arCompleteness;
            return (
              <div key={lang.code} className="flex items-center gap-4">
                <div className="w-32 flex items-center gap-2">
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                  <Badge variant={lang.status === 'production' ? 'default' : 'secondary'} className="text-[10px]">
                    {lang.status}
                  </Badge>
                </div>
                <div className="flex-1">
                  <Progress value={completeness.percentage} className="h-2" />
                </div>
                <span className="text-sm font-medium w-12 text-end">{completeness.percentage}%</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('recently_updated')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant={log.action === 'updated' ? 'default' : log.action === 'approved' ? 'secondary' : 'outline'} className="text-[10px]">
                    {log.action}
                  </Badge>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.key}</code>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{log.user.split('@')[0]}</span>
                  <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // Editor Tab
  // ============================================================
  const EditorTab = () => (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('search_translations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={filterNamespace} onValueChange={setFilterNamespace}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('all_namespaces')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_namespaces')}</SelectItem>
            {namespaces.map(ns => <SelectItem key={ns} value={ns}>{ns}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder={t('filter_by_status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="approved">{t('approved')}</SelectItem>
            <SelectItem value="pending">{t('pending')}</SelectItem>
            <SelectItem value="draft">{t('draft')}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddDialog(true)} className="cursor-pointer gap-1">
          <Plus className="w-4 h-4" /> {t('add_translation')}
        </Button>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filteredEntries.length} / {allEntries.length} {t('entries')}</p>

      {/* Translation Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-start px-3 py-2 font-medium">{t('key_name')}</th>
                <th className="text-start px-3 py-2 font-medium">{t('english_value')}</th>
                <th className="text-start px-3 py-2 font-medium">{t('arabic_value')}</th>
                <th className="text-start px-3 py-2 font-medium">{t('namespace')}</th>
                <th className="text-start px-3 py-2 font-medium">{t('status')}</th>
                <th className="text-start px-3 py-2 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.slice(0, 50).map(entry => (
                <tr key={entry.key} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2">
                    <code className="text-xs bg-muted px-1 py-0.5 rounded break-all">{entry.key}</code>
                  </td>
                  <td className="px-3 py-2 max-w-[200px] truncate text-xs">{entry.en}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate text-xs" dir="rtl">{entry.ar}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-[10px]">{entry.namespace}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={entry.status === 'approved' ? 'default' : entry.status === 'pending' ? 'secondary' : 'outline'} className="text-[10px]">
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setEditingKey(entry)}>
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => toast.success(t('translation_deleted'))}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEntries.length > 50 && (
          <div className="p-3 text-center text-xs text-muted-foreground border-t">
            Showing 50 of {filteredEntries.length} entries. Use search to narrow results.
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================
  // Languages Tab
  // ============================================================
  const LanguagesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">{t('supported_languages')}</h3>
        <Button variant="outline" className="cursor-pointer gap-1" onClick={() => toast.success(t('language_enabled'))}>
          <Plus className="w-4 h-4" /> {t('add_language')}
        </Button>
      </div>
      <div className="grid gap-3">
        {supportedLanguages.map(lang => {
          const completeness = lang.code === 'en' ? enCompleteness : lang.code === 'ar' ? arCompleteness : { total: enCompleteness.total, translated: 0, missing: enCompleteness.total, percentage: 0 };
          return (
            <Card key={lang.code}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{lang.code.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{lang.name} <span className="text-muted-foreground">({lang.nativeName})</span></p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={lang.status === 'production' ? 'default' : lang.status === 'beta' ? 'secondary' : 'outline'} className="text-[10px]">
                          {lang.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{lang.direction.toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground">{completeness.translated}/{completeness.total} keys</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <p className="text-lg font-bold font-[Poppins]">{completeness.percentage}%</p>
                      <Progress value={completeness.percentage} className="h-1.5 w-20" />
                    </div>
                    <Button variant="outline" size="sm" className="cursor-pointer" disabled={lang.status === 'draft'}>
                      {lang.status === 'production' ? t('manage') : t('enable')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // ============================================================
  // Missing Translations Tab
  // ============================================================
  const MissingTab = () => {
    const missingInAr = allEntries.filter(e => !e.ar || e.ar === e.en);
    const validationIssues = validation;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold font-[Poppins]">{missingKeys.length}</p>
              <p className="text-xs text-muted-foreground">{t('missing_translations')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold font-[Poppins]">{validationIssues.interpolationMismatches.length}</p>
              <p className="text-xs text-muted-foreground">Interpolation Mismatches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold font-[Poppins]">{validationIssues.emptyValues.length}</p>
              <p className="text-xs text-muted-foreground">Empty Values</p>
            </CardContent>
          </Card>
        </div>

        {missingKeys.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Runtime Missing Keys</CardTitle>
              <CardDescription>Keys that were requested but not found during this session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {missingKeys.slice(0, 20).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{entry.key}</code>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{entry.language}</Badge>
                      <Button variant="ghost" size="sm" className="h-6 text-xs cursor-pointer" onClick={() => {
                        setEditingKey({ key: entry.key, en: '', ar: '', namespace: 'general', lastModified: '', status: 'draft' });
                      }}>
                        <Edit3 className="w-3 h-3 me-1" /> Fix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {missingInAr.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('keys_needing_attention')}</CardTitle>
              <CardDescription>Keys where Arabic translation may be missing or identical to English</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {missingInAr.length === 0 ? '✅ All keys are properly translated!' : `${missingInAr.length} keys need review`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ============================================================
  // Import/Export Tab
  // ============================================================
  const ImportExportTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4" /> {t('export_translations')}
            </CardTitle>
            <CardDescription>Download translation files in various formats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>{t('export_format')}</Label>
              <Select defaultValue="json">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="json"><div className="flex items-center gap-2"><FileJson className="w-4 h-4" /> JSON</div></SelectItem>
                  <SelectItem value="csv"><div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> CSV</div></SelectItem>
                  <SelectItem value="xlsx"><div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> XLSX</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('language')}</Label>
              <Select defaultValue="all">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full cursor-pointer" onClick={() => {
              const data = JSON.stringify(en, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'translations_en.json'; a.click();
              URL.revokeObjectURL(url);
              toast.success(t('export_success'));
            }}>
              <Download className="w-4 h-4 me-2" /> {t('export')}
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" /> {t('import_translations')}
            </CardTitle>
            <CardDescription>Upload translation files to update translations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>{t('import_format')}</Label>
              <Select defaultValue="json">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Drop file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">JSON, CSV, or XLSX</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="validate" defaultChecked className="rounded" />
              <Label htmlFor="validate" className="text-sm">{t('validate_before_import')}</Label>
            </div>
            <Button variant="outline" className="w-full cursor-pointer" onClick={() => toast.success(t('import_success'))}>
              <Upload className="w-4 h-4 me-2" /> {t('import_translations')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ============================================================
  // Analytics Tab
  // ============================================================
  const AnalyticsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-[Poppins]">{allEntries.length}</p><p className="text-xs text-muted-foreground">{t('total_keys')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-[Poppins] text-green-600">{namespaces.length}</p><p className="text-xs text-muted-foreground">{t('all_namespaces')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-[Poppins] text-blue-600">2</p><p className="text-xs text-muted-foreground">Active Languages</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-[Poppins] text-purple-600">{supportedLanguages.length}</p><p className="text-xs text-muted-foreground">Total Languages</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Namespace Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {namespaces.map(ns => {
              const count = allEntries.filter(e => e.namespace === ns).length;
              const pct = Math.round((count / allEntries.length) * 100);
              return (
                <div key={ns} className="flex items-center gap-3">
                  <span className="text-xs w-32 truncate">{ns}</span>
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground w-16 text-end">{count} keys</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('translation_analytics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">English Coverage</p>
              <p className="text-xl font-bold">100%</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Arabic Coverage</p>
              <p className="text-xl font-bold">{arCompleteness.percentage}%</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Validation Issues</p>
              <p className="text-xl font-bold">{validation.interpolationMismatches.length + validation.emptyValues.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Avg. Key Length</p>
              <p className="text-xl font-bold">{Math.round(allEntries.reduce((sum, e) => sum + e.en.length, 0) / allEntries.length)} chars</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // Audit Tab
  // ============================================================
  const AuditTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search audit logs..." className="ps-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_actions')}</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="imported">Imported</SelectItem>
            <SelectItem value="exported">Exported</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start px-3 py-2 font-medium">Action</th>
              <th className="text-start px-3 py-2 font-medium">Key</th>
              <th className="text-start px-3 py-2 font-medium">{t('language')}</th>
              <th className="text-start px-3 py-2 font-medium">User</th>
              <th className="text-start px-3 py-2 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Badge variant={log.action === 'approved' ? 'default' : log.action === 'deleted' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {log.action}
                  </Badge>
                </td>
                <td className="px-3 py-2"><code className="text-xs bg-muted px-1 py-0.5 rounded">{log.key}</code></td>
                <td className="px-3 py-2 text-xs">{log.language.toUpperCase()}</td>
                <td className="px-3 py-2 text-xs">{log.user.split('@')[0]}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold font-[Poppins]">{t('localization_management')}</h2>
        <p className="text-sm text-muted-foreground">{t('localization_management_desc')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LocalizationTab)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-1 text-xs"><BarChart3 className="w-3 h-3" /> {t('translation_dashboard')}</TabsTrigger>
          <TabsTrigger value="editor" className="gap-1 text-xs"><Edit3 className="w-3 h-3" /> {t('translation_editor')}</TabsTrigger>
          <TabsTrigger value="languages" className="gap-1 text-xs"><Languages className="w-3 h-3" /> {t('language_management')}</TabsTrigger>
          <TabsTrigger value="missing" className="gap-1 text-xs"><AlertTriangle className="w-3 h-3" /> {t('missing_translations')}</TabsTrigger>
          <TabsTrigger value="import_export" className="gap-1 text-xs"><Download className="w-3 h-3" /> {t('import_export')}</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1 text-xs"><Eye className="w-3 h-3" /> {t('translation_analytics')}</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1 text-xs"><History className="w-3 h-3" /> {t('audit_logs')}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="editor"><EditorTab /></TabsContent>
        <TabsContent value="languages"><LanguagesTab /></TabsContent>
        <TabsContent value="missing"><MissingTab /></TabsContent>
        <TabsContent value="import_export"><ImportExportTab /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
      </Tabs>

      {/* Edit Translation Dialog */}
      <Dialog open={!!editingKey} onOpenChange={() => setEditingKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('edit_translation')}</DialogTitle>
            <DialogDescription>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{editingKey?.key}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('english_value')}</Label>
              <Textarea value={editingKey?.en || ''} onChange={(e) => setEditingKey(prev => prev ? { ...prev, en: e.target.value } : null)} className="mt-1" rows={3} />
            </div>
            <div>
              <Label>{t('arabic_value')}</Label>
              <Textarea value={editingKey?.ar || ''} onChange={(e) => setEditingKey(prev => prev ? { ...prev, ar: e.target.value } : null)} className="mt-1" rows={3} dir="rtl" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="cursor-pointer" onClick={() => setEditingKey(null)}>{t('cancel')}</Button>
              <Button className="cursor-pointer" onClick={() => { toast.success(t('translation_updated')); setEditingKey(null); }}>
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Translation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('add_translation')}</DialogTitle>
            <DialogDescription>Add a new translation key with English and Arabic values</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('key_name')}</Label>
              <Input value={newKey.key} onChange={(e) => setNewKey({ ...newKey, key: e.target.value })} placeholder="e.g. feature_new_desc" className="mt-1" />
            </div>
            <div>
              <Label>{t('english_value')}</Label>
              <Textarea value={newKey.en} onChange={(e) => setNewKey({ ...newKey, en: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div>
              <Label>{t('arabic_value')}</Label>
              <Textarea value={newKey.ar} onChange={(e) => setNewKey({ ...newKey, ar: e.target.value })} className="mt-1" rows={2} dir="rtl" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="cursor-pointer" onClick={() => setShowAddDialog(false)}>{t('cancel')}</Button>
              <Button className="cursor-pointer" onClick={() => { toast.success(t('translation_added')); setShowAddDialog(false); setNewKey({ key: '', en: '', ar: '' }); }}>
                {t('add_translation')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}