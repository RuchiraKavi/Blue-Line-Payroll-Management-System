import React, { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const DashboardLayout = ({ sidebar, showWelcome = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    // Close mobile drawer after in-app navigation (NavLink also calls onNavigate)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional route-driven UI reset
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeSidebar]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const sidebarWithClose = React.isValidElement(sidebar)
    ? React.cloneElement(sidebar, { onNavigate: closeSidebar, onClose: closeSidebar })
    : sidebar;

  return (
    <div className="flex h-dvh min-h-screen overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 shrink-0 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarWithClose}
      </aside>

      <div className="flex flex-1 min-w-0 flex-col bg-white">
        <div className="fixed top-0 left-0 right-0 z-50 lg:left-80">
          <Navbar
            showWelcome={showWelcome}
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        <main className="mt-14 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 h-[calc(100dvh-3.5rem)]">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[100rem] flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
