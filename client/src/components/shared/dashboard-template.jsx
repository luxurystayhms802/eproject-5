import { BedDouble, Bell, ClipboardList, Hotel } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Card } from '@/components/ui/card';
export const DashboardTemplate = ({ title, description, roleLabel }) => (<div className="space-y-6">
    <PageHeader title={title} description={description}/>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatsCard title="Active Rooms" value="26" description={`${roleLabel} view of room activity`} icon={Hotel}/>
      <StatsCard title="Pending Actions" value="12" description="Prioritized operational items" icon={ClipboardList}/>
      <StatsCard title="Guest Experience" value="4.8/5" description="Recent service quality pulse" icon={Bell}/>
      <StatsCard title="Premium Inventory" value="18" description="High-value room categories online" icon={BedDouble}/>
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--primary)]">Operational overview</h2>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
          This role dashboard is ready for live API integration through TanStack Query, reusable tables, analytics cards,
          and status-driven workflows.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {['Today arrivals', 'Revenue pulse', 'Open issues'].map((item) => (<div key={item} className="rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm text-[var(--muted-foreground)]">
              {item}
            </div>))}
        </div>
      </Card>
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--primary)]">Phase note</h2>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
          The layout, route guarding, and visual language are aligned for a premium hotel platform. Each role
          will be connected to exact data flows in the next phases.
        </p>
      </Card>
    </div>
  </div>);
