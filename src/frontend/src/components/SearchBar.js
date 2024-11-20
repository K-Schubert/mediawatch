import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { customTheme } from '../styles/theme';

function SearchBar({ onArticlesFetched, onClearSearchTrigger, onArticleSelect }) {
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [source, setSource] = useState('');
  const [articles, setArticles] = useState([]);
  const prevQueryRef = useRef('');

  useEffect(() => {
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
      fetchArticles(newQuery, startDate, endDate, source);
    }

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

  const styles = {
    container: {
      padding: customTheme.spacing.xl,
      backgroundColor: customTheme.colors.surface,
      borderRadius: customTheme.borderRadius.lg,
      boxShadow: `0 4px 6px ${customTheme.colors.shadow.light}, 0 10px 15px ${customTheme.colors.shadow.medium}`,
      marginBottom: customTheme.spacing.xl,
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: `1px solid ${customTheme.colors.border}`,
      borderRadius: customTheme.borderRadius.full,
      fontSize: '15px',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: customTheme.colors.primary,
        boxShadow: `0 0 0 3px ${customTheme.colors.shadow.light}`,
      },
      boxSizing: 'border-box',
    },
    label: {
      display: 'block',
      marginTop: customTheme.spacing.lg,
      marginBottom: customTheme.spacing.xs,
      color: customTheme.colors.text.primary,
      fontSize: '14px',
      fontWeight: '500',
    },
    filterContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: customTheme.spacing.xl,
      marginTop: customTheme.spacing.lg,
    },
    dateInput: {
      width: '90%',
      padding: '12px 16px',
      border: `1px solid ${customTheme.colors.border}`,
      borderRadius: customTheme.borderRadius.full,
      fontSize: '15px',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: customTheme.colors.primary,
        boxShadow: `0 0 0 3px ${customTheme.colors.shadow.light}`,
      },
      boxSizing: 'border-box',
    },
    article: {
      border: `1px solid ${customTheme.colors.border}`,
      padding: customTheme.spacing.lg,
      marginBottom: customTheme.spacing.md,
      borderRadius: customTheme.borderRadius.md,
      cursor: 'pointer',
      backgroundColor: customTheme.colors.surface,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: customTheme.colors.hover.surface,
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${customTheme.colors.shadow.medium}`,
      },
    },
    articleTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: customTheme.colors.text.primary,
      marginBottom: customTheme.spacing.xs,
    },
    articleMeta: {
      fontSize: '14px',
      color: customTheme.colors.text.secondary,
      display: 'flex',
      gap: customTheme.spacing.md,
    },
  };

  return (
    <div style={styles.container}>
      <input
        type="text"
        placeholder="Search articles..."
        value={query}
        onChange={handleChange}
        style={styles.input}
      />
      <div style={styles.filterContainer}>
        <div>
          <label style={styles.label}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            style={styles.dateInput}
          />
        </div>
        <div>
          <label style={styles.label}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            style={styles.dateInput}
          />
        </div>
        <div>
          <label style={styles.label}>Source</label>
          <input
            type="text"
            placeholder="Filter by source..."
            value={source}
            onChange={handleSourceChange}
            style={styles.input}
          />
        </div>
      </div>
      <div style={{ marginTop: customTheme.spacing.lg }}>
        {articles.map(article => (
          <div
            key={article.id}
            onClick={() => onArticleSelect(article)}
            style={styles.article}
          >
            <h3 style={styles.articleTitle}>{article.title}</h3>
            <p style={styles.articleMeta}>
              <span><strong>Author:</strong> {article.author || 'Unknown'}</span>
              <span style={{ marginLeft: customTheme.spacing.sm }}><strong>Publication Date:</strong> {new Date(article.published_date).toLocaleDateString()}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchBar;
