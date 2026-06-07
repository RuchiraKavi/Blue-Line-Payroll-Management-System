import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";

const SidebarAccordionContext = createContext(null);

const matchesPath = (pathname, path) =>
  pathname === path || pathname.startsWith(`${path}/`);

export const SidebarAccordionProvider = ({ groups = [], children }) => {
  const location = useLocation();
  const [openGroupId, setOpenGroupId] = useState(null);

  const findActiveGroupId = useCallback(() => {
    for (const group of groups) {
      if (group.paths.some((path) => matchesPath(location.pathname, path))) {
        return group.id;
      }
    }
    return null;
  }, [groups, location.pathname]);

  useEffect(() => {
    setOpenGroupId(findActiveGroupId());
  }, [findActiveGroupId]);

  const toggleGroup = useCallback((groupId) => {
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  }, []);

  return (
    <SidebarAccordionContext.Provider value={{ openGroupId, toggleGroup }}>
      {children}
    </SidebarAccordionContext.Provider>
  );
};

const subLinkClass = ({ isActive }) =>
  `flex items-center gap-2 pl-11 pr-4 py-2 rounded-lg text-sm cursor-pointer whitespace-nowrap
   hover:bg-gray-800 transition-all duration-200
   ${isActive ? "bg-gray-800 text-white" : "text-gray-300"}`;

export const SidebarSubLink = ({ to, end = false, children }) => (
  <NavLink to={to} end={end} className={subLinkClass}>
    {children}
  </NavLink>
);

const SidebarGroup = ({ groupId, title, icon: Icon, paths = [], children }) => {
  const context = useContext(SidebarAccordionContext);
  const location = useLocation();

  const isChildActive = paths.some((path) =>
    matchesPath(location.pathname, path)
  );

  const open = context ? context.openGroupId === groupId : false;

  const handleToggle = () => {
    if (context) {
      context.toggleGroup(groupId);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-gray-800 whitespace-nowrap ${
          isChildActive ? "bg-gray-800/60" : ""
        }`}
      >
        <Icon className="text-lg shrink-0" />
        <span className="flex-1 min-w-0 text-left text-sm font-medium whitespace-nowrap">
          {title}
        </span>
        <FaChevronDown
          className={`text-xs shrink-0 transition-transform duration-300 ease-in-out ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
          open
            ? "grid-rows-[1fr] opacity-100 mt-1"
            : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-1 pb-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default SidebarGroup;
