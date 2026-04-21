import { useEffect, useMemo, useState } from 'react';
import { Globe2, Landmark, Mail, Palette, ShieldCheck, TimerReset } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminImageUploader } from '@/features/admin/components/admin-image-uploader';
import { adminInputClassName, adminLabelClassName, adminLabelTextClassName, adminTextAreaClassName } from '@/features/admin/config';
import { validateSettingsForm } from '@/features/admin/form-utils';
import { useAdminSettings, useUpdateAdminSettings } from '@/features/admin/hooks';
import { buildSettingsPayload, createDefaultSettingsForm, mergeSettingsForm } from '@/features/admin/settings-utils';

const checkboxCardClassName = 'flex items-start gap-3 rounded-[18px] border border-[var(--border)] bg-white/78 px-4 py-3 text-sm text-[var(--muted-foreground)]';

const SectionHeading = ({ title, description }) => (
  <div className="space-y-2">
    <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">{title}</h2>
    <p className="text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
  </div>
);

const SettingsToggle = ({ label, description, checked, onChange, name }) => (
  <label className={checkboxCardClassName}>
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-1 h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
    />
    <span className="space-y-1">
      <span className="block text-sm font-semibold text-[var(--primary)]">{label}</span>
      <span className="block text-sm leading-6 text-[var(--muted-foreground)]">{description}</span>
    </span>
  </label>
);

