
import React from "react";

interface SimpleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SimpleModal({ open, onClose, title, children }: SimpleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">&times;</button>
        <h2 className="text-lg font-medium mb-2">{title}</h2>
        {children}
      </div>
    </div>
  );
}
