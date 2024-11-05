import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function SearchBar({ onArticlesFetched, onClearSearchTrigger, onArticleSelect }) {
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [source, setSource] = useState('');
  const [articles, setArticles] = useState([]);
  const prevQueryRef = useRef('');

  useEffect(() => {
    // Clear the query, dates, and source when the clear trigger is received
    if (onClearSearchTrigger) {
      setQuery('');
      setStartDate('');
      setEndDate('');
      setSource('');
      setArticles([]);
      prevQueryRef.current = '';
    }
  }, [onClearSearchTrigger]);

  const handleChange = (e) => {
    const newQuery = e.target.value;
    const prevQuery = prevQueryRef.current;

    if (newQuery.length > prevQuery.length) {
      // New character added
      fetchArticles(newQuery, startDate, endDate, source);
    }

    // Update the previous query reference
    prevQueryRef.current = newQuery;
    setQuery(newQuery);
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    fetchArticles(query, newStartDate, endDate, source);
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    fetchArticles(query, startDate, newEndDate, source);
  };

  const handleSourceChange = (e) => {
    const newSource = e.target.value;
    setSource(newSource);
    fetchArticles(query, startDate, endDate, newSource);
  };

  const fetchArticles = (query, startDate, endDate, source) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (source) params.append('source', source);

    axios.get(`http://localhost:8000/articles?${params.toString()}`)
      .then(response => {
        setArticles(response.data);
        onArticlesFetched(response.data);
      })
      .catch(error => {
        console.error('Error fetching articles:', error);
      });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search articles..."
        value={query}
        onChange={handleChange}
        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
      />
      <label style={{ display: 'block', marginTop: '10px' }}>
        Start Date:
        <input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          style={{ width: '100%', padding: '10px', fontSize: '16px', marginTop: '5px' }}
        />
      </label>
      <label style={{ display: 'block', marginTop: '10px' }}>
        End Date:
        <input
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          style={{ width: '100%', padding: '10px', fontSize: '16px', marginTop: '5px' }}
        />
      </label>
      <label style={{ display: 'block', marginTop: '10px' }}>
        Source:
        <input
          type="text"
          placeholder="Filter by source..."
          value={source}
          onChange={handleSourceChange}
          style={{ width: '100%', padding: '10px', fontSize: '16px', marginTop: '5px' }}
        />
      </label>
      <div style={{ marginTop: '20px' }}>
        {articles.map(article => (
          <div
            key={article.id}
            onClick={() => onArticleSelect(article)}
            style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
          >
            <h3>{article.title}</h3>
            <p>
              <span><strong>Author:</strong> {article.author || 'Unknown'}</span>
              <span style={{ marginLeft: '20px' }}><strong>Publication Date:</strong> {new Date(article.published_date).toLocaleDateString()}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchBar;
