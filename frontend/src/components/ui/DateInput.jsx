import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const POPOVER_WIDTH = 300;
const POPOVER_HEIGHT = 380;

function parseYmd(str) {
  if (!str) return null;
  const [y, m, d] = String(str).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(ymd) {
  const d = parseYmd(ymd);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isDisabledDate(ymd, min, max) {
  if (!ymd) return false;
  if (min && ymd < min) return true;
  if (max && ymd > max) return true;
  return false;
}

function buildCalendarDays(viewYear, viewMonth) {
  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
  const cells = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    const date = new Date(viewYear, viewMonth - 1, day);
    cells.push({ date, ymd: formatYmd(date), outside: true });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(viewYear, viewMonth, day);
    cells.push({ date, ymd: formatYmd(date), outside: false });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(viewYear, viewMonth + 1, nextDay);
    cells.push({ date, ymd: formatYmd(date), outside: true });
    nextDay += 1;
  }

  return cells;
}

function computePopoverPosition(triggerRect) {
  const margin = 8;
  let left = triggerRect.left;
  let top = triggerRect.bottom + margin;

  if (left + POPOVER_WIDTH > window.innerWidth - margin) {
    left = triggerRect.right - POPOVER_WIDTH;
  }
  left = Math.max(margin, Math.min(left, window.innerWidth - POPOVER_WIDTH - margin));

  if (top + POPOVER_HEIGHT > window.innerHeight - margin) {
    top = triggerRect.top - POPOVER_HEIGHT - margin;
  }
  top = Math.max(margin, top);

  return { top, left };
}

const defaultInputClass =
  "w-full min-w-0 border-2 border-gray-200 rounded-xl bg-white text-sm text-gray-900 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60";

const DateInput = ({
  name,
  id,
  value = "",
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  className = "",
  placeholder = "Select date",
  showIcon = true,
}) => {
  const autoId = useId();
  const inputId = id || name || autoId;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const selected = parseYmd(value);
  const todayYmd = formatYmd(new Date());
  const initialView = selected || parseYmd(min) || new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  }, [value]);

  const updatePopoverPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setPopoverPos(computePopoverPosition(trigger.getBoundingClientRect()));
  };

  useEffect(() => {
    if (!open) return undefined;

    updatePopoverPosition();

    const onDocMouseDown = (e) => {
      const inTrigger = rootRef.current?.contains(e.target);
      const inPopover = popoverRef.current?.contains(e.target);
      if (!inTrigger && !inPopover) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReposition = () => updatePopoverPosition();

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const start = current - 100;
    const end = current + 20;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, []);

  const calendarDays = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const fireChange = (nextValue) => {
    onChange?.({
      target: { name, value: nextValue, id: inputId },
    });
  };

  const selectDate = (ymd) => {
    if (isDisabledDate(ymd, min, max)) return;
    fireChange(ymd);
    setOpen(false);
  };

  const goMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const displayText = value ? formatDisplay(value) : "";

  const popover = open ? (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Choose date"
      style={{ top: popoverPos.top, left: popoverPos.left, width: POPOVER_WIDTH }}
      className="date-picker-popover fixed z-9999 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl shadow-blue-200/40"
    >
      <div className="mb-3 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
          aria-label="Previous month"
        >
          <FaChevronLeft className="h-3 w-3" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm font-semibold text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            aria-label="Month"
          >
            {MONTHS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="w-19 shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm font-semibold text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            aria-label="Year"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => goMonth(1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
          aria-label="Next month"
        >
          <FaChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-[0.65rem] font-bold uppercase tracking-wide text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, ymd, outside }) => {
          const isSelected = value === ymd;
          const isToday = todayYmd === ymd;
          const isDisabled = isDisabledDate(ymd, min, max);

          let cellClass =
            "flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors ";

          if (isDisabled) {
            cellClass += "cursor-not-allowed text-gray-300 ";
          } else if (isSelected) {
            cellClass += "bg-blue-600 text-white shadow-sm ";
          } else if (isToday) {
            cellClass += "bg-blue-50 text-blue-700 font-semibold ring-1 ring-inset ring-blue-300 hover:bg-blue-100 ";
          } else if (outside) {
            cellClass += "text-gray-300 hover:bg-gray-50 ";
          } else {
            cellClass += "text-gray-700 hover:bg-blue-50 hover:text-blue-700 ";
          }

          return (
            <button
              key={`${ymd}-${outside ? "o" : "i"}`}
              type="button"
              disabled={isDisabled}
              onClick={() => selectDate(ymd)}
              className={cellClass}
              aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              aria-pressed={isSelected}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => {
            fireChange("");
            setOpen(false);
          }}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isDisabledDate(todayYmd, min, max)) selectDate(todayYmd);
          }}
          disabled={isDisabledDate(todayYmd, min, max)}
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Today
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      {name && (
        <input type="hidden" name={name} value={value} required={required} tabIndex={-1} aria-hidden="true" />
      )}

      <div className="relative">
        {showIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <FaCalendarAlt className="h-4 w-4 shrink-0" aria-hidden="true" />
          </span>
        )}
        <button
          ref={triggerRef}
          type="button"
          id={inputId}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={`${defaultInputClass} ${showIcon ? "pl-10 pr-9" : "px-4"} py-2 text-left truncate ${open ? "ring-4 ring-blue-100 border-blue-500" : ""} ${className}`}
        >
          <span className={`block truncate ${displayText ? "text-gray-900" : "text-gray-400"}`}>
            {displayText || placeholder}
          </span>
        </button>
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              fireChange("");
            }}
            className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-base text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Clear date"
          >
            ×
          </button>
        )}
      </div>

      {typeof document !== "undefined" && popover ? createPortal(popover, document.body) : null}
    </div>
  );
};

export default DateInput;
