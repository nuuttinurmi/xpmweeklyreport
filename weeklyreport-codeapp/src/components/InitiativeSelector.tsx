import React, { useState, useEffect, useRef } from "react";
import type { PumInitiative } from "../types/dataverse";
import { fetchInitiatives } from "../utils/dataverseClient";

interface Props {
  value: string | null; // selected initiativeId
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

  // Initial load
  useEffect(() => {
    loadOptions("");
  }, []);

  // Close on outside click
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
    <div className="initiative-selector" ref={containerRef}>
      <label className="initiative-selector__label">Projekti (Initiative)</label>
      <div className="initiative-selector__input-wrap">
        {value && !open ? (
          <button
            className="initiative-selector__selected"
            onClick={() => setOpen(true)}
          >
            {selectedLabel || "Valittu projekti"}
            <span className="initiative-selector__change">Vaihda</span>
          </button>
        ) : (
          <input
            autoFocus={open}
            type="text"
            className="initiative-selector__input"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setOpen(true)}
            placeholder="Hae projektin nimellä tai numerolla…"
          />
        )}
      </div>
      {open && (
        <div className="initiative-selector__dropdown">
          {loading ? (
            <div className="initiative-selector__loading">Haetaan…</div>
          ) : options.length === 0 ? (
            <div className="initiative-selector__empty">Ei tuloksia</div>
          ) : (
            <ul className="initiative-selector__list">
              {options.map((ini) => (
                <li
                  key={ini.pum_initiativeid}
                  className={`initiative-selector__item ${
                    ini.pum_initiativeid === value
                      ? "initiative-selector__item--selected"
                      : ""
                  }`}
                  onMouseDown={() => handleSelect(ini)}
                >
                  <span className="initiative-selector__item-name">
                    {ini.pum_name}
                  </span>
                  {ini.pum_projectnumber && (
                    <span className="initiative-selector__item-num">
                      {ini.pum_projectnumber}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
