import { useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Gift,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Package,
  Search,
  Settings2,
  Shield,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './admin-console.css';

export const ADMIN_SECTIONS = [
  'Dashboard',
  'Analytics',
  'Users',
  'Payments',
  'Withdrawals',
  'Products',
  'Gift Codes',
  'Messages',
  'Transactions',
  'Referrals',
  'Settings',
  'Countries',
  'Admins',
  'Activity Log',
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];
export type AdminSectionStatus = 'ready' | 'empty' | 'loading' | 'error' | 'unavailable';

export interface AdminConsoleRow {
  id: string;
  title: string;
  detail?: string;
  value?: string;
  status?: string;
}

export interface AdminConsoleAction {
  id: string;
  label: string;
  kind?: 'standard' | 'payment-review' | 'withdrawal-review';
  available: boolean;
  unavailableReason?: string;
}

export interface AdminConsoleSectionData {
  status?: AdminSectionStatus;
  description?: string;
  rows?: AdminConsoleRow[];
  actions?: AdminConsoleAction[];
  emptyMessage?: string;
  errorMessage?: string;
}

export interface AdminConsoleProps {
  sections?: Partial<Record<AdminSection, AdminConsoleSectionData>>;
  onAction?: (section: AdminSection, actionId: string) => void;
  onRetry?: (section: AdminSection) => void;
  operatorName?: string;
}

const sectionMeta: Record<AdminSection, { icon: LucideIcon; group: string; description: string }> = {
  Dashboard: { icon: LayoutDashboard, group: 'Workspace', description: 'A clear view of connected operations and their current availability.' },
  Analytics: { icon: BarChart3, group: 'Workspace', description: 'Reporting and trends supplied by connected analytics data.' },
  Users: { icon: Users, group: 'Management', description: 'Member records and account administration.' },
  Payments: { icon: CreditCard, group: 'Finance', description: 'Payment records and review actions.' },
  Withdrawals: { icon: ArrowUpFromLine, group: 'Finance', description: 'Withdrawal requests and review actions.' },
  Products: { icon: Package, group: 'Management', description: 'Product catalogue records.' },
  'Gift Codes': { icon: Gift, group: 'Management', description: 'Gift code inventory and lifecycle.' },
  Messages: { icon: Mail, group: 'Management', description: 'Customer messages and support queue.' },
  Transactions: { icon: ArrowLeftRight, group: 'Finance', description: 'Recorded transaction history.' },
  Referrals: { icon: Users, group: 'Management', description: 'Referral activity and attribution records.' },
  Settings: { icon: Settings2, group: 'System', description: 'Console and store configuration.' },
  Countries: { icon: Globe2, group: 'System', description: 'Country availability and configuration.' },
  Admins: { icon: Shield, group: 'System', description: 'Administrator access and permissions.' },
  'Activity Log': { icon: Activity, group: 'System', description: 'An audit trail of recorded administrative activity.' },
};

const groups = ['Workspace', 'Management', 'Finance', 'System'] as const;

function getStatus(section: AdminSection, sections: AdminConsoleProps['sections']): AdminSectionStatus {
  return sections?.[section]?.status ?? 'unavailable';
}

function statusLabel(status: AdminSectionStatus) {
  return {
    ready: 'Connected',
    empty: 'No records',
    loading: 'Loading',
    error: 'Needs attention',
    unavailable: 'Unavailable',
  }[status];
}

function StatusPill({ status }: { status: AdminSectionStatus }) {
  return (
    <span className={`admin-status admin-status--${status}`}>
      <span className="admin-status-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}

function SectionEmpty({ status, section, data, onRetry }: {
  status: AdminSectionStatus;
  section: AdminSection;
  data?: AdminConsoleSectionData;
  onRetry?: (section: AdminSection) => void;
}) {
  if (status === 'loading') {
    return (
      <div className="admin-skeleton-list" role="status" aria-label={`Loading ${section}`}>
        <span /><span /><span />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="admin-empty admin-empty--error" role="alert">
        <span className="admin-empty-icon"><CircleHelp size={19} /></span>
        <h3>Couldn’t load this section</h3>
        <p>{data?.errorMessage ?? 'The connected source did not return data. Nothing has been changed.'}</p>
        {onRetry && <button type="button" className="admin-text-button" onClick={() => onRetry(section)} data-testid={`button-retry-${section.toLowerCase().replaceAll(' ', '-')}`}>Try again</button>}
      </div>
    );
  }
  const unavailable = status === 'unavailable';
  return (
    <div className="admin-empty">
      <span className="admin-empty-icon">{unavailable ? <LockKeyhole size={19} /> : <ArrowDownToLine size={19} />}</span>
      <h3>{unavailable ? 'Data source unavailable' : 'No records to show'}</h3>
      <p>{unavailable
        ? 'This section has no connected data source yet. No records or totals are being assumed.'
        : data?.emptyMessage ?? 'No records were returned for this section.'}</p>
    </div>
  );
}

function SectionActions({ section, actions, onAction }: {
  section: AdminSection;
  actions?: AdminConsoleAction[];
  onAction?: AdminConsoleProps['onAction'];
}) {
  if (!actions?.length) return null;
  return (
    <div className="admin-actions">
      {actions.map((action) => {
        const financialReview = action.kind === 'payment-review' || action.kind === 'withdrawal-review';
        const actionLabel = action.kind === 'payment-review'
          ? 'Review payment'
          : action.kind === 'withdrawal-review'
            ? 'Review withdrawal'
            : action.label;
        const canRun = action.available && Boolean(onAction);
        return (
          <div className="admin-action-wrap" key={action.id}>
            <button
              type="button"
              className={`admin-action-button ${financialReview ? 'admin-action-button--review' : ''}`}
              disabled={!canRun}
              onClick={() => onAction?.(section, action.id)}
              data-testid={`button-${section.toLowerCase().replaceAll(' ', '-')}-${action.id}`}
              title={!action.available ? action.unavailableReason ?? 'This action is unavailable.' : undefined}
            >
              {financialReview ? <LockKeyhole size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
              {actionLabel}
            </button>
            {financialReview && !canRun && (
              <span className="admin-action-note">{action.unavailableReason ?? 'Review action unavailable. No funds have been moved.'}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecordsTable({ rows }: { rows: AdminConsoleRow[] }) {
  return (
    <div className="admin-records">
      <div className="admin-records-head">
        <span>Record</span>
        <span>Details</span>
        <span>Status</span>
      </div>
      {rows.map((row) => (
        <article className="admin-record" key={row.id} data-testid={`row-admin-record-${row.id}`}>
          <div className="admin-record-name">
            <span className="admin-record-mark" aria-hidden="true">{row.title.slice(0, 1).toUpperCase()}</span>
            <span>{row.title}</span>
          </div>
          <span className="admin-record-detail">{row.detail ?? row.value ?? '—'}</span>
          <span className="admin-record-state">{row.status ?? '—'}</span>
        </article>
      ))}
    </div>
  );
}

function DashboardOverview({ sections, onSelect }: {
  sections: AdminConsoleProps['sections'];
  onSelect: (section: AdminSection) => void;
}) {
  return (
    <div className="admin-dashboard-overview">
      <div className="admin-dashboard-note">
        <span className="admin-dashboard-note-icon"><LockKeyhole size={17} /></span>
        <div>
          <strong>Connected data only</strong>
          <p>Totals, activity, and account records appear only when a verified source is provided.</p>
        </div>
      </div>
      <div className="admin-module-grid">
        {ADMIN_SECTIONS.filter((section) => section !== 'Dashboard').map((section, index) => {
          const Icon = sectionMeta[section].icon;
          const status = getStatus(section, sections);
          const count = sections?.[section]?.rows?.length;
          return (
            <button type="button" className="admin-module" key={section} onClick={() => onSelect(section)} data-testid={`button-dashboard-${section.toLowerCase().replaceAll(' ', '-')}`}>
              <span className="admin-module-icon"><Icon size={16} /></span>
              <span className="admin-module-copy">
                <strong>{section}</strong>
                <small>{count !== undefined && (status === 'ready' || status === 'empty') ? `${count} ${count === 1 ? 'record' : 'records'}` : statusLabel(status)}</small>
              </span>
              <ChevronRight className="admin-module-arrow" size={15} />
              <span className="admin-module-index">{String(index + 1).padStart(2, '0')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminConsole({ sections, onAction, onRetry, operatorName }: AdminConsoleProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('Dashboard');
  const [query, setQuery] = useState('');
  const activeData = sections?.[activeSection];
  const activeStatus = getStatus(activeSection, sections);
  const filteredSections = ADMIN_SECTIONS.filter((section) =>
    section.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const ActiveIcon = sectionMeta[activeSection].icon;
  const readyRows = activeData?.rows ?? [];
  const shouldShowEmpty = activeSection !== 'Dashboard' && (
    activeStatus !== 'ready' || readyRows.length === 0
  );

  return (
    <main className="admin-console" data-testid="page-admin-console">
      <aside className="admin-sidebar" aria-label="Admin console navigation">
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">S</span>
          <span className="admin-brand-copy"><strong>samsung</strong><small>OPERATIONS CONSOLE</small></span>
        </div>
        <div className="admin-sidebar-label">Workspace</div>
        <button
          type="button"
          className={`admin-nav-item ${activeSection === 'Dashboard' ? 'is-active' : ''}`}
          onClick={() => setActiveSection('Dashboard')}
          aria-current={activeSection === 'Dashboard' ? 'page' : undefined}
          data-testid="nav-dashboard"
        >
          <LayoutDashboard size={17} /><span>Dashboard</span><span className="admin-nav-key">01</span>
        </button>
        <label className="admin-search">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a section"
            aria-label="Find a section"
            data-testid="input-admin-section-search"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear section search" data-testid="button-clear-section-search">×</button>}
        </label>
        <nav className="admin-nav-groups" aria-label="Admin sections">
          {groups.map((group) => {
            const groupSections = filteredSections.filter((section) => section !== 'Dashboard' && sectionMeta[section].group === group);
            if (!groupSections.length) return null;
            return (
              <div className="admin-nav-group" key={group}>
                <div className="admin-sidebar-label">{group}</div>
                {groupSections.map((section) => {
                  const Icon = sectionMeta[section].icon;
                  return (
                    <button
                      type="button"
                      key={section}
                      className={`admin-nav-item ${activeSection === section ? 'is-active' : ''}`}
                      onClick={() => setActiveSection(section)}
                      aria-current={activeSection === section ? 'page' : undefined}
                      data-testid={`nav-${section.toLowerCase().replaceAll(' ', '-')}`}
                    >
                      <Icon size={16} /><span>{section}</span><span className="admin-nav-status" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            );
          })}
          {filteredSections.length === 0 && <p className="admin-search-empty">No matching sections.</p>}
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-protection-icon"><Shield size={15} /></span>
          <span><strong>Protected workspace</strong><small>Operations</small></span>
        </div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>samsung</span><ChevronRight size={13} /><span>Operations</span><ChevronRight size={13} /><strong>{activeSection}</strong></div>
          <div className="admin-topbar-right">
            <span className="admin-region"><span className="admin-region-dot" />OPERATIONS</span>
            <button className="admin-icon-button" type="button" title="Notifications unavailable" aria-label="Notifications unavailable" disabled data-testid="button-admin-notifications"><Bell size={17} /></button>
            <span className="admin-operator-avatar" aria-hidden="true">{operatorName?.trim()?.slice(0, 1).toUpperCase() || 'A'}</span>
            <span className="admin-operator-name">{operatorName?.trim() || 'Administrator'}</span>
          </div>
        </header>

        <div className="admin-mobile-brand">
          <span className="admin-brand-mark" aria-hidden="true">S</span>
          <span><strong>samsung</strong><small>Operations console</small></span>
        </div>
        <nav className="admin-mobile-nav" aria-label="Admin section navigation">
          {ADMIN_SECTIONS.map((section) => {
            const Icon = sectionMeta[section].icon;
            return (
              <button
                type="button"
                key={section}
                className={`admin-mobile-nav-item ${activeSection === section ? 'is-active' : ''}`}
                onClick={() => setActiveSection(section)}
                aria-current={activeSection === section ? 'page' : undefined}
                data-testid={`mobile-nav-${section.toLowerCase().replaceAll(' ', '-')}`}
              >
                <Icon size={15} /><span>{section}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-content">
          <div className="admin-page-heading">
            <div>
              <div className="admin-eyebrow"><span className="admin-eyebrow-line" />INTERNAL OPERATIONS</div>
              <h1 data-testid="text-admin-section-title">{activeSection}</h1>
              <p>{activeData?.description ?? sectionMeta[activeSection].description}</p>
            </div>
            <div className="admin-heading-status">
              <StatusPill status={activeStatus} />
              <span className="admin-updated"><span className="admin-pulse" />Source status</span>
            </div>
          </div>

          {activeSection === 'Dashboard' ? (
            <DashboardOverview sections={sections} onSelect={setActiveSection} />
          ) : (
            <section className="admin-panel" aria-label={`${activeSection} content`}>
              <div className="admin-panel-heading">
                <div className="admin-panel-title">
                  <span className="admin-panel-icon"><ActiveIcon size={17} /></span>
                  <div><h2>{activeSection} records</h2><p>Operational data supplied to this console</p></div>
                </div>
                {activeStatus === 'ready' && readyRows.length > 0 && <span className="admin-record-count">{readyRows.length} {readyRows.length === 1 ? 'record' : 'records'}</span>}
              </div>
              <SectionActions section={activeSection} actions={activeData?.actions} onAction={onAction} />
              {shouldShowEmpty ? (
                <SectionEmpty status={activeStatus === 'ready' ? 'empty' : activeStatus} section={activeSection} data={activeData} onRetry={onRetry} />
              ) : (
                <RecordsTable rows={readyRows} />
              )}
              <div className="admin-panel-footer">
                <span><LockKeyhole size={12} /> Actions do not imply a completed payment or transfer.</span>
                <span>DATA SOURCE: {activeStatus === 'ready' ? 'CONNECTED' : statusLabel(activeStatus).toUpperCase()}</span>
              </div>
            </section>
          )}

          <footer className="admin-footer">
            <span>samsung <i>·</i> Internal administration</span>
            <span><Shield size={12} /> Secure operations surface</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default AdminConsole;
