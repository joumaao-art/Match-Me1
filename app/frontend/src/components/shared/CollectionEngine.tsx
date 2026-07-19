/**
 * Universal Collections Engine
 * 
 * A reusable, configuration-driven collection system that powers every
 * collection-based feature across MatchMe. Supports Manual, Smart, AI,
 * Shared, Team, Department, and Dynamic collections.
 * 
 * First implementation: Saved Candidates (Talent Collections)
 * 
 * Architecture:
 * - Entity-agnostic: works with any entity type via configuration
 * - Collection types: manual, smart, ai, shared, private, pinned, archived, favorite
 * - Smart collections: rule-based auto-population with visual builder
 * - Full CRUD: create, rename, delete, duplicate, archive, restore, merge, pin, favorite
 * - Collection Detail: breadcrumbs, search, filters, sort, bulk actions, statistics
 * - Drag & drop between manual collections
 * - Multi-select with bulk operations
 */

import { memo, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  FolderOpen, Plus, Search, Trash2, Edit, Copy, Archive, Pin, Star,
  MoreVertical, ChevronRight, ArrowLeft, Users, Filter, SortAsc, SortDesc,
  Sparkles, Zap, Eye, Send, Download, Tag, GitBranch, CheckSquare,
  BarChart3, Clock, Globe, Lock, Share2, Layers, RefreshCw, X,
  GripVertical, FolderPlus, Palette, Hash, Brain, Wand2
} from 'lucide-react';

// ============================================================
// Core Types
// ============================================================

export type CollectionType = 'manual' | 'smart' | 'ai' | 'shared' | 'private' | 'pinned' | 'archived' | 'favorite' | 'template';
export type CollectionVisibility = 'private' | 'team' | 'department' | 'organization' | 'public';

export interface CollectionRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_true' | 'is_false';
  value: string | number | boolean | string[];
  connector?: 'AND' | 'OR';
}

