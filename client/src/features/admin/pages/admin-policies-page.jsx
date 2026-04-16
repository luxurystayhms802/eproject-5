import { useEffect, useMemo, useState } from 'react';
import { FileText, ShieldCheck, Sparkles, Stamp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import { adminInputClassName, adminLabelClassName, adminLabelTextClassName, adminTextAreaClassName } from '@/features/admin/config';
import { validatePoliciesForm } from '@/features/admin/form-utils';
import { useAdminSettings, useUpdateAdminSettings } from '@/features/admin/hooks';
import { buildSettingsPayload, createDefaultSettingsForm, mergeSettingsForm } from '@/features/admin/settings-utils';

export const AdminPoliciesPage = () => {
  const settingsQuery = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [form, setForm] = useState(createDefaultSettingsForm());

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canUpdate = isAdmin || permissions.includes('settings.update');

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(mergeSettingsForm(settingsQuery.data));
    }
  }, [settingsQuery.data]);

  const summary = useMemo(
    () => ({
      cancellationLength: form.cancellationPolicy?.length ?? 0,
      invoiceLength: form.invoiceTerms?.length ?? 0,
      hotelName: form.hotelName,
    }),
    [form],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationMessage = validatePoliciesForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    updateSettings.mutate(buildSettingsPayload(form));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policies & Terms"
        description="Maintain guest-facing policy language, invoice terms, and operational wording in one controlled admin policy desk."
        action={
          canUpdate ? (
            <Button type="submit" form="admin-policies-form" variant="secondary" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving...' : 'Save policies'}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Cancellation copy" value={String(summary.cancellationLength)} description="Characters currently stored in the cancellation policy content block." icon={ShieldCheck} />
        <StatsCard title="Invoice terms" value={String(summary.invoiceLength)} description="Characters currently stored in the payment and invoicing terms block." icon={FileText} />
        <StatsCard title="Brand context" value={summary.hotelName} description="Policy text currently inherits this hotel identity and brand context." icon={Stamp} />
        <StatsCard title="Policy mode" value="Live" description="Admin edits are saved directly into the hotel settings source of truth." icon={Sparkles} />
      </div>

      <form id="admin-policies-form" className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]" onSubmit={handleSubmit}>
        <Card className="space-y-5">
          <div>
            <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">Policy identity</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Keep the basic hotel context aligned while writing operational and guest-facing policy terms.</p>
          </div>

          <div className="grid gap-4">
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Hotel name</span>
              <input className={adminInputClassName} value={form.hotelName} onChange={(event) => setForm((current) => ({ ...current, hotelName: event.target.value }))} />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Brand name</span>
              <input className={adminInputClassName} value={form.brandName} onChange={(event) => setForm((current) => ({ ...current, brandName: event.target.value }))} />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Contact email</span>
              <input className={adminInputClassName} type="email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Contact phone</span>
              <input className={adminInputClassName} value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} />
            </label>
          </div>
        </Card>

        <Card className="space-y-5">
          <AdminToolbar
            title="Policy editor"
            description="Write clear hotel terms for cancellation, billing, and guest-facing clarity across the brand."
          />

          <div className="grid gap-4">
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Cancellation policy</span>
              <textarea
                className={adminTextAreaClassName}
                value={form.cancellationPolicy}
                onChange={(event) => setForm((current) => ({ ...current, cancellationPolicy: event.target.value }))}
              />
            </label>

            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Invoice terms</span>
              <textarea
                className={adminTextAreaClassName}
                value={form.invoiceTerms}
                onChange={(event) => setForm((current) => ({ ...current, invoiceTerms: event.target.value }))}
              />
            </label>

            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Publishing note</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                These terms feed the admin system settings source and can be reused across invoices, project evaluation, and future hotel-facing documentation.
              </p>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};
