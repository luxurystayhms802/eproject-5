import { useMemo, useState } from 'react';
import { Banknote, CalendarRange } from 'lucide-react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { printManagementReportDocument } from '@/lib/print-documents';
import { ManagerReportToolbar } from '@/features/manager/components/manager-report-toolbar';
import { managerApi } from '@/features/manager/api';
import { useManagerRevenue } from '@/features/manager/hooks';
import { buildManagerReportParams, downloadManagerReportCsv, formatManagerCurrency, getManagerRangeLabel, validateManagerDateRange } from '@/features/manager/report-utils';
export const RevenueReportsPage = () => {
    const [draftRange, setDraftRange] = useState({ from: '', to: '' });
    const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });
    const [isExporting, setIsExporting] = useState(false);
    const queryParams = useMemo(() => buildManagerReportParams(appliedRange), [appliedRange]);
    const { data, isLoading } = useManagerRevenue(queryParams);

    const applyRange = () => {
        const validationMessage = validateManagerDateRange(draftRange);
        if (validationMessage) {
            toast.error(validationMessage);
            return;
        }
        setAppliedRange(draftRange);
        toast.success('Revenue view refreshed.');
    };

    const resetRange = () => {
        setDraftRange({ from: '', to: '' });
        setAppliedRange({ from: '', to: '' });
    };

    const handleExport = async () => {
        const validationMessage = validateManagerDateRange(draftRange);
        if (validationMessage) {
            toast.error(validationMessage);
            return;
        }
        try {
            setIsExporting(true);
            await downloadManagerReportCsv({ reportKey: 'revenue', range: draftRange, exportFn: managerApi.exportReportCsv, label: 'Revenue report' });
        }
        finally {
            setIsExporting(false);
        }
    };

    const handlePrint = () => {
        const validationMessage = validateManagerDateRange(draftRange);
        if (validationMessage) {
            toast.error(validationMessage);
            return;
        }
        printManagementReportDocument({
            brandLabel: 'LuxuryStay Manager',
            title: 'Revenue Reports',
            subtitle: 'Payment capture and revenue movement prepared for hotel-wide management review.',
            rangeLabel: getManagerRangeLabel(draftRange, 'Recent reporting periods'),
            metrics: [
                { label: 'Total revenue', value: formatManagerCurrency(data?.summary.totalRevenue ?? 0), helper: 'Aggregated successful payment totals.' },
                { label: 'Reporting periods', value: String(data?.summary.periods ?? 0), helper: 'Number of periods represented in this report.' },
            ],
            sections: [
                {
                    title: 'Revenue trend',
                    rows: (data?.trend ?? []).map((item) => ({
                        label: item.label,
                        value: formatManagerCurrency(item.value),
                        helper: 'Successful payments captured in this reporting period.',
                    })),
                },
            ],
        });
    };
    return (<div className="space-y-6">
      <PageHeader title="Revenue Reports" description="Payment capture trend and revenue view prepared for presentation and management review." action={<div className="flex flex-wrap gap-3">
            <Link to="/manager/reservations">
              <Button variant="secondary">Reservations</Button>
            </Link>
            <Link to="/manager/feedback">
              <Button variant="outline">Feedback insights</Button>
            </Link>
          </div>}/>
      <ManagerReportToolbar
        title="Revenue actions"
        description="Apply a reporting range, export detailed revenue rows, or print a management-ready finance summary."
        range={draftRange}
        onRangeChange={(field, value) => setDraftRange((current) => ({ ...current, [field]: value }))}
        onApply={applyRange}
        onReset={resetRange}
        onExport={handleExport}
        onPrint={handlePrint}
        isExporting={isExporting}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard title="Total revenue" value={formatManagerCurrency(data?.summary.totalRevenue ?? 0)} description="Aggregated successful payment totals" icon={Banknote}/>
        <StatsCard title="Reporting periods" value={String(data?.summary.periods ?? 0)} description="Number of periods represented in the chart" icon={CalendarRange}/>
      </div>
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--primary)]">Revenue trend</h2>
        <div className="h-80">
          {isLoading ? (<div className="h-full animate-pulse rounded-2xl bg-white/70"/>) : data?.trend?.length ? (<ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef"/>
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }}/>
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }}/>
                <Tooltip formatter={(value) => formatManagerCurrency(Number(value))}/>
                <Line type="monotone" dataKey="value" stroke="#b88c4a" strokeWidth={3} dot={{ r: 4 }}/>
              </LineChart>
            </ResponsiveContainer>) : (<div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/60 text-sm text-[var(--muted-foreground)]">
              No revenue trend data is available yet.
            </div>)}
        </div>
      </Card>
    </div>);
};
