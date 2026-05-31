import { useState, type KeyboardEvent, useRef, useEffect } from "react";
import { Button } from "../ui/Button";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  suggestions?: string[];
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  suggestions = [],
}: SearchInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) {
      setShowSuggestions(false);
      onSubmit();
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        {/* Search icon */}
        <svg
          className="absolute left-4 h-5 w-5 text-neutral-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder='e.g. "Arijit Singh love songs" or "upbeat workout playlist"'
          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 py-4 pl-12 pr-36 text-base text-white placeholder-neutral-500 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          disabled={loading}
          aria-label="Search for a playlist"
        />

        <div className="absolute right-2 flex items-center gap-2">
          {value && !loading && (
            <button
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
          <Button
            onClick={() => {
              setShowSuggestions(false);
              onSubmit();
            }}
            disabled={!value.trim() || loading}
            loading={loading}
            size="md"
          >
            Generate
          </Button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && !value && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-2xl">
          <p className="px-3 py-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Try these
          </p>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <span className="mr-2 text-blue-500">🎵</span>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
