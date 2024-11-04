import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function SearchBar({ onArticlesFetched, onClearSearchTrigger }) {
  const [query, setQuery] = useState('');
  const prevQueryRef = useRef('');

  useEffect(() => {
    // Clear the query when the clear trigger is received
    if (onClearSearchTrigger) {
      setQuery('');
      prevQueryRef.current = '';
    }
  }, [onClearSearchTrigger]);

  const handleChange = (e) => {
    const newQuery = e.target.value;
    const prevQuery = prevQueryRef.current;

    if (newQuery.length > prevQuery.length) {
      // New character added
      axios.get(`http://localhost:8000/articles?q=${newQuery}`)
        .then(response => {
          onArticlesFetched(response.data);
        })
        .catch(error => {
          console.error('Error fetching articles:', error);
        });
    }

    // Update the previous query reference
    prevQueryRef.current = newQuery;
    setQuery(newQuery);
  };

  return (
    <input
      type="text"
      placeholder="Search articles..."
      value={query}
      onChange={handleChange}
      style={{ width: '100%', padding: '10px', fontSize: '16px' }}
    />
  );
}

export default SearchBar;
