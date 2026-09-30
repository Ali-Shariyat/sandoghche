"use client";

import React from "react";
import {
  CreditCard,
  Users,
  FileText,
  ArrowLeftRight,
  Settings,
  Home,
} from "lucide-react";

export type NavTab = "home" | "cards" | "people" | "notes" | "debts" | "settings";

interface AppNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  cardsCount: number;
  peopleCount: number;
  notesCount: number;
  debtsCount: number;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  activeTab,
  onTabChange,
  cardsCount,
  peopleCount,
  notesCount,
  debtsCount,
}) => {
  const navItems = [
    {
      id: "home" as NavTab,
      label: "داشبورد",
      icon: Home,
    },
    {
      id: "cards" as NavTab,
      label: "کارت‌ها",
      icon: CreditCard,
      badge: cardsCount,
    },
    {
      id: "people" as NavTab,
      label: "اشخاص",
      icon: Users,
      badge: peopleCount,
    },
    {
      id: "debts" as NavTab,
      label: "حساب‌ها",
      icon: ArrowLeftRight,
      badge: debtsCount,
    },
    {
      id: "notes" as NavTab,
      label: "یادداشت",
      icon: FileText,
      badge: notesCount,
    },
    {
      id: "settings" as NavTab,
      label: "تنظیمات",
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 max-w-lg mx-auto pb-safe">
      <div className="flex items-center justify-between py-1.5 px-1 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 min-w-0 py-1 px-0.5 relative flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-blue-400 font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110 text-blue-400" : ""
                  }`}
                />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-blue-600 text-white text-[8px] font-mono flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-center tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
