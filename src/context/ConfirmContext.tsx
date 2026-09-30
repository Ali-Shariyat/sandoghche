"use client";

import React, { createContext, useContext, useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, HelpCircle } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
    confirmText: "تأیید",
    cancelText: "انصراف",
    isDanger: false,
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions({
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText || "تأیید",
      cancelText: opts.cancelText || "انصراف",
      isDanger: opts.isDanger !== undefined ? opts.isDanger : true,
    });
    setIsOpen(true);

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200 focus:outline-none"
            dir="rtl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`p-2.5 rounded-2xl shrink-0 ${
                  options.isDanger
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {options.isDanger ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </div>
              <Dialog.Title className="font-bold text-base text-white">
                {options.title}
              </Dialog.Title>
            </div>

            <Dialog.Description className="text-xs text-slate-300 leading-relaxed mb-5">
              {options.message}
            </Dialog.Description>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors active:scale-95"
              >
                {options.cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition-all active:scale-95 ${
                  options.isDanger
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
                }`}
              >
                {options.confirmText}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context;
}
