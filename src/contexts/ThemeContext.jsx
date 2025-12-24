import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Par défaut, on veut le mode 'light' (Clair)
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        // On sauvegarde le choix
        localStorage.setItem("theme", theme);
        
        // On applique l'attribut data-theme sur la balise <html>

        document.documentElement.setAttribute("data-theme", theme);
        
        // On gère une classe CSS pour nos styles personnalisés (bg image, etc)
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);