import { useEffect } from "react";
import { X } from "lucide-react";

export function Button({ variant = "default", size = "default", type = "button", className = "", ...props }) {
  return <button type={type} className={`btn v-${variant} s-${size} ${className}`} {...props} />;
}

export function Input({ className = "", ...props }) {
  return <input className={`input ${className}`} {...props} />;
}

export function Dialog({ open, onClose, title, description, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <h2 className="display dialog-title">{title}</h2>
        {description && <p className="dialog-desc">{description}</p>}
        {children}
      </div>
    </div>
  );
}