import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  themeClasses: {
    bg: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    navBg: string;
    cardBg: string;
    cardBgAlt: string;
    border: string;
    borderHover: string;
    backgroundGradient: string;
    glowEffect: string;
    hoverBg: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkModeState] = useState(() => {
    const saved = sessionStorage.getItem("theme");
    return saved ? JSON.parse(saved) : true;
  });

  const setIsDarkMode = (value: boolean) => {
    setIsDarkModeState(value);
    sessionStorage.setItem("theme", JSON.stringify(value));
  };

  const themeClasses = {
    bg: isDarkMode ? "bg-cyan-950" : "bg-white",
    text: isDarkMode ? "text-cyan-50" : "text-cyan-950",
    textSecondary: isDarkMode ? "text-cyan-200" : "text-cyan-800",
    textMuted: isDarkMode ? "text-cyan-300" : "text-cyan-700",
    navBg: isDarkMode ? "bg-cyan-900/20" : "bg-cyan-50/80",
    cardBg: isDarkMode ? "bg-cyan-900/30" : "bg-white/90",
    cardBgAlt: isDarkMode ? "bg-cyan-900/40" : "bg-cyan-50/70",
    border: isDarkMode ? "border-cyan-400/20" : "border-cyan-200/50",
    borderHover: isDarkMode ? "border-cyan-400/40" : "border-cyan-300/70",
    backgroundGradient: isDarkMode
      ? "bg-gradient-to-br from-cyan-950 via-cyan-900 to-cyan-950"
      : "bg-gradient-to-br from-white via-cyan-50 to-cyan-100",
    glowEffect: isDarkMode ? "shadow-cyan-500/30" : "shadow-cyan-400/20",
    hoverBg: isDarkMode ? "hover:bg-cyan-800/20" : "hover:bg-cyan-50/80",
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, themeClasses }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
