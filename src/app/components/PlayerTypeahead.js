'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function PlayerTypeahead({ value, onChange, placeholder, required }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  // Sync external value changes (like initial load)
  useEffect(() => {
    if (value && value !== inputValue) {
       setInputValue(value);
       setIsValid(true);
    }
  }, [value]);

  const validateSelection = useCallback(() => {
    setShowSuggestions(false);
    if (!inputValue) {
      setIsValid(false);
      setError('');
      return;
    }
    if (!isValid) {
      const exactMatch = suggestions.find(s => s.toLowerCase() === inputValue.toLowerCase());
      if (exactMatch) {
         setInputValue(exactMatch);
         setIsValid(true);
         setError('');
         onChange(exactMatch);
      } else {
         setError('Please select a valid player name.');
         onChange('');
      }
    }
  }, [inputValue, isValid, suggestions, onChange]);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsValid(false);
    setError('');
    onChange(''); // Clear the real value until a valid selection is made
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (val.length >= 2) {
       debounceRef.current = setTimeout(() => {
         fetchSuggestions(val);
       }, 300);
    } else {
       setSuggestions([]);
       setShowSuggestions(false);
    }
  };

  const handleSelect = (playerName) => {
    setInputValue(playerName);
    setIsValid(true);
    setError('');
    setShowSuggestions(false);
    onChange(playerName);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input-field"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
             if (inputValue.length >= 2 && !isValid) fetchSuggestions(inputValue);
          }}
          onBlur={validateSelection}
          placeholder={placeholder || 'Type player name...'}
          required={required}
          style={{ 
             width: '100%', 
             padding: '12px', 
             paddingRight: '36px',
             borderColor: isValid ? '#10B981' : error ? '#EF4444' : undefined,
             transition: 'border-color 0.2s',
          }}
        />
        {isValid && (
          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>✅</span>
        )}
      </div>
      {error && (
        <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '4px' }}>{error}</div>
      )}
      {showSuggestions && inputValue.length >= 2 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#1a2035', border: '1px solid var(--border)',
          borderRadius: '8px', marginTop: '4px', maxHeight: '250px',
          overflowY: 'auto', zIndex: 10, listStyle: 'none', padding: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {isSearching ? (
             <li style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>Searching...</li>
          ) : suggestions.length > 0 ? (
            suggestions.map(s => (
              <li 
                key={s} onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                {s}
              </li>
            ))
          ) : (
            <li style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>No players found</li>
          )}
        </ul>
      )}
    </div>
  );
}