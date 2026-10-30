import { useEffect, useId, useRef, useState } from "react";
import { Input } from "../atoms/Input";
import { Icon } from "../atoms/Icon";

/** A dropdown of existing values that also accepts a new value typed by the user. */
export function Combobox({
  value,
  onChange,
  options,
  required,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);

  const term = value.trim();
  const lowerTerm = term.toLowerCase();
  // Until the user types, show every option so the field behaves like a dropdown.
  const matches = typed ? options.filter((option) => option.toLowerCase().includes(lowerTerm)) : options;
  const canAdd = Boolean(term) && !options.some((option) => option.toLowerCase() === lowerTerm);
  const rows = canAdd && typed ? [...matches, term] : matches;

  useEffect(() => {
    if (active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function close() {
    setOpen(false);
    setTyped(false);
    setActive(-1);
  }

  function choose(next: string) {
    onChange(next);
    close();
  }

  function commit() {
    // Reuse an existing value's spelling so "rent" doesn't become a second "Rent".
    const existing = options.find((option) => option.toLowerCase() === lowerTerm);
    const next = existing ?? term;
    if (next !== value) onChange(next);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      if (rows.length) setActive((current) => (current + step + rows.length) % rows.length);
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      if (active >= 0 && rows[active] !== undefined) {
        choose(rows[active]);
      } else {
        commit();
        close();
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className="pr-10"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setTyped(true);
          setOpen(true);
          setActive(-1);
        }}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          commit();
          close();
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={open ? "Hide options" : "Show options"}
        className="absolute inset-y-0 right-2 grid w-7 place-items-center text-on-surface-variant"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (open) close();
          else setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Icon className="text-[18px]">{open ? "expand_less" : "expand_more"}</Icon>
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-20 max-h-60 overflow-auto rounded-xl bg-surface-container-high py-1 shadow-panel ring-1 ring-outline-variant/30"
        >
          {rows.map((row, index) => {
            const isNew = canAdd && typed && index === rows.length - 1;
            return (
              <li
                key={`${isNew ? "new" : "existing"}-${row}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={row === value}
                className={`flex cursor-pointer items-center gap-2 px-3.5 py-2 text-sm text-on-surface ${index === active ? "bg-surface-bright" : "hover:bg-surface-bright"}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  // The field sits inside a <label>; don't let this click re-activate the input.
                  event.preventDefault();
                  choose(row);
                }}
              >
                {isNew && <Icon className="text-[16px] text-primary">add</Icon>}
                <span className="min-w-0 truncate">{isNew ? `Add "${row}"` : row}</span>
              </li>
            );
          })}
          {!rows.length && <li className="px-3.5 py-2 text-sm text-on-surface-variant">Type to add a new one</li>}
        </ul>
      )}
    </div>
  );
}