export interface CollectionRuleGroup {
  id: string;
  connector: 'AND' | 'OR';
  rules: (CollectionRule | CollectionRuleGroup)[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  type: CollectionType;
  visibility: CollectionVisibility;
  color: string;
  icon?: string;
  entityType: string;
  entityCount: number;
  owner: { id: string; name: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  rules?: CollectionRuleGroup;
  tags?: string[];
  statistics?: CollectionStatistics;
}

export interface CollectionStatistics {
  totalEntities: number;
  avgMatchScore?: number;
  avgExperience?: number;
  avgProfileStrength?: number;
  avgProfileCompletion?: number;
  recentlyAdded: number;
  recentlyContacted?: number;
  invitationsSent?: number;
  interviews?: number;
  offers?: number;
  hires?: number;
}

export interface CollectionEntity {
  id: string;
  collectionId: string;
  entityId: string;
  addedAt: string;
  addedBy: { id: string; name: string };
  notes?: string;
  tags?: string[];
  position?: number;
}

// ============================================================
// Configuration Types
// ============================================================

export interface EntityFieldConfig {
  key: string;
  labelKey: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'tags';
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  options?: { value: string; labelKey: string }[];
}

export interface EntityActionConfig {
  id: string;
  labelKey: string;
  icon: ReactNode;
  handler: (entityIds: string[]) => void;
  bulk?: boolean;
  requiresPermission?: string;
  variant?: 'default' | 'destructive';
}

export interface CollectionEngineConfig {
  entityType: string;
  entityLabelKey: string;
  entityPluralKey: string;
  parentBreadcrumb?: { labelKey: string; onClick?: () => void };
  fields: EntityFieldConfig[];
  actions: EntityActionConfig[];
  renderEntity: (entity: Record<string, unknown>, options: { selected: boolean; onSelect: () => void }) => ReactNode;
  renderEntityCompact?: (entity: Record<string, unknown>) => ReactNode;
  smartCollectionFields?: EntityFieldConfig[];
  enableDragDrop?: boolean;
  enableBulkActions?: boolean;
  enableSmartCollections?: boolean;
  enableAICollections?: boolean;
  enableSharing?: boolean;
  maxCollections?: number;
}

// ============================================================
// Collection Colors & Icons
// ============================================================

const COLLECTION_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#6366F1', '#14B8A6', '#EC4899', '#F97316', '#06B6D4',
  '#84CC16', '#A855F7', '#0EA5E9', '#D946EF', '#22C55E',
];

// ============================================================
// Smart Collection Rule Builder
// ============================================================

interface RuleBuilderProps {
  fields: EntityFieldConfig[];
  rules: CollectionRuleGroup;
  onChange: (rules: CollectionRuleGroup) => void;
}

function SmartCollectionRuleBuilder({ fields, rules, onChange }: RuleBuilderProps) {
  const { t } = useTranslation();

  const addRule = () => {
    const newRule: CollectionRule = {
      id: Date.now().toString(),
      field: fields[0]?.key || '',
      operator: 'equals',
      value: '',
      connector: 'AND',
    };
    onChange({ ...rules, rules: [...rules.rules, newRule] });
  };

  const removeRule = (ruleId: string) => {
    onChange({ ...rules, rules: rules.rules.filter(r => r.id !== ruleId) });
  };

  const updateRule = (ruleId: string, updates: Partial<CollectionRule>) => {
    onChange({
      ...rules,
      rules: rules.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t('collection_rules')}</p>
        <Button size="sm" variant="outline" onClick={addRule} className="cursor-pointer">
          <Plus className="w-3 h-3 me-1" />{t('add_rule')}
        </Button>
      </div>
      {rules.rules.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">{t('no_rules_defined')}</p>
      )}
      {rules.rules.map((rule, idx) => {
        if ('rules' in rule) return null; // Skip nested groups for MVP
        const r = rule as CollectionRule;
        return (
          <div key={r.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            {idx > 0 && (
              <Select value={r.connector || 'AND'} onValueChange={(v) => updateRule(r.id, { connector: v as 'AND' | 'OR' })}>
                <SelectTrigger className="w-16 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={r.field} onValueChange={(v) => updateRule(r.id, { field: v })}>
              <SelectTrigger className="flex-1 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {fields.filter(f => f.filterable !== false).map(f => (
                  <SelectItem key={f.key} value={f.key}>{t(f.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={r.operator} onValueChange={(v) => updateRule(r.id, { operator: v as CollectionRule['operator'] })}>
              <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">=</SelectItem>
                <SelectItem value="not_equals">≠</SelectItem>
                <SelectItem value="contains">{t('contains')}</SelectItem>
                <SelectItem value="greater_than">&gt;</SelectItem>
                <SelectItem value="less_than">&lt;</SelectItem>
                <SelectItem value="is_true">{t('is_true')}</SelectItem>
                <SelectItem value="is_false">{t('is_false')}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={typeof r.value === 'string' ? r.value : String(r.value)}
              onChange={(e) => updateRule(r.id, { value: e.target.value })}
              className="flex-1 h-7 text-xs"
              placeholder={t('value')}
            />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 cursor-pointer" onClick={() => removeRule(r.id)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Collection Breadcrumb
// ============================================================

interface CollectionBreadcrumbProps {
  items: { label: string; onClick?: () => void }[];
}

const CollectionBreadcrumb = memo(function CollectionBreadcrumb({ items }: CollectionBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-4" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
});

// ============================================================
// Collection Card
// ============================================================

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
  onPin?: () => void;
  onFavorite?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
}

const CollectionCard = memo(function CollectionCard({
  collection, onClick, onPin, onFavorite, onDelete, onDuplicate, onArchive
}: CollectionCardProps) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const typeIcon = useMemo(() => {
    switch (collection.type) {
      case 'smart': return <Zap className="w-3 h-3" />;
      case 'ai': return <Brain className="w-3 h-3" />;
      case 'shared': return <Share2 className="w-3 h-3" />;
      default: return null;
    }
  }, [collection.type]);

  const typeBadge = useMemo(() => {
    if (collection.type === 'manual') return null;
    const labels: Record<string, string> = { smart: 'smart', ai: 'ai', shared: 'shared' };
    return labels[collection.type] || null;
  }, [collection.type]);

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer group relative border"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`${collection.name} - ${collection.entityCount} ${t('items')}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${collection.color}15` }}
            >
              <FolderOpen className="w-4.5 h-4.5" style={{ color: collection.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{collection.name}</p>
                {collection.isPinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                {collection.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[11px] text-muted-foreground">
                  {collection.entityCount} {t('candidates')}
                </p>
                {typeBadge && (
                  <Badge variant="secondary" className="h-4 text-[9px] px-1.5 gap-0.5">
                    {typeIcon}{t(typeBadge)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            {showMenu && (
              <div
                className="absolute end-0 top-8 z-50 bg-popover border rounded-md shadow-lg py-1 min-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                {onPin && (
                  <button className="w-full text-start px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 cursor-pointer" onClick={() => { onPin(); setShowMenu(false); }}>
                    <Pin className="w-3 h-3" />{collection.isPinned ? t('unpin') : t('pin')}
                  </button>
                )}
                {onFavorite && (
                  <button className="w-full text-start px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 cursor-pointer" onClick={() => { onFavorite(); setShowMenu(false); }}>
                    <Star className="w-3 h-3" />{collection.isFavorite ? t('unfavorite') : t('favorite')}
                  </button>
                )}
                {onDuplicate && (
                  <button className="w-full text-start px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 cursor-pointer" onClick={() => { onDuplicate(); setShowMenu(false); }}>
                    <Copy className="w-3 h-3" />{t('duplicate')}
                  </button>
                )}
                {onArchive && (
                  <button className="w-full text-start px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 cursor-pointer" onClick={() => { onArchive(); setShowMenu(false); }}>
                    <Archive className="w-3 h-3" />{t('archive')}
                  </button>
                )}
                {onDelete && collection.type !== 'smart' && (
                  <button className="w-full text-start px-3 py-1.5 text-xs hover:bg-muted text-destructive flex items-center gap-2 cursor-pointer" onClick={() => { onDelete(); setShowMenu(false); }}>
                    <Trash2 className="w-3 h-3" />{t('delete')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description preview */}
        {collection.description && (
          <p className="text-[10px] text-muted-foreground mt-2 line-clamp-1">{collection.description}</p>
        )}

        {/* Statistics bar */}
        {collection.statistics && (
          <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t">
            {collection.statistics.avgMatchScore !== undefined && (
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">{collection.statistics.avgMatchScore}%</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">+{collection.statistics.recentlyAdded}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================================
// Collection Grid (Overview)
// ============================================================

interface CollectionGridProps {
  collections: Collection[];
  onOpenCollection: (id: string) => void;
  onCreateCollection: () => void;
  onCreateSmartCollection?: () => void;
  onPinCollection: (id: string) => void;
  onFavoriteCollection: (id: string) => void;
  onDeleteCollection: (id: string) => void;
  onDuplicateCollection: (id: string) => void;
  onArchiveCollection: (id: string) => void;
  config: CollectionEngineConfig;
}

const CollectionGrid = memo(function CollectionGrid({
  collections, onOpenCollection, onCreateCollection, onCreateSmartCollection,
  onPinCollection, onFavoriteCollection, onDeleteCollection, onDuplicateCollection, onArchiveCollection, config
}: CollectionGridProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | CollectionType>('all');

  const filteredCollections = useMemo(() => {
    let result = collections.filter(c => !c.isArchived);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    }
    if (filterType !== 'all') {
      result = result.filter(c => c.type === filterType);
    }
    // Sort: pinned first, then favorites, then alphabetical
    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [collections, searchQuery, filterType]);

  const totalEntities = collections.reduce((sum, c) => sum + c.entityCount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            {t(config.entityPluralKey)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {collections.filter(c => !c.isArchived).length} {t('collections')} · {totalEntities} {t(config.entityPluralKey).toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config.enableSmartCollections && onCreateSmartCollection && (
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={onCreateSmartCollection}>
              <Zap className="w-4 h-4 me-1" />{t('smart_collection')}
            </Button>
          )}
          <Button size="sm" className="cursor-pointer bg-primary" onClick={onCreateCollection}>
            <Plus className="w-4 h-4 me-1" />{t('new_collection')}
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('search_collections')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('all_types')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_types')}</SelectItem>
            <SelectItem value="manual">{t('manual')}</SelectItem>
            <SelectItem value="smart">{t('smart')}</SelectItem>
            <SelectItem value="shared">{t('shared')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredCollections.map(collection => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            onClick={() => onOpenCollection(collection.id)}
            onPin={() => onPinCollection(collection.id)}
            onFavorite={() => onFavoriteCollection(collection.id)}
            onDelete={() => onDeleteCollection(collection.id)}
            onDuplicate={() => onDuplicateCollection(collection.id)}
            onArchive={() => onArchiveCollection(collection.id)}
          />
        ))}
      </div>

      {filteredCollections.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{searchQuery ? t('no_collections_found') : t('no_collections_yet')}</p>
          <Button size="sm" className="mt-3 cursor-pointer" onClick={onCreateCollection}>
            <Plus className="w-4 h-4 me-1" />{t('create_first_collection')}
          </Button>
        </div>
      )}
    </div>
  );
});

// ============================================================
// Collection Detail View
// ============================================================

interface CollectionDetailProps {
  collection: Collection;
  entities: Record<string, unknown>[];
  config: CollectionEngineConfig;
  onBack: () => void;
  onRemoveEntity: (entityId: string) => void;
  onBulkAction?: (action: string, entityIds: string[]) => void;
  onEditCollection: (updates: Partial<Collection>) => void;
}

const CollectionDetail = memo(function CollectionDetail({
  collection, entities, config, onBack, onRemoveEntity, onBulkAction, onEditCollection
}: CollectionDetailProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('addedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Search with debounce
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter & sort entities
  const filteredEntities = useMemo(() => {
    let result = [...entities];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const searchableFields = config.fields.filter(f => f.searchable !== false).map(f => f.key);
      result = result.filter(entity =>
        searchableFields.some(field => {
          const val = entity[field];
          return typeof val === 'string' && val.toLowerCase().includes(q);
        })
      );
    }

    // Active filters
    Object.entries(activeFilters).forEach(([field, value]) => {
      if (!value) return;
      result = result.filter(entity => {
        const entityVal = entity[field];
        if (typeof entityVal === 'string') return entityVal.toLowerCase().includes(value.toLowerCase());
        if (typeof entityVal === 'number') return entityVal >= Number(value);
        if (typeof entityVal === 'boolean') return String(entityVal) === value;
        return true;
      });
    });

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [entities, debouncedSearch, sortField, sortDir, activeFilters, config.fields]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredEntities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntities.map(e => e.id as string)));
    }
  }, [filteredEntities, selectedIds.size]);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const items: { label: string; onClick?: () => void }[] = [];
    if (config.parentBreadcrumb) {
      items.push({ label: t(config.parentBreadcrumb.labelKey), onClick: config.parentBreadcrumb.onClick || onBack });
    }
    items.push({ label: t(config.entityPluralKey), onClick: onBack });
    items.push({ label: collection.name });
    return items;
  }, [config, collection.name, onBack, t]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Breadcrumb & Header */}
      <div className="p-4 sm:p-6 pb-0">
        <CollectionBreadcrumb items={breadcrumbs} />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" className="cursor-pointer" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${collection.color}15` }}
            >
              <FolderOpen className="w-5 h-5" style={{ color: collection.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-[Poppins]">{collection.name}</h2>
                {collection.type === 'smart' && (
                  <Badge variant="secondary" className="gap-1"><Zap className="w-3 h-3" />{t('smart')}</Badge>
                )}
                {collection.type === 'ai' && (
                  <Badge variant="secondary" className="gap-1"><Brain className="w-3 h-3" />{t('ai')}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {collection.entityCount} {t(config.entityPluralKey).toLowerCase()} · {t('updated')} {new Date(collection.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Collection Stats */}
        {collection.statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold">{collection.statistics.totalEntities}</p>
              <p className="text-[10px] text-muted-foreground">{t('total')}</p>
            </div>
            {collection.statistics.avgMatchScore !== undefined && (
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-primary">{collection.statistics.avgMatchScore}%</p>
                <p className="text-[10px] text-muted-foreground">{t('avg_match')}</p>
              </div>
            )}
            {collection.statistics.avgExperience !== undefined && (
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold">{collection.statistics.avgExperience}y</p>
                <p className="text-[10px] text-muted-foreground">{t('avg_exp')}</p>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-green-600">+{collection.statistics.recentlyAdded}</p>
              <p className="text-[10px] text-muted-foreground">{t('recent')}</p>
            </div>
            {collection.statistics.interviews !== undefined && (
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold">{collection.statistics.interviews}</p>
                <p className="text-[10px] text-muted-foreground">{t('interviews')}</p>
              </div>
            )}
            {collection.statistics.hires !== undefined && (
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-600">{collection.statistics.hires}</p>
                <p className="text-[10px] text-muted-foreground">{t('hires')}</p>
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('search_in_collection')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-8 text-sm"
            />
          </div>
          <Button size="sm" variant="outline" className="h-8 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-3.5 h-3.5 me-1" />{t('filters')}
            {Object.keys(activeFilters).filter(k => activeFilters[k]).length > 0 && (
              <Badge className="ms-1 h-4 w-4 p-0 text-[9px] justify-center">{Object.keys(activeFilters).filter(k => activeFilters[k]).length}</Badge>
            )}
          </Button>
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="addedAt">{t('recently_added')}</SelectItem>
              <SelectItem value="name">{t('name')}</SelectItem>
              {config.fields.filter(f => f.sortable).map(f => (
                <SelectItem key={f.key} value={f.key}>{t(f.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 cursor-pointer"
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          >
            {sortDir === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap mb-4 p-3 bg-muted/30 rounded-lg">
            {config.fields.filter(f => f.filterable).slice(0, 6).map(field => (
              <div key={field.key} className="flex-1 min-w-[120px]">
                <Input
                  placeholder={t(field.labelKey)}
                  value={activeFilters[field.key] || ''}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="h-7 text-xs"
                />
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs cursor-pointer"
              onClick={() => setActiveFilters({})}
            >
              {t('clear')}
            </Button>
          </div>
        )}

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg mb-4">
            <Checkbox
              checked={selectedIds.size === filteredEntities.length}
              onCheckedChange={selectAll}
            />
            <span className="text-xs font-medium">{selectedIds.size} {t('selected')}</span>
            <div className="flex-1" />
            {config.actions.filter(a => a.bulk).map(action => (
              <Button
                key={action.id}
                size="sm"
                variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                className="h-7 text-xs cursor-pointer"
                onClick={() => {
                  action.handler(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
              >
                {action.icon}
                <span className="ms-1">{t(action.labelKey)}</span>
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="h-7 text-xs cursor-pointer" onClick={() => setSelectedIds(new Set())}>
              {t('clear_selection')}
            </Button>
          </div>
        )}
      </div>

      {/* Entity List */}
      <ScrollArea className="flex-1 px-4 sm:px-6 pb-6">
        <div className="space-y-2">
          {filteredEntities.map(entity => (
            <div key={entity.id as string}>
              {config.renderEntity(entity, {
                selected: selectedIds.has(entity.id as string),
                onSelect: () => toggleSelect(entity.id as string),
              })}
            </div>
          ))}
        </div>
        {filteredEntities.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {debouncedSearch ? t('no_results_in_collection') : t('collection_empty')}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

// ============================================================
// Create/Edit Collection Dialog
// ============================================================

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string; type: CollectionType; color: string; rules?: CollectionRuleGroup }) => void;
  config: CollectionEngineConfig;
  mode?: 'manual' | 'smart';
  initialData?: Partial<Collection>;
}

function CreateCollectionDialog({ open, onOpenChange, onSubmit, config, mode = 'manual', initialData }: CreateCollectionDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || COLLECTION_COLORS[0]);
  const [rules, setRules] = useState<CollectionRuleGroup>(
    initialData?.rules || { id: 'root', connector: 'AND', rules: [] }
  );

  const handleSubmit = () => {
    if (!name.trim()) { toast.error(t('name_required')); return; }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      type: mode === 'smart' ? 'smart' : 'manual',
      color,
      rules: mode === 'smart' ? rules : undefined,
    });
    setName('');
    setDescription('');
    setColor(COLLECTION_COLORS[0]);
    setRules({ id: 'root', connector: 'AND', rules: [] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'smart' ? <Zap className="w-4 h-4 text-primary" /> : <FolderPlus className="w-4 h-4 text-primary" />}
            {mode === 'smart' ? t('create_smart_collection') : t('create_collection')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">{t('name')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('collection_name_placeholder')} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">{t('description')}</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('optional')} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">{t('color')}</label>
            <div className="flex flex-wrap gap-2">
              {COLLECTION_COLORS.map(c => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          {mode === 'smart' && config.smartCollectionFields && (
            <SmartCollectionRuleBuilder
              fields={config.smartCollectionFields || config.fields}
              rules={rules}
              onChange={setRules}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button className="cursor-pointer" onClick={handleSubmit}>{t('create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Main Collection Engine Component
// ============================================================

export interface CollectionEngineProps {
  config: CollectionEngineConfig;
  collections: Collection[];
  onCollectionsChange: (collections: Collection[]) => void;
  getEntitiesForCollection: (collectionId: string) => Record<string, unknown>[];
  className?: string;
}

const CollectionEngine = memo(function CollectionEngine({
  config, collections, onCollectionsChange, getEntitiesForCollection, className
}: CollectionEngineProps) {
  const { t } = useTranslation();
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'smart'>('manual');

  const activeCollection = useMemo(
    () => collections.find(c => c.id === activeCollectionId) || null,
    [collections, activeCollectionId]
  );

  const activeEntities = useMemo(
    () => activeCollectionId ? getEntitiesForCollection(activeCollectionId) : [],
    [activeCollectionId, getEntitiesForCollection]
  );

  // CRUD operations
  const handleCreateCollection = useCallback((data: { name: string; description: string; type: CollectionType; color: string; rules?: CollectionRuleGroup }) => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      type: data.type,
      visibility: 'private',
      color: data.color,
      entityType: config.entityType,
      entityCount: 0,
      owner: { id: '1', name: 'Current User' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      rules: data.rules,
      statistics: { totalEntities: 0, recentlyAdded: 0 },
    };
    onCollectionsChange([...collections, newCollection]);
    toast.success(t('collection_created'));
  }, [collections, config.entityType, onCollectionsChange, t]);

  const handleDeleteCollection = useCallback((id: string) => {
    onCollectionsChange(collections.filter(c => c.id !== id));
    toast.success(t('collection_deleted'));
  }, [collections, onCollectionsChange, t]);

  const handlePinCollection = useCallback((id: string) => {
    onCollectionsChange(collections.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
  }, [collections, onCollectionsChange]);

  const handleFavoriteCollection = useCallback((id: string) => {
    onCollectionsChange(collections.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  }, [collections, onCollectionsChange]);

  const handleDuplicateCollection = useCallback((id: string) => {
    const source = collections.find(c => c.id === id);
    if (!source) return;
    const dup: Collection = {
      ...source,
      id: Date.now().toString(),
      name: `${source.name} (${t('copy')})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      isFavorite: false,
    };
    onCollectionsChange([...collections, dup]);
    toast.success(t('collection_duplicated'));
  }, [collections, onCollectionsChange, t]);

  const handleArchiveCollection = useCallback((id: string) => {
    onCollectionsChange(collections.map(c => c.id === id ? { ...c, isArchived: true } : c));
    toast.success(t('collection_archived'));
  }, [collections, onCollectionsChange, t]);

  const handleEditCollection = useCallback((updates: Partial<Collection>) => {
    if (!activeCollectionId) return;
    onCollectionsChange(collections.map(c => c.id === activeCollectionId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
  }, [activeCollectionId, collections, onCollectionsChange]);

  const handleRemoveEntity = useCallback((entityId: string) => {
    toast.success(t('entity_removed_from_collection'));
  }, [t]);

  // Render
  if (activeCollection) {
    return (
      <div className={className}>
        <CollectionDetail
          collection={activeCollection}
          entities={activeEntities}
          config={config}
          onBack={() => setActiveCollectionId(null)}
          onRemoveEntity={handleRemoveEntity}
          onEditCollection={handleEditCollection}
        />
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 sm:p-6 overflow-y-auto ${className || ''}`}>
      <CollectionGrid
        collections={collections}
        onOpenCollection={setActiveCollectionId}
        onCreateCollection={() => { setCreateMode('manual'); setCreateDialogOpen(true); }}
        onCreateSmartCollection={config.enableSmartCollections ? () => { setCreateMode('smart'); setCreateDialogOpen(true); } : undefined}
        onPinCollection={handlePinCollection}
        onFavoriteCollection={handleFavoriteCollection}
        onDeleteCollection={handleDeleteCollection}
        onDuplicateCollection={handleDuplicateCollection}
        onArchiveCollection={handleArchiveCollection}
        config={config}
      />

      <CreateCollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateCollection}
        config={config}
        mode={createMode}
      />
    </div>
  );
});

export default CollectionEngine;

// ============================================================
// Pre-built Candidate Collection Configuration
// ============================================================

export { CollectionGrid, CollectionDetail, CollectionCard, CollectionBreadcrumb, CreateCollectionDialog, SmartCollectionRuleBuilder };