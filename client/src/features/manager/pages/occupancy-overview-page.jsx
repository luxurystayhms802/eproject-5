import { useState } from 'react';
import { Building2, Hotel, Percent } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { printManagementReportDocument } from '@/lib/print-documents';
import { managerApi } from '@/features/manager/api';
import { useManagerOccupancy } from '@/features/manager/hooks';
import { downloadManagerReportCsv } from '@/features/manager/report-utils';
export const OccupancyOverviewPage = () => {
    const { data, isLoading } = useManagerOccupancy();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            await downloadManagerReportCsv({ reportKey: 'occupancy', range: {}, exportFn: managerApi.exportReportCsv, label: 'Occupancy report' });
        }
        finally {
            setIsExporting(false);
        }
    };

    const handlePrint = () => {
        printManagementReportDocument({
            brandLabel: 'LuxuryStay Manager',
            title: 'Occupancy Overview',
            subtitle: 'Room utilization and operational occupancy distribution for management review.',
            rangeLabel: 'Live occupancy snapshot',
            metrics: [
                { label: 'Total rooms', value: String(data?.summary.totalRooms ?? 0), helper: 'All active rooms in current stock.' },
                { label: 'Occupied rooms', value: String(data?.summary.occupiedRooms ?? 0), helper: 'Rooms with active in-house guests.' },
                { label: 'Occupancy rate', value: `${data?.summary.occupancyPercentage ?? 0}%`, helper: 'Current occupancy percentage across inventory.' },
                { label: 'Inventory posture', value: (data?.summary.occupancyPercentage ?? 0) >= 70 ? 'High demand' : 'Balanced', helper: 'A quick management reading of current inventory utilization.' },
            ],
            sections: [
                {
                    title: 'Room status mix',
                    copy: 'A clean snapshot of operational room distribution from the manager oversight view.',
                    rows: (data?.distribution ?? []).map((item) => ({
                        label: item.label,
                        value: String(item.value),
                        helper: 'Rooms currently grouped in this state.',
                    })),
                },
            ],
        });
    };
    return (<div className="space-y-6">
      <PageHeader title="Occupancy Overview" description="Live room utilization." action={<div className="flex flex-wrap gap-3">
            <Link to="/manager/reservations">
              <Button variant="secondary">Reservations</Button>
            </Link>
            <Link to="/manager/housekeeping">
              <Button variant="outline">Housekeeping</Button>
            </Link>
          </div>}/>
      <Card className="rounded-[24px] bg-white/78 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--primary)]">Occupancy actions</h2>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">Export or print the live snapshot.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button type="button" variant="secondary" onClick={handlePrint}>
              Print snapshot
            </Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total rooms" value={String(data?.summary.totalRooms ?? 0)} description="Active stock" icon={Hotel}/>
        <StatsCard title="Occupied" value={String(data?.summary.occupiedRooms ?? 0)} description="In-house" icon={Building2}/>
        <StatsCard title="Occupancy rate" value={`${data?.summary.occupancyPercentage ?? 0}%`} description="Current" icon={Percent}/>
      </div>
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--primary)]">Room status mix</h2>
        <div className="h-80">
          {isLoading ? (<div className="h-full animate-pulse rounded-2xl bg-white/70"/>) : data?.distribution?.length ? (<ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.distribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef"/>
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }}/>
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false}/>
                <Tooltip />
                <Bar dataKey="value" fill="#10243f" radius={[10, 10, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>) : (<div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/60 text-sm text-[var(--muted-foreground)]">
              No occupancy distribution data is available yet.
            </div>)}
        </div>
      </Card>
    </div>);
};