export const AdminSettingsPage = () => {
  const { data, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [form, setForm] = useState(createDefaultSettingsForm());

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canUpdate = isAdmin || permissions.includes('settings.update');

  useEffect(() => {
    if (data) {
      setForm(mergeSettingsForm(data));
    }
  }, [data]);

  const updateNestedField = (section, field, value) => {
    setForm((current) => ({
      ...current,
      [section]: {
        ...(current[section] ?? {}),
        [field]: value,
      },
    }));
  };

  const summary = useMemo(() => {
    const websiteReady = Boolean(
      form.logoUrl &&
        form.websiteSettings?.heroTitle &&
        form.websiteSettings?.heroSubtitle &&
        form.seoSettings?.metaTitle &&
        form.seoSettings?.metaDescription &&
        ((form.websiteSettings?.heroGalleryUrls?.length ?? 0) > 0 || form.websiteSettings?.aboutHeroImageUrl),
    );

    return {
      taxRate: Number(form.taxRules?.[0]?.percentage ?? 0),
      checkWindow: `${form.checkInTime || '--:--'} / ${form.checkOutTime || '--:--'}`,
      bookingMode: form.bookingSettings?.requireApprovalForOnlineBookings ? 'Approval' : 'Instant',
      websiteReadiness: websiteReady ? 'Ready' : 'In Progress',
      alertsMode: form.notificationSettings?.adminBroadcastsEnabled ? 'Controlled' : 'Muted',
    };
  }, [form]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationMessage = validateSettingsForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    updateSettings.mutate(buildSettingsPayload(form));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hotel Settings"
        description="Control website content, SEO, guest communications, booking rules, branding assets, and operational defaults from one clean admin settings studio."
        action={
          canUpdate ? (
            <Button type="submit" form="admin-settings-form" variant="secondary" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving settings...' : 'Save settings'}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <StatsCard title="Primary tax" value={`${summary.taxRate}%`} description="Base room-night tax applied in billing calculations" icon={Landmark} />
        <StatsCard title="Check window" value={summary.checkWindow} description="Current arrival and departure timing used across operations" icon={TimerReset} />
        <StatsCard title="Booking mode" value={summary.bookingMode} description="How online reservations move through approval and confirmation" icon={ShieldCheck} />
        <StatsCard title="Website" value={summary.websiteReadiness} description="How complete the public-site content and SEO profile currently are" icon={Globe2} />
        <StatsCard title="Alerts" value={summary.alertsMode} description="Operational notification routing posture for staff and guests" icon={Mail} />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Link to="/admin/pricing-rules"><Card className="h-full border-2 border-transparent transition-all hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] group"><div className="space-y-2"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)] group-hover:text-[var(--accent-strong)] transition-colors">Pricing desk</p><h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Tax & Pricing Rules</h2><p className="text-sm leading-6 text-[var(--muted-foreground)]">Manage tax structure, stay windows, and pricing governance from a focused specialist page.</p></div></Card></Link>
        <Link to="/admin/policies"><Card className="h-full border-2 border-transparent transition-all hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] group"><div className="space-y-2"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)] group-hover:text-[var(--accent-strong)] transition-colors">Policy desk</p><h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Policies & Terms</h2><p className="text-sm leading-6 text-[var(--muted-foreground)]">Refine guest-facing cancellation, invoice, and compliance copy with a cleaner legal workspace.</p></div></Card></Link>
        <Link to="/admin/account-settings"><Card className="h-full border-2 border-transparent transition-all hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] group"><div className="space-y-2"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)] group-hover:text-[var(--accent-strong)] transition-colors">Identity desk</p><h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">My Profile</h2><p className="text-sm leading-6 text-[var(--muted-foreground)]">Update your personal ownership details, avatar, credentials, and contact identity separately.</p></div></Card></Link>
        <Card className="h-full border-2 border-[var(--accent)] bg-[var(--accent-soft)]"><div className="space-y-2"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">Website studio</p><h2 className="text-[24px] text-[var(--primary)] [font-family:var(--font-display)]">Public-site controls</h2><p className="text-sm leading-6 text-[var(--muted-foreground)]">Use this page to keep website copy, contact channels, brand assets, SEO, and booking switches aligned.</p></div></Card>
      </div>

      <form id="admin-settings-form" className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <Card className="space-y-5">
            <SectionHeading title="Brand, property, and direct contact" description="These details shape the public website, admin shell, and guest-facing communications across the hotel brand." />
            {isLoading ? (
              <div className="grid gap-3">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/70" />)}</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Hotel name</span><input name="hotelName" className={adminInputClassName} value={form.hotelName} onChange={(event) => setForm((current) => ({ ...current, hotelName: event.target.value }))} /></label>
                <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Brand name</span><input name="brandName" className={adminInputClassName} value={form.brandName} onChange={(event) => setForm((current) => ({ ...current, brandName: event.target.value }))} /></label>
                <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Primary contact email</span><input name="contactEmail" className={adminInputClassName} type="email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} /></label>
                <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Primary contact phone</span><input name="contactPhone" className={adminInputClassName} value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} /></label>
                <label className={`${adminLabelClassName} md:col-span-2`}><span className={adminLabelTextClassName}>Property address</span><input name="address" className={adminInputClassName} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></label>
                <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Support email</span><input name="supportEmail" className={adminInputClassName} type="email" value={form.contactChannels?.supportEmail ?? ''} onChange={(event) => updateNestedField('contactChannels', 'supportEmail', event.target.value)} /></label>
                <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Reservations email</span><input name="reservationsEmail" className={adminInputClassName} type="email" value={form.contactChannels?.reservationsEmail ?? ''} onChange={(event) => updateNestedField('contactChannels', 'reservationsEmail', event.target.value)} /></label>
                <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Reservations phone</span><input name="reservationsPhone" className={adminInputClassName} value={form.contactChannels?.reservationsPhone ?? ''} onChange={(event) => updateNestedField('contactChannels', 'reservationsPhone', event.target.value)} /></label>
                <label className={adminLabelClassName}><span className={adminLabelTextClassName}>WhatsApp concierge line</span><input name="whatsappPhone" className={adminInputClassName} value={form.contactChannels?.whatsappPhone ?? ''} onChange={(event) => updateNestedField('contactChannels', 'whatsappPhone', event.target.value)} /></label>
                <AdminImageUploader label="Logo" folder="settings" multiple={false} value={form.logoUrl ? [form.logoUrl] : []} onChange={(images) => setForm((current) => ({ ...current, logoUrl: images[0] ?? null }))} helperText="Upload the main hotel logo used across dashboards and public branding." maxSizeMB={10} />
                <AdminImageUploader label="Favicon" folder="settings" multiple={false} value={form.faviconUrl ? [form.faviconUrl] : []} onChange={(images) => setForm((current) => ({ ...current, faviconUrl: images[0] ?? null }))} helperText="Upload the browser tab icon for a more polished deployed experience." />
                <label className={`${adminLabelClassName} md:col-span-2`}>
                  <span className={adminLabelTextClassName}>Scroll to Top SVG / Image URL</span>
                  <input name="scrollToTopUrl" type="url" className={adminInputClassName} placeholder="https://example.com/icon.svg" value={form.scrollToTopUrl ?? ''} onChange={(event) => setForm((current) => ({ ...current, scrollToTopUrl: event.target.value }))} />
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">Paste a direct link to an SVG icon or transparent PNG. Vectors (SVG) will remain crisp and perfect without any white background boxes.</p>
                </label>
              </div>
            )}
          </Card>

          <Card className="space-y-5">
            <SectionHeading title="Operational defaults and visual identity" description="These values shape billing, arrival timing, theming, and the overall visual consistency of the platform." />
            <div className="grid gap-4 md:grid-cols-2">
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Timezone</span><input name="timezone" className={adminInputClassName} value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} /></label>
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Check-in time</span><input name="checkInTime" type="time" className={adminInputClassName} value={form.checkInTime} onChange={(event) => setForm((current) => ({ ...current, checkInTime: event.target.value }))} /></label>
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Check-out time</span><input name="checkOutTime" type="time" className={adminInputClassName} value={form.checkOutTime} onChange={(event) => setForm((current) => ({ ...current, checkOutTime: event.target.value }))} /></label>
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Night audit time</span><input name="nightAuditTime" type="time" className={adminInputClassName} value={form.nightAuditTime} onChange={(event) => setForm((current) => ({ ...current, nightAuditTime: event.target.value }))} /></label>
              
              <div className="md:col-span-2 space-y-4 rounded-2xl border border-[var(--border)] bg-slate-50/50 p-5 mt-2">
                <h3 className="text-sm font-semibold text-[var(--primary)] mb-2">Automated Actions (Night Audit)</h3>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                    checked={form.nightAuditSettings?.enableAutoExtendOverstay ?? false}
                    onChange={(event) => updateNestedField('nightAuditSettings', 'enableAutoExtendOverstay', event.target.checked)}
                  />
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--primary)]">Auto-Extend Overstays</span>
                    <p className="text-xs text-[var(--muted-foreground)]">Automatically extend reservations by 1 day and add an extra charge if guests do not check out on their departure date.</p>
                  </div>
                </label>
                
                {form.nightAuditSettings?.enableAutoExtendOverstay && (
                  <label className={`${adminLabelClassName} mt-4`}>
                    <span className={adminLabelTextClassName}>Overstay / Late Checkout Penalty (PKR)</span>
                    <input 
                      name="overstayFlatFee" 
                      type="number" 
                      min="0"
                      className={adminInputClassName} 
                      value={form.nightAuditSettings?.overstayFlatFee ?? 0} 
                      onChange={(event) => updateNestedField('nightAuditSettings', 'overstayFlatFee', Number(event.target.value))} 
                    />
                    <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">If set to 0 PKR, the system will automatically charge the room's full original night rate.</p>
                  </label>
                )}
              </div>

              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Primary color</span><input name="primaryColor" className={adminInputClassName} value={form.themeSettings?.primaryColor ?? '#10243f'} onChange={(event) => updateNestedField('themeSettings', 'primaryColor', event.target.value)} /></label>
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Accent color</span><input name="accentColor" className={adminInputClassName} value={form.themeSettings?.accentColor ?? '#b88c4a'} onChange={(event) => updateNestedField('themeSettings', 'accentColor', event.target.value)} /></label>
            </div>
          </Card>
        </div>

        <Card className="space-y-5">
          <SectionHeading title="Website content and SEO" description="Keep the public website persuasive, informative, and brand-consistent with structured content and metadata." />
          <div className="grid gap-4 md:grid-cols-2">
            <label className={`${adminLabelClassName} md:col-span-2`}><span className={adminLabelTextClassName}>Homepage hero title</span><input name="heroTitle" className={adminInputClassName} value={form.websiteSettings?.heroTitle ?? ''} onChange={(event) => updateNestedField('websiteSettings', 'heroTitle', event.target.value)} /></label>
            <label className={`${adminLabelClassName} md:col-span-2`}><span className={adminLabelTextClassName}>Homepage hero subtitle</span><textarea name="heroSubtitle" className={adminTextAreaClassName} value={form.websiteSettings?.heroSubtitle ?? ''} onChange={(event) => updateNestedField('websiteSettings', 'heroSubtitle', event.target.value)} /></label>
            <label className={`${adminLabelClassName} md:col-span-2`}><span className={adminLabelTextClassName}>Footer description</span><textarea name="footerDescription" className={adminTextAreaClassName} value={form.websiteSettings?.footerDescription ?? ''} onChange={(event) => updateNestedField('websiteSettings', 'footerDescription', event.target.value)} /></label>
            <label className={`${adminLabelClassName} md:col-span-2`}><span className={adminLabelTextClassName}>Map embed or location URL</span><input name="mapEmbedUrl" className={adminInputClassName} type="url" placeholder="https://maps.google.com/..." value={form.websiteSettings?.mapEmbedUrl ?? ''} onChange={(event) => updateNestedField('websiteSettings', 'mapEmbedUrl', event.target.value)} /></label>
            <label className={`${adminLabelClassName} md:col-span-2`}><span className={adminLabelTextClassName}>SEO meta title</span><input name="metaTitle" className={adminInputClassName} value={form.seoSettings?.metaTitle ?? ''} onChange={(event) => updateNestedField('seoSettings', 'metaTitle', event.target.value)} /></label>
            <label className={`${adminLabelClassName} md:col-span-2`}><span className={adminLabelTextClassName}>SEO meta description</span><textarea name="metaDescription" className={adminTextAreaClassName} value={form.seoSettings?.metaDescription ?? ''} onChange={(event) => updateNestedField('seoSettings', 'metaDescription', event.target.value)} /></label>
            <label className={`${adminLabelClassName} md:col-span-2`}><span className={adminLabelTextClassName}>SEO keywords</span><input name="metaKeywords" className={adminInputClassName} value={form.seoSettings?.metaKeywords ?? ''} onChange={(event) => updateNestedField('seoSettings', 'metaKeywords', event.target.value)} /></label>
          </div>
        </Card>

        <Card className="space-y-6">
          <SectionHeading title="Home Page Configuration" description="Manage the imagery uniquely associated with the Home page layout." />
          <div className="grid gap-4 md:grid-cols-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/10 p-5">
            <AdminImageUploader label="Homepage hero gallery" folder="settings" multiple value={form.websiteSettings?.heroGalleryUrls ?? []} onChange={(images) => updateNestedField('websiteSettings', 'heroGalleryUrls', images)} helperText="These images lead the main homepage carousel before guests move into rooms and booking." />
            <AdminImageUploader label="Home about primary image" folder="settings" multiple={false} value={form.homePageSettings?.aboutPrimaryImageUrl ? [form.homePageSettings.aboutPrimaryImageUrl] : []} onChange={(images) => updateNestedField('homePageSettings', 'aboutPrimaryImageUrl', images[0] ?? '')} helperText="The large main image used in the Home page 'About' section." />
            <AdminImageUploader label="Home about secondary image" folder="settings" multiple={false} value={form.homePageSettings?.aboutSecondaryImageUrl ? [form.homePageSettings.aboutSecondaryImageUrl] : []} onChange={(images) => updateNestedField('homePageSettings', 'aboutSecondaryImageUrl', images[0] ?? '')} helperText="The smaller overlapping image used in the Home page 'About' section." />
          </div>
        </Card>

        <Card className="space-y-6">
          <SectionHeading title="Amenities Page Configuration" description="Manage the distinct visuals for the curated amenities and services page." />
          <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/10 p-5">
            <AdminImageUploader label="Amenities primary image" folder="settings" multiple={false} value={form.amenitiesPageSettings?.primaryImageUrl ? [form.amenitiesPageSettings.primaryImageUrl] : []} onChange={(images) => updateNestedField('amenitiesPageSettings', 'primaryImageUrl', images[0] ?? '')} helperText="The large main visual highlighting a premium amenity (e.g. Wellness)." />
            <AdminImageUploader label="Amenities secondary image" folder="settings" multiple={false} value={form.amenitiesPageSettings?.secondaryImageUrl ? [form.amenitiesPageSettings.secondaryImageUrl] : []} onChange={(images) => updateNestedField('amenitiesPageSettings', 'secondaryImageUrl', images[0] ?? '')} helperText="The smaller overlapping visual (e.g. Events or Service detail)." />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((num) => {
              const highlightKey = `highlight${num}`;
              return (
                <div key={highlightKey} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/30 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] border-b border-[var(--border)] pb-3">0{num}. Highlight</h4>
                  <label className={adminLabelClassName}>
                    <span className={adminLabelTextClassName}>Title</span>
                    <input className={adminInputClassName} value={form.amenitiesPageSettings?.[highlightKey]?.title ?? ''} onChange={(event) => updateNestedField('amenitiesPageSettings', highlightKey, { ...form.amenitiesPageSettings?.[highlightKey], title: event.target.value })} />
                  </label>
                  <label className={adminLabelClassName}>
                    <span className={adminLabelTextClassName}>Description</span>
                    <textarea className={adminTextAreaClassName} rows={4} value={form.amenitiesPageSettings?.[highlightKey]?.description ?? ''} onChange={(event) => updateNestedField('amenitiesPageSettings', highlightKey, { ...form.amenitiesPageSettings?.[highlightKey], description: event.target.value })} />
                  </label>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-5">
          <SectionHeading title="Website imagery" description="Upload hero and signature section visuals so the public website can feel closer to a real destination-hotel brand without further code edits." />
          <div className="grid gap-4 md:grid-cols-2">
            <AdminImageUploader label="Contact image" folder="settings" multiple={false} value={form.websiteSettings?.contactImageUrl ? [form.websiteSettings.contactImageUrl] : []} onChange={(images) => updateNestedField('websiteSettings', 'contactImageUrl', images[0] ?? '')} helperText="Use a refined hospitality visual for guest inquiry and contact sections." />
            <AdminImageUploader label="FAQ hero image" folder="settings" multiple={false} value={form.websiteSettings?.faqHeroImageUrl ? [form.websiteSettings.faqHeroImageUrl] : []} onChange={(images) => updateNestedField('websiteSettings', 'faqHeroImageUrl', images[0] ?? '')} helperText="A warm, reassuring visual to lead the frequently asked questions center." />
            <AdminImageUploader label="Gallery highlight image" folder="settings" multiple={false} value={form.websiteSettings?.galleryHighlightUrl ? [form.websiteSettings.galleryHighlightUrl] : []} onChange={(images) => updateNestedField('websiteSettings', 'galleryHighlightUrl', images[0] ?? '')} helperText="Use a signature image to lead the Gallery page before guests browse the full visual collection." />
            <AdminImageUploader label="Login hero image" folder="settings" multiple={false} value={form.websiteSettings?.loginHeroImageUrl ? [form.websiteSettings.loginHeroImageUrl] : []} onChange={(images) => updateNestedField('websiteSettings', 'loginHeroImageUrl', images[0] ?? '')} helperText="The cinematic full-screen image anchoring the login and guest access page." />
            <AdminImageUploader label="Register hero image" folder="settings" multiple={false} value={form.websiteSettings?.registerHeroImageUrl ? [form.websiteSettings.registerHeroImageUrl] : []} onChange={(images) => updateNestedField('websiteSettings', 'registerHeroImageUrl', images[0] ?? '')} helperText="The welcoming visual anchoring the guest account creation flow." />
          </div>
        </Card>

        <Card className="space-y-6">
          <SectionHeading title="About Page Configuration" description="Manage all images, texts, and signature experiences for the About page from this single unified panel." />
          
          <div className="grid gap-4 md:grid-cols-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/10 p-5">
             <AdminImageUploader label="About hero image" folder="settings" multiple={false} value={form.websiteSettings?.aboutHeroImageUrl ? [form.websiteSettings.aboutHeroImageUrl] : []} onChange={(images) => updateNestedField('websiteSettings', 'aboutHeroImageUrl', images[0] ?? '')} helperText="The main cover image appearing at the very top of the About page." />
             <AdminImageUploader label="Story image" folder="settings" multiple={false} value={form.websiteSettings?.storyImageUrl ? [form.websiteSettings.storyImageUrl] : []} onChange={(images) => updateNestedField('websiteSettings', 'storyImageUrl', images[0] ?? '')} helperText="The primary visual used in the brand-story section." />
             <AdminImageUploader label="Dining mood image" folder="settings" multiple={false} value={form.websiteSettings?.diningImageUrl ? [form.websiteSettings.diningImageUrl] : []} onChange={(images) => updateNestedField('websiteSettings', 'diningImageUrl', images[0] ?? '')} helperText="The secondary overlapping image next to the story image." />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Dining Experience */}
            <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/30 p-5">
               <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] border-b border-[var(--border)] pb-3">01. Dining</h4>
               <AdminImageUploader label="Experience image" folder="settings" multiple={false} value={form.aboutPageSettings?.diningExperience?.imageUrl ? [form.aboutPageSettings.diningExperience.imageUrl] : []} onChange={(images) => {
                 updateNestedField('aboutPageSettings', 'diningExperience', { ...form.aboutPageSettings?.diningExperience, imageUrl: images[0] ?? '' });
               }} helperText="This image is for the staggered dining experience section. (Recommended size: 1080 x 1350 pixels for perfect 4:5 aspect ratio fit)" />
               <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Title</span><input className={adminInputClassName} value={form.aboutPageSettings?.diningExperience?.title ?? ''} onChange={(event) => updateNestedField('aboutPageSettings', 'diningExperience', { ...form.aboutPageSettings?.diningExperience, title: event.target.value })} /></label>
               <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Description</span><textarea className={adminTextAreaClassName} rows={4} value={form.aboutPageSettings?.diningExperience?.description ?? ''} onChange={(event) => updateNestedField('aboutPageSettings', 'diningExperience', { ...form.aboutPageSettings?.diningExperience, description: event.target.value })} /></label>
            </div>

            {/* Wellness Experience */}
            <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/30 p-5">
               <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] border-b border-[var(--border)] pb-3">02. Wellness</h4>
               <AdminImageUploader label="Wellness image" folder="settings" multiple={false} value={form.aboutPageSettings?.wellnessExperience?.imageUrl ? [form.aboutPageSettings.wellnessExperience.imageUrl] : []} onChange={(images) => {
                 updateNestedField('aboutPageSettings', 'wellnessExperience', { ...form.aboutPageSettings?.wellnessExperience, imageUrl: images[0] ?? '' });
                 updateNestedField('websiteSettings', 'wellnessImageUrl', images[0] ?? '');
               }} helperText="This image will be used for both the About page and other wellness sections. (Recommended size: 1080 x 1350 pixels for perfect 4:5 aspect ratio fit)" />
               <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Title</span><input className={adminInputClassName} value={form.aboutPageSettings?.wellnessExperience?.title ?? ''} onChange={(event) => updateNestedField('aboutPageSettings', 'wellnessExperience', { ...form.aboutPageSettings?.wellnessExperience, title: event.target.value })} /></label>
               <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Description</span><textarea className={adminTextAreaClassName} rows={4} value={form.aboutPageSettings?.wellnessExperience?.description ?? ''} onChange={(event) => updateNestedField('aboutPageSettings', 'wellnessExperience', { ...form.aboutPageSettings?.wellnessExperience, description: event.target.value })} /></label>
            </div>

            {/* Events Experience */}
            <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/30 p-5">
               <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] border-b border-[var(--border)] pb-3">03. Events</h4>
               <AdminImageUploader label="Events image" folder="settings" multiple={false} value={form.aboutPageSettings?.eventsExperience?.imageUrl ? [form.aboutPageSettings.eventsExperience.imageUrl] : []} onChange={(images) => {
                 updateNestedField('aboutPageSettings', 'eventsExperience', { ...form.aboutPageSettings?.eventsExperience, imageUrl: images[0] ?? '' });
                 updateNestedField('websiteSettings', 'eventsImageUrl', images[0] ?? '');
               }} helperText="This image will be used for both the About page and other events sections. (Recommended size: 1080 x 1350 pixels for perfect 4:5 aspect ratio fit)" />
               <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Title</span><input className={adminInputClassName} value={form.aboutPageSettings?.eventsExperience?.title ?? ''} onChange={(event) => updateNestedField('aboutPageSettings', 'eventsExperience', { ...form.aboutPageSettings?.eventsExperience, title: event.target.value })} /></label>
               <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Description</span><textarea className={adminTextAreaClassName} rows={4} value={form.aboutPageSettings?.eventsExperience?.description ?? ''} onChange={(event) => updateNestedField('aboutPageSettings', 'eventsExperience', { ...form.aboutPageSettings?.eventsExperience, description: event.target.value })} /></label>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <Card className="space-y-5">
            <SectionHeading title="Booking and notifications controls" description="Decide how online reservations and operational alerts should behave across public and staff-facing experiences." />
            <div className="grid gap-3">
              <SettingsToggle name="onlineBookingEnabled" label="Enable online booking" description="Allow the public website and guest portal to create online reservations." checked={Boolean(form.bookingSettings?.onlineBookingEnabled)} onChange={(value) => updateNestedField('bookingSettings', 'onlineBookingEnabled', value)} />
              <SettingsToggle name="allowGuestRegistration" label="Allow guest self-registration" description="Let new guests create their own accounts without admin intervention." checked={Boolean(form.bookingSettings?.allowGuestRegistration)} onChange={(value) => updateNestedField('bookingSettings', 'allowGuestRegistration', value)} />
              <SettingsToggle name="showPublicPricing" label="Show public pricing" description="Display room pricing clearly on the public website and booking experience." checked={Boolean(form.bookingSettings?.showPublicPricing)} onChange={(value) => updateNestedField('bookingSettings', 'showPublicPricing', value)} />
              <SettingsToggle name="requireApprovalForOnlineBookings" label="Require approval for online bookings" description="Move online reservations into an approval flow before they become fully confirmed." checked={Boolean(form.bookingSettings?.requireApprovalForOnlineBookings)} onChange={(value) => updateNestedField('bookingSettings', 'requireApprovalForOnlineBookings', value)} />
              <SettingsToggle name="guestBookingAlertsEnabled" label="Guest booking alerts" description="Send guest-facing alerts for reservations, invoices, approvals, and status changes." checked={Boolean(form.notificationSettings?.guestBookingAlertsEnabled)} onChange={(value) => updateNestedField('notificationSettings', 'guestBookingAlertsEnabled', value)} />
              <SettingsToggle name="adminBroadcastsEnabled" label="Admin broadcast controls" description="Keep admin-issued operational alerts available across targeted staff audiences." checked={Boolean(form.notificationSettings?.adminBroadcastsEnabled)} onChange={(value) => updateNestedField('notificationSettings', 'adminBroadcastsEnabled', value)} />
              <SettingsToggle name="housekeepingCheckoutAlertsEnabled" label="Housekeeping checkout alerts" description="Send cleaning-task notifications immediately when a room is checked out." checked={Boolean(form.notificationSettings?.housekeepingCheckoutAlertsEnabled)} onChange={(value) => updateNestedField('notificationSettings', 'housekeepingCheckoutAlertsEnabled', value)} />
              <SettingsToggle name="maintenanceEscalationAlertsEnabled" label="Maintenance escalation alerts" description="Notify maintenance and oversight roles when urgent issues need quick intervention." checked={Boolean(form.notificationSettings?.maintenanceEscalationAlertsEnabled)} onChange={(value) => updateNestedField('notificationSettings', 'maintenanceEscalationAlertsEnabled', value)} />
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionHeading title="Social links and external presence" description="Keep outbound links, search trust signals, and marketing touchpoints aligned with the LuxuryStay brand." />
            <div className="grid gap-4">
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Facebook URL</span><input name="facebookUrl" className={adminInputClassName} type="url" value={form.socialLinks?.facebook ?? ''} onChange={(event) => updateNestedField('socialLinks', 'facebook', event.target.value)} /></label>
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>Instagram URL</span><input name="instagramUrl" className={adminInputClassName} type="url" value={form.socialLinks?.instagram ?? ''} onChange={(event) => updateNestedField('socialLinks', 'instagram', event.target.value)} /></label>
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>LinkedIn URL</span><input name="linkedInUrl" className={adminInputClassName} type="url" value={form.socialLinks?.linkedin ?? ''} onChange={(event) => updateNestedField('socialLinks', 'linkedin', event.target.value)} /></label>
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>X / Twitter URL</span><input name="xUrl" className={adminInputClassName} type="url" value={form.socialLinks?.x ?? ''} onChange={(event) => updateNestedField('socialLinks', 'x', event.target.value)} /></label>
              <label className={adminLabelClassName}><span className={adminLabelTextClassName}>YouTube URL</span><input name="youtubeUrl" className={adminInputClassName} type="url" value={form.socialLinks?.youtube ?? ''} onChange={(event) => updateNestedField('socialLinks', 'youtube', event.target.value)} /></label>
            </div>
          </Card>
        </div>

        <Card className="space-y-5">
          <SectionHeading title="Visual system guidance" description="Use these values to keep the hotel website and admin portal visually consistent, premium, and easy to review." />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full border border-white/70 shadow-[0_8px_18px_rgba(16,36,63,0.08)]" style={{ backgroundColor: form.themeSettings?.primaryColor ?? '#10243f' }} /><div><p className="text-sm font-semibold text-[var(--primary)]">Primary color</p><p className="text-xs text-[var(--muted-foreground)]">{form.themeSettings?.primaryColor ?? '#10243f'}</p></div></div></div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full border border-white/70 shadow-[0_8px_18px_rgba(16,36,63,0.08)]" style={{ backgroundColor: form.themeSettings?.accentColor ?? '#b88c4a' }} /><div><p className="text-sm font-semibold text-[var(--primary)]">Accent color</p><p className="text-xs text-[var(--muted-foreground)]">{form.themeSettings?.accentColor ?? '#b88c4a'}</p></div></div></div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-4"><div className="flex items-center gap-3"><Palette className="h-10 w-10 rounded-full bg-[var(--surface-secondary)] p-2 text-[var(--accent)]" /><div><p className="text-sm font-semibold text-[var(--primary)]">Brand system</p><p className="text-xs text-[var(--muted-foreground)]">Saved to settings and reusable across the platform</p></div></div></div>
          </div>
        </Card>
      </form>
    </div>
  );
};
