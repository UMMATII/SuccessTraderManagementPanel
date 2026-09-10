import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Link as LinkIcon, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { uploadAvatar } from '@/lib/image-utils';
import { toast } from 'sonner';

interface AvatarUploadProps {
  value?: string | null;
  name?: string;
  userId?: string;
  onChange: (url: string) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({
  value,
  name = 'User',
  userId,
  onChange,
  label = 'Profile Photo',
  size = 'md',
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(value || '');

  const dimensions = {
    sm: 'w-14 h-14 text-lg',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-28 h-28 text-3xl',
  }[size];

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    // Size limit check (max 10MB raw file)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large. Please select an image under 10MB.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await uploadAvatar(file, userId);
      if (res.error) {
        toast.error(res.error);
      } else if (res.url) {
        onChange(res.url);
        setManualUrl(res.url);
        toast.success('Profile photo uploaded and optimized');
      }
    } catch {
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    onChange('');
    setManualUrl('');
    toast.info('Profile photo removed');
  };

  const handleApplyUrl = () => {
    onChange(manualUrl.trim());
    toast.success('Avatar URL updated');
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Avatar Preview & Drop Container */}
        <div
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative group cursor-pointer rounded-full overflow-hidden border-2 transition-all flex items-center justify-center shrink-0 ${dimensions} ${
            isDragging
              ? 'border-emerald-400 ring-4 ring-emerald-500/20 scale-105'
              : 'border-slate-700 hover:border-emerald-500/60 bg-slate-800'
          }`}
          title="Click to upload or drag and drop image"
        >
          {value ? (
            <img
              src={value}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="font-bold text-slate-300 flex items-center justify-center w-full h-full bg-slate-900 select-none">
              {name ? name.charAt(0).toUpperCase() : <ImageIcon className="w-6 h-6 text-slate-500" />}
            </div>
          )}

          {/* Hover / Processing Overlay */}
          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-center p-1">
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <>
                <Camera className="w-5 h-5 text-emerald-400 mb-0.5" />
                <span className="text-[10px] font-medium leading-tight">Upload</span>
              </>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Actions & Details */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-8"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-emerald-400" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  Choose Image File
                </>
              )}
            </Button>

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-xs h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Remove
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs h-8 text-slate-400 hover:text-slate-200"
            >
              <LinkIcon className="w-3.5 h-3.5 mr-1" />
              {showUrlInput ? 'Hide URL input' : 'Or paste URL'}
            </Button>
          </div>

          <p className="text-[11px] text-slate-400">
            JPG, PNG, or WEBP up to 10MB. Images are automatically cropped and optimized for quick loading.
          </p>
        </div>
      </div>

      {/* Expandable Manual URL input */}
      {showUrlInput && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyUrl}
            className="text-xs h-8"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
