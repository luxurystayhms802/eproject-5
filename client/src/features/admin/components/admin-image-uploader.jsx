import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/features/admin/api';
import { adminLabelClassName, adminLabelTextClassName } from '@/features/admin/config';
import { getApiErrorMessage } from '@/lib/api-error';

export const AdminImageUploader = ({
  label,
  folder,
  value = [],
  onChange,
  multiple = true,
  helperText,
  maxSizeMB = 5,
}) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const images = Array.isArray(value) ? value : [];

  const handleSelectFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const invalidFile = files.find((file) => !String(file.type ?? '').startsWith('image/'));
    if (invalidFile) {
      toast.error('Only image files can be uploaded here.');
      event.target.value = '';
      return;
    }

    const oversizedFile = files.find((file) => Number(file.size ?? 0) > maxSizeMB * 1024 * 1024);
    if (oversizedFile) {
      toast.error(`Each image must be ${maxSizeMB} MB or smaller.`);
      event.target.value = '';
      return;
    }

    if (multiple && images.length + files.length > 8) {
      toast.error('A maximum of 8 images can be stored per upload set.');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', folder);

    setIsUploading(true);
    try {
      const result = await adminApi.uploadImages(formData);
      const nextUrls = multiple ? [...images, ...(result.urls ?? [])] : (result.urls ?? []).slice(0, 1);
      onChange(nextUrls);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to upload image'));
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    onChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={`${adminLabelClassName} md:col-span-2`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className={adminLabelTextClassName}>{label}</span>
          {helperText ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{helperText}</p> : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple={multiple}
          onChange={handleSelectFiles}
        />
        <Button type="button" variant="outline" className="rounded-[16px]" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {isUploading ? 'Uploading...' : 'Upload image'}
        </Button>
      </div>

      {images.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-white/80">
              <div className="aspect-[4/3] overflow-hidden bg-[var(--surface-muted)]">
                <img src={url} alt={`${label} ${index + 1}`} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <p className="truncate text-xs text-[var(--muted-foreground)]">Image {index + 1}</p>
                <Button type="button" variant="outline" className="h-8 rounded-[12px] px-2.5" onClick={() => handleRemoveImage(index)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-[18px] border border-dashed border-[var(--border)] bg-white/64 px-4 py-4 text-sm text-[var(--muted-foreground)]">
          No images uploaded yet.
        </div>
      )}
    </div>
  );
};
