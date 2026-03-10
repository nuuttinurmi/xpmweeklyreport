import { useState, useEffect, useRef } from "react";
import type { PumInitiative } from "../types/dataverse";
import { fetchInitiatives } from "../utils/dataverseClient";

interface Props {
  value: string | null;
  onChange: (initiativeId: string, initiative: PumInitiative) => void;
}

export function InitiativeSelector({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PumInitiative[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOptions("");
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadOptions(search: string) {
    setLoading(true);
    try {
      const results = await fetchInitiatives(search || undefined);
      setOptions(results);
    } catch (err) {
      console.error("[InitiativeSelector] fetchInitiatives failed:", err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadOptions(q), 300);
  }

  function handleSelect(initiative: PumInitiative) {
    setSelectedLabel(initiative.pum_name);
    setQuery("");
    setOpen(false);
    onChange(initiative.pum_initiativeid, initiative);
  }

  return (
    <div className="relative max-w-lg" ref={containerRef}>
      <label className="block text-sm font-semibold text-audico-black mb-1.5">
        Project (Initiative)
      </label>

      {value && !open ? (
        <button
          className="w-full flex items-center gap-2 h-8 px-3 text-sm text-audico-black
                     bg-audico-light-grey border border-audico-mid-grey-3 rounded
                     hover:border-audico-mid-grey-2 transition-colors text-left"
          onClick={() => setOpen(true)}
        >
          <span className="flex-1 truncate">{selectedLabel || "Selected project"}</span>
          <span className="text-xs text-[var(--audico-accent)] font-semibold shrink-0">Change</span>
        </button>
      ) : (
        <input
          autoFocus={open}
          type="text"
          className="w-full h-8 px-3 text-sm text-audico-black bg-white border border-audico-mid-grey-3 rounded
                     focus:outline-none focus:border-[var(--audico-accent)] focus:ring-2 focus:ring-[var(--audico-accent)]/20
                     placeholder:text-audico-mid-grey-2"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setOpen(true)}
          placeholder="Search by project name or number…"
        />
      )}

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-audico-mid-grey-3 rounded shadow-md z-50 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-audico-mid-grey-1">Searching…</div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-audico-mid-grey-1">No results</div>
          ) : (
            <ul>
              {options.map((ini) => (
                <li
                  key={ini.pum_initiativeid}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors
                    ${ini.pum_initiativeid === value
                      ? "bg-[var(--audico-accent-subtle)] text-[var(--audico-accent)] font-semibold"
                      : "text-audico-black hover:bg-audico-light-grey"
                    }`}
                  onMouseDown={() => handleSelect(ini)}
                >
                  {ini.pum_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
