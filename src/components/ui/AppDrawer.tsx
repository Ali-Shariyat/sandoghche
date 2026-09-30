"use client";

import React from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string;
  description?: string;
}

export const AppDrawer: React.FC<AppDrawerProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxHeight = "max-h-[92dvh]",
  description,
}) => {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300" />
        <Drawer.Content
          className={`fixed inset-x-0 bottom-0 z-50 flex flex-col bg-slate-900 border-t border-slate-800 rounded-t-[2.2rem] shadow-2xl focus:outline-none max-w-lg mx-auto ${maxHeight}`}
          dir="rtl"
        >
          {/* Grabber handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-700 mt-3 mb-2" />

          {/* Header */}
          {(title || icon) && (
            <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {icon && <div className="shrink-0">{icon}</div>}
                <div className="min-w-0">
                  <Drawer.Title className="text-base sm:text-lg font-bold text-white truncate">
                    {title}
                  </Drawer.Title>
                  {description && (
                    <Drawer.Description className="text-xs text-slate-400 truncate">
                      {description}
                    </Drawer.Description>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body content with smooth scroll */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
