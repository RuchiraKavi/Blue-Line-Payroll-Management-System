import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheck, FaChevronDown, FaSearch } from "react-icons/fa";

const POPOVER_MIN_WIDTH = 220;
const POPOVER_MAX_HEIGHT = 280;

const SIZE_CLASSES = {
  sm: "px-3 py-2 text-sm min-h-[2.25rem]",
  md: "px-4 py-3 text-sm min-h-[2.75rem]",
  lg: "px-4 py-3 text-base min-h-[3rem]",
};

export const selectInputBaseClass =
  "w-full min-w-0 border-2 border-gray-200 rounded-xl bg-white text-gray-900 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60";

function parseOptionsFromChildren(children) {
  const options = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== "option") return;
    options.push({
      value: child.props.value ?? "",
      label: child.props.children ?? "",
      disabled: Boolean(child.props.disabled),
    });
  });
  return options;
}

function normalizeOptions(options, children) {
  if (Array.isArray(options) && options.length > 0) {
    return options.map((opt) => ({
      value: opt.value ?? "",
      label: opt.label ?? String(opt.value ?? ""),
      disabled: Boolean(opt.disabled),
    }));
  }
  return parseOptionsFromChildren(children);
}

function estimatePopoverHeight(optionCount, enableSearch) {
  const searchBlock = enableSearch ? 52 : 0;
  const listPadding = 12;
  const itemHeight = 44;
  const emptyBlock = 72;

  if (optionCount === 0) {
    return Math.min(POPOVER_MAX_HEIGHT, searchBlock + emptyBlock);
  }

  const listHeight = listPadding + optionCount * itemHeight;
  return Math.min(POPOVER_MAX_HEIGHT, searchBlock + listHeight);
}

function computePopoverPosition(triggerRect, popoverHeight) {
  const margin = 8;
  const width = Math.max(POPOVER_MIN_WIDTH, triggerRect.width);
  let left = triggerRect.left;

  if (left + width > window.innerWidth - margin) {
    left = window.innerWidth - width - margin;
  }
  left = Math.max(margin, left);

  const spaceBelow = window.innerHeight - triggerRect.bottom - margin;
  const spaceAbove = triggerRect.top - margin;
  let top;

  if (spaceBelow >= popoverHeight) {
    top = triggerRect.bottom + margin;
  } else if (spaceAbove >= popoverHeight) {
    top = triggerRect.top - popoverHeight - margin;
  } else if (spaceBelow >= spaceAbove) {
    top = triggerRect.bottom + margin;
  } else {
    top = Math.max(margin, triggerRect.top - popoverHeight - margin);
  }

  return { top, left, width };
}

const SelectInput = ({
  name,
  id,
  value,
  onChange,
  options: optionsProp,
  children,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  className = "",
  size = "md",
  searchable,
  "aria-label": ariaLabel,
}) => {
  const autoId = useId();
  const inputId = id || name || autoId;
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const searchRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: POPOVER_MIN_WIDTH });
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const allOptions = useMemo(
    () => normalizeOptions(optionsProp, children),
    [optionsProp, children]
  );

  const placeholderOption = allOptions.find((opt) => String(opt.value) === "");
  const resolvedPlaceholder = placeholderOption?.label || placeholder;

  const menuOptions = useMemo(
    () => allOptions.filter((opt) => String(opt.value) !== ""),
    [allOptions]
  );

  const selectedOption = menuOptions.find(
    (opt) => String(opt.value) === String(value ?? "")
  );

  const enableSearch =
    searchable ?? menuOptions.length > 7;

  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return menuOptions;
    return menuOptions.filter((opt) =>
      String(opt.label).toLowerCase().includes(keyword)
    );
  }, [menuOptions, search]);

  const updatePopoverPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const measuredHeight = popoverRef.current?.offsetHeight;
    const estimatedHeight = estimatePopoverHeight(
      filteredOptions.length,
      enableSearch
    );
    const popoverHeight =
      measuredHeight && measuredHeight > 0 ? measuredHeight : estimatedHeight;

    setPopoverPos(
      computePopoverPosition(trigger.getBoundingClientRect(), popoverHeight)
    );
  };

  useLayoutEffect(() => {
    if (!open) return undefined;

    updatePopoverPosition();
    const frame = requestAnimationFrame(updatePopoverPosition);

    return () => cancelAnimationFrame(frame);
  }, [open, filteredOptions.length, enableSearch, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setHighlightIndex(-1);
      return undefined;
    }

    const onDocMouseDown = (e) => {
      const inTrigger = rootRef.current?.contains(e.target);
      const inPopover = popoverRef.current?.contains(e.target);
      if (!inTrigger && !inPopover) setOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => {
          const next = prev + 1;
          return next >= filteredOptions.length ? 0 : next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? filteredOptions.length - 1 : next;
        });
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        const option = filteredOptions[highlightIndex];
        if (option && !option.disabled) {
          selectValue(option.value);
        }
      }
    };

    const onReposition = () => updatePopoverPosition();

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    if (enableSearch) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, filteredOptions, highlightIndex, enableSearch]);

  const fireChange = (nextValue) => {
    onChange?.({
      target: { name, value: nextValue, id: inputId },
    });
  };

  const selectValue = (nextValue) => {
    fireChange(nextValue);
    setOpen(false);
  };

  const displayText = selectedOption ? selectedOption.label : resolvedPlaceholder;
  const hasValue = Boolean(selectedOption);

  const popover = open ? (
    <div
      ref={popoverRef}
      id={listboxId}
      role="listbox"
      aria-label={ariaLabel || resolvedPlaceholder}
      style={{
        top: popoverPos.top,
        left: popoverPos.left,
        width: popoverPos.width,
        maxHeight: POPOVER_MAX_HEIGHT,
      }}
      className="select-dropdown-popover fixed z-[9999] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-blue-200/40"
    >
      {enableSearch && (
        <div className="border-b border-gray-100 p-2">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIndex(0);
              }}
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      )}

      <div className="max-h-56 overflow-y-auto p-1.5">
        {filteredOptions.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-gray-500">No options found</p>
        ) : (
          filteredOptions.map((option, index) => {
            const isSelected = String(option.value) === String(value ?? "");
            const isHighlighted = index === highlightIndex;
            const isDisabled = option.disabled;

            let itemClass =
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ";

            if (isDisabled) {
              itemClass += "cursor-not-allowed text-gray-300 ";
            } else if (isSelected) {
              itemClass += "bg-blue-600 text-white font-semibold ";
            } else if (isHighlighted) {
              itemClass += "bg-blue-50 text-blue-800 ";
            } else {
              itemClass += "text-gray-700 hover:bg-blue-50 hover:text-blue-800 ";
            }

            return (
              <button
                key={`${option.value}-${index}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isDisabled}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => !isDisabled && selectValue(option.value)}
                className={itemClass}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && !isDisabled && (
                  <FaCheck className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden="true" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`relative w-full min-w-0 ${className}`}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ?? ""}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      <button
        ref={triggerRef}
        type="button"
        id={inputId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`${selectInputBaseClass} ${SIZE_CLASSES[size] || SIZE_CLASSES.md} flex w-full items-center justify-between gap-2 text-left ${open ? "ring-4 ring-blue-100 border-blue-500" : ""}`}
      >
        <span className={`block truncate ${hasValue ? "text-gray-900" : "text-gray-400"}`}>
          {displayText}
        </span>
        <FaChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180 text-blue-600" : ""}`}
          aria-hidden="true"
        />
      </button>

      {typeof document !== "undefined" && popover ? createPortal(popover, document.body) : null}
    </div>
  );
};

export default SelectInput;
