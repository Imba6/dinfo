

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useParams, Outlet } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Swords, ShieldCheck } from 'lucide-react';
import { HeaderContext } from '@/components/layout/HeaderContext';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'War', page: 'war', icon: Swords },
  { name: 'Clans', page: 'clans', icon: ShieldCheck },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [headerText, setHeaderText] = useState('Top Clans');
  const { id } = useParams(); // ← current :id if present (e.g. /diablo/1/...)
  const skip_scroll = useRef(false);
  //console.log(id);

  // Reset header text when navigating to a page that doesn't set it.
  useEffect(() => {
    //console.log(id);
    const path = location.pathname.replace(/\/+$/, '');
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    const isWarPage = path === base; // index route
    if (!isWarPage) setHeaderText('Top Clans');  
  }, [location.pathname]);

  /*
  useEffect(() => {

    skip_scroll.current = true;
    window.scrollTo(0, 2);

    const handler = () => {

      if (skip_scroll.current) {
        skip_scroll.current = false; // reset, don’t run logic
        return;
      } 
      // Safari/Chrome iOS: status-bar tap sets body scrollTop = 0
      if (window.scrollY <= 2) {
        const rooms = document.getElementById("rooms");
        if (rooms) {
          rooms.scrollTo({ top: 0, behavior: "smooth" });
        }

        // Re-apply the 1px offset so the body is never "stuck" at 0
        skip_scroll.current = true;
        window.scrollTo(0, 2);
      }
    };
  

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [location.pathname]); // re-run if you change pages

  */
  return (
    <HeaderContext.Provider value={{ setHeaderText }}>
      {/*<div className="overflow-y: auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">*/}
       <div className="overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">         
        <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Swords className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold text-white truncate">{headerText}</span>
            </div>
            <nav className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 p-1 rounded-lg">
              {navItems.map((item) => {
                //const to = item.page === 'war' ? '' : item.page; // '' == index route (/diablo)
                //const to = item.page === "war" ? "" : item.page; // relative!
                const to =
                  item.page === "war"
                    ? (id ? `/${id}` : ``)
                    : item.page;
                const end = item.page !== "war"; // only exact-match non-war pages
                return (
                  <NavLink
                    key={item.page}
                    to={to}                // <- relative to basename
                    end={end} // exact match for index
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive ? 'bg-cyan-500/10 text-cyan-300'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </header>
        <main className="">
          {/*children*/}
          <Outlet />
        </main>
      </div>
    </HeaderContext.Provider>
  );
}

