import { useEffect, useRef, useState } from "react";
import { Avatar, type AvatarSize } from "../atoms/Avatar";
import { Icon } from "../atoms/Icon";

export function EditableAvatar({
  src,
  alt,
  size = "xl",
  onUpload,
}: {
  src?: string;
  alt: string;
  size?: AvatarSize;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!viewerOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setViewerOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewerOpen]);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="group relative inline-flex shrink-0" ref={rootRef}>
      <Avatar src={src} alt={alt} size={size} />
      <button
        type="button"
        aria-label="Photo options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        disabled={uploading}
        onClick={() => setMenuOpen((current) => !current)}
        className="absolute inset-0 grid place-items-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-100"
      >
        <Icon className={`text-[20px] ${uploading ? "animate-spin" : ""}`}>
          {uploading ? "progress_activity" : "photo_camera"}
        </Icon>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      {menuOpen && (
        <div
          role="menu"
          className="absolute left-1/2 top-[calc(100%+8px)] z-20 w-44 -translate-x-1/2 overflow-hidden rounded-2xl bg-surface-container-high p-1.5 text-left shadow-panel ring-1 ring-outline-variant/30"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              inputRef.current?.click();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-on-surface hover:bg-surface-container-highest"
          >
            <Icon className="text-[18px] text-on-surface-variant">photo_camera</Icon>
            Update image
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!src}
            onClick={() => {
              setMenuOpen(false);
              setViewerOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-on-surface hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Icon className="text-[18px] text-on-surface-variant">visibility</Icon>
            View image
          </button>
        </div>
      )}

      {viewerOpen && src && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-6" onClick={() => setViewerOpen(false)}>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setViewerOpen(false)}
            className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <Icon className="text-[22px]">close</Icon>
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[80vh] max-w-[min(90vw,480px)] rounded-2xl object-contain shadow-panel"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
