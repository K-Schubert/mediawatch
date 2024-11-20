import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Editor from './components/Editor';
import SearchBar from './components/SearchBar';
import LoginForm from './components/LoginForm';
import { ThemeProvider } from 'styled-components';
import { customTheme } from './styles/theme';
import styled from 'styled-components';

const StyledButton = styled.button`
  padding: ${props => props.small ? '6px 12px' : '8px 16px'};
  background-color: ${props => props.variant === 'danger'
    ? '#ff4444'
    : props.variant === 'secondary'
    ? props.theme.colors.surface
    : props.theme.colors.primary};
  color: ${props => props.variant === 'secondary'
    ? props.theme.colors.text.primary
    : props.theme.colors.surface};
  border: ${props => props.variant === 'secondary'
    ? `1px solid ${props.theme.colors.border}`
    : 'none'};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${props => props.small ? '14px' : '16px'};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.variant === 'danger'
      ? '#ff0000'
      : props.variant === 'secondary'
      ? props.theme.colors.hover.surface
      : props.theme.colors.hover.primary};
  }
`;

function AnnotationItem({ annotation, onDelete, onUpdate }) {
  const [comments, setComments] = useState(annotation.comments || []);
  const [commentInputOpen, setCommentInputOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    category: annotation.category,
    subcategory: annotation.subcategory,
    highlighted_text: annotation.highlighted_text,
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const updatedData = {
      category: editValues.category,
      subcategory: editValues.subcategory,
      highlighted_text: editValues.highlighted_text,
      start_position: annotation.start_position, // Add this
      end_position: annotation.end_position,     // Add this
      timestamp: new Date().toISOString(),
    };

    axios.put(`http://localhost:8000/annotations/${annotation.id}`, updatedData)
      .then(response => {
        // Update the annotation in the parent component
        onUpdate(response.data);
        setIsEditing(false);
      })
      .catch(error => {
        console.error('Error updating annotation:', error);
      });
  };

  const handleCancel = () => {
    setEditValues({
      category: annotation.category,
      subcategory: annotation.subcategory,
      highlighted_text: annotation.highlighted_text,
    });
    setIsEditing(false);
  };

  const handleAddCommentClick = () => {
    setCommentInputOpen(true);
  };

  const handleCommentSubmit = () => {
    const newComment = {
      annotation_id: annotation.id,
      user: 'placeholder_user', // Replace with actual user ID when login is implemented
      comment_text: commentText,
    };

    axios.post('http://localhost:8000/annotations/comments/', newComment)
      .then(response => {
        setComments([...comments, response.data]);
        setCommentText('');
        setCommentInputOpen(false);
      })
      .catch(error => {
        console.error('Error adding comment:', error);
      });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this annotation?")) {
      axios.delete(`http://localhost:8000/annotations/${annotation.id}`)
        .then(response => {
          console.log('Annotation deleted:', response.data);
          onDelete(annotation.id);
        })
        .catch(error => {
          console.error('Error deleting annotation:', error);
        });
    }
  };

  const handleCommentDelete = (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      axios.delete(`http://localhost:8000/annotations/comments/${commentId}`)
        .then(response => {
          setComments(comments.filter(comment => comment.id !== commentId));
        })
        .catch(error => {
          console.error('Error deleting comment:', error);
        });
    }
  };

  return (
    <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', position: 'relative' }}>
      <StyledButton
        onClick={handleDelete}
        variant="danger"
        small
        style={{
          position: 'absolute',
          top: '0',
          right: '10px',
        }}
        title="Delete Annotation"
      >
        &#10005;
      </StyledButton>

      <p><strong>Timestamp:</strong> {new Date(annotation.timestamp).toLocaleString()}</p>
      <p><strong>User:</strong> {annotation.user}</p>

      {isEditing ? (
        <>
          <div>
            <label>Category:</label>
            <input
              type="text"
              value={editValues.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            />
          </div>
          <div>
            <label>Subcategory:</label>
            <input
              type="text"
              value={editValues.subcategory}
              onChange={(e) => handleInputChange('subcategory', e.target.value)}
            />
          </div>
          <div>
            <label>Highlighted Text:</label>
            <textarea
              value={editValues.highlighted_text}
              onChange={(e) => handleInputChange('highlighted_text', e.target.value)}
              style={{ width: '100%', padding: '5px' }}
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            <StyledButton onClick={handleSave} style={{ marginRight: '10px' }}>Save</StyledButton>
            <StyledButton variant="secondary" onClick={handleCancel}>Cancel</StyledButton>
          </div>
        </>
      ) : (
        <>
          <p><strong>Category:</strong> {annotation.category}</p>
          <p><strong>Subcategory:</strong> {annotation.subcategory}</p>
          <p><strong>Highlighted Text:</strong></p>
          <p style={{ backgroundColor: '#f9f9f9', padding: '5px' }}>{annotation.highlighted_text}</p>
          <StyledButton variant="secondary" onClick={handleEditClick} style={{ marginTop: '10px' }}>Edit</StyledButton>
        </>
      )}

      <div style={{ marginTop: '10px' }}>
        <strong>Comments:</strong>
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <div key={index} style={{
              marginTop: '5px',
              position: 'relative',
              backgroundColor: '#f9f9f9',
              padding: '8px',
              borderRadius: '4px'
            }}>
              <StyledButton
                onClick={() => handleCommentDelete(comment.id)}
                variant="danger"
                small
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  padding: '2px 6px',
                  minWidth: 'auto'
                }}
                title="Delete Comment"
              >
                &#10005;
              </StyledButton>
              <p style={{ margin: '0', paddingRight: '24px' }}>
                {comment.comment_text} ({comment.username}, {new Date(comment.timestamp).toLocaleString()})
              </p>
            </div>
          ))
        ) : (
          <p>No comments yet.</p>
        )}
        {commentInputOpen ? (
          <div style={{ marginTop: '10px' }}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '5px' }}
            />
            <StyledButton onClick={handleCommentSubmit} style={{ marginTop: '5px' }}>Submit Comment</StyledButton>
          </div>
        ) : (
          <p
            onClick={handleAddCommentClick}
            style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer', marginTop: '10px' }}
          >
            Add Comment
          </p>
        )}
      </div>
    </div>
  );
}

function App() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [clearSearchTrigger, setClearSearchTrigger] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategories, setSubcategories] = useState({});
  const [selectedOption, setSelectedOption] = useState('');

  const [highlightData, setHighlightData] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const editorRef = useRef();
  const [token, setToken] = useState(null);

  const handleLogout = () => {
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    axios.get('http://localhost:8000/options/categories')
      .then(response => {
        setCategories(response.data);
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      axios.get(`http://localhost:8000/options/subcategories/${selectedCategory}`)
        .then(response => {
          setSubcategories(response.data);
        })
        .catch(error => {
          console.error('Error fetching subcategories:', error);
        });
    } else {
      setSubcategories({});
    }
  }, [selectedCategory]);

  const handleArticlesFetched = (fetchedArticles) => {
    setArticles(fetchedArticles);
  };

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    setArticles([]);
    setClearSearchTrigger(true);
    setTimeout(() => setClearSearchTrigger(false), 0);

    // Clear editor content and highlights
    if (editorRef.current && editorRef.current.setContent) {
      editorRef.current.setContent(article.text);
    }

    // Fetch and display annotations with exact positions
    axios.get(`http://localhost:8000/annotations/article/${article.id}`)
      .then(response => {
        setAnnotations(response.data);

        if (editorRef.current && editorRef.current.addHighlight) {
          response.data.forEach(annotation => {
            const color = getColorForCategory(annotation.category);
            editorRef.current.addHighlight(
              annotation.start_position,
              annotation.end_position,
              color,
              annotation.id
            );
          });
        }
      })
      .catch(error => {
        console.error('Error fetching annotations:', error);
      });
  };

  const handleAnalyze = () => {
    if (selectedArticle && selectedArticle.id) {
      axios.post(`http://localhost:8000/analyze?article_id=${selectedArticle.id}`)
        .then(response => {
          console.log('Analysis result:', response.data);
          const newAnnotations = response.data;

          setAnnotations(prevAnnotations => [...prevAnnotations, ...newAnnotations]);

          if (editorRef.current && editorRef.current.addHighlight) {
            newAnnotations.forEach(annotation => {
              const color = getColorForCategory(annotation.category);
              editorRef.current.addHighlight(
                annotation.start_position,
                annotation.end_position,
                color,
                annotation.id
              );
            });
          }
        })
        .catch(error => {
          console.error('Error analyzing text:', error);
        });
    } else {
      alert('No article selected for analysis.');
    }
  };

  const handleTextSelect = (data) => {
    setHighlightData(data);
  };

  const handleSaveAnnotation = () => {
    if (highlightData && selectedCategory && selectedOption) {

      const annotation = {
        article_id: selectedArticle.id,
        highlighted_text: highlightData.text,
        start_position: highlightData.from,  // Add position data
        end_position: highlightData.to,      // Add position data
        category: selectedCategory,
        subcategory: selectedOption,
        article_metadata: selectedArticle,
        timestamp: new Date().toISOString(),
        user: 'placeholder_user', // Replace with actual user ID when login is implemented
      };

      axios.post('http://localhost:8000/annotations', annotation)
        .then(response => {
          console.log('Annotation saved:', response.data);

          const newAnnotation = response.data;

          // Add the highlight with the annotation id
          if (editorRef.current && editorRef.current.addHighlight) {
            const color = getColorForCategory(newAnnotation.category);
            editorRef.current.addHighlight(
              newAnnotation.start_position,
              newAnnotation.end_position,
              color,
              newAnnotation.id
            );
          }

          // Update annotations state
          setAnnotations(prevAnnotations => [...prevAnnotations, newAnnotation]);

          // Clear selections
          setHighlightData(null);
          setSelectedCategory('');
          setSelectedOption('');
        })
        .catch(error => {
          console.error('Error saving annotation:', error);
        });

    } else {
      alert('Please select text and choose a category and subcategory before saving.');
    }
  };

  const handleAnnotationDelete = (deletedAnnotationId) => {
    setAnnotations(annotations.filter(a => a.id !== deletedAnnotationId));

    // Remove the highlight from the editor
    if (editorRef.current && editorRef.current.removeHighlight) {
      editorRef.current.removeHighlight(deletedAnnotationId);
    }
  };

  const handleAnnotationUpdate = (updatedAnnotation) => {
    setAnnotations((prevAnnotations) =>
      prevAnnotations.map((annotation) =>
        annotation.id === updatedAnnotation.id ? updatedAnnotation : annotation
      )
    );

    // Update the highlight in the editor
    if (editorRef.current) {
      // Remove the old highlight
      editorRef.current.removeHighlight(updatedAnnotation.id);

      // Add the new highlight with stored positions
      const color = getColorForCategory(updatedAnnotation.category);
      editorRef.current.addHighlight(
        updatedAnnotation.start_position,
        updatedAnnotation.end_position,
        color,
        updatedAnnotation.id
      );
    }
  };

  const exportCurrentDocumentAnnotations = () => {
    if (!selectedArticle) {
      alert('No article selected.');
      return;
    }

    const csvData = annotationsToCsv(annotations, selectedArticle);
    downloadCsv(csvData, `${selectedArticle.title || 'article'}_annotations.csv`);
  };

  const exportAllUserAnnotations = () => {
    const userName = 'placeholder_user'; // Replace with actual user name when authentication is implemented

    axios.get(`http://localhost:8000/annotations/user/${userName}`)
      .then(response => {
        const userAnnotations = response.data;
        const csvData = annotationsToCsv(userAnnotations);
        downloadCsv(csvData, `all_annotations_${userName}.csv`);
      })
      .catch(error => {
        console.error('Error fetching user annotations:', error);
      });
  };

  const annotationsToCsv = (annotations, articleMetadata = null) => {
    const rows = [];
    const headers = [
      'Annotation ID',
      'Article ID',
      'Article Title',
      'User',
      'Timestamp',
      'Category',
      'Subcategory',
      'Highlighted Text',
      'Source',
      'Link',
      'Author',
      'Topic',
      'Abstract',
      'Text',
      'Published Date',
      'Modified Date',
      'Membership',
      'Language'
    ];

    rows.push(headers);

    annotations.forEach(annotation => {
      const article = articleMetadata || annotation.article_metadata;
      const row = [
        annotation.id,
        annotation.article_id,
        article.title || '',
        annotation.user,
        new Date(annotation.timestamp).toLocaleString(),
        annotation.category,
        annotation.subcategory,
        annotation.highlighted_text,
        article.source || '',
        article.link || '',
        article.author || '',
        article.topic || '',
        article.abstract || '',
        article.text || '',
        article.published_date ? new Date(article.published_date).toLocaleDateString() : '',
        article.modified_date ? new Date(article.modified_date).toLocaleDateString() : '',
        article.membership || '',
        article.language || 'fr'
      ];

      rows.push(row);
    });

    return rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  };

  const downloadCsv = (csvData, filename) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Your browser does not support file downloads.');
    }
  };

  const getColorForCategory = (categoryId) => {
    const categoryColors = {
      'A': '#FFD700', // Gold
      'B': '#ADFF2F', // GreenYellow
      'C': '#87CEFA', // LightSkyBlue
      'D': '#FFB6C1', // LightPink
    };
    return categoryColors[categoryId.trim()] || '#FFFF00'; // Default to yellow
  };

  const formatMetadata = (article) => {
    return (
      <>
        <p><strong>Title:</strong> {article.title || 'N/A'}</p>
        <p><strong>Author:</strong> {article.author || 'N/A'}</p>
        <p><strong>Source:</strong> {article.source || 'N/A'}</p>
        <p><strong>Link:</strong> <a href={article.link} target="_blank" rel="noopener noreferrer">{article.link || 'N/A'}</a></p>
        <p><strong>Topic:</strong> {article.topic || 'N/A'}</p>
        <p><strong>Published Date:</strong> {article.published_date ? new Date(article.published_date).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Modified Date:</strong> {article.modified_date ? new Date(article.modified_date).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Membership:</strong> {article.membership || 'N/A'}</p>
        <p><strong>Language:</strong> {article.language || 'N/A'}</p>
        <hr />
      </>
    );
  };

  const handleLogin = (username, password) => {
    const data = new URLSearchParams();
    data.append('username', username);
    data.append('password', password);

    axios.post('http://localhost:8000/auth/token', data)
      .then(response => {
        setToken(response.data.access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      })
      .catch(error => {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
      });
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const handleDeleteAllAnnotations = () => {
    if (!selectedArticle) return;

    if (window.confirm("Are you sure you want to delete all annotations for this article? This action cannot be undone.")) {
      axios.delete(`http://localhost:8000/annotations/article/${selectedArticle.id}/all`)
        .then(response => {
          // Clear all annotations from state
          setAnnotations([]);

          // Remove all highlights from editor
          if (editorRef.current) {
            annotations.forEach(annotation => {
              editorRef.current.removeHighlight(annotation.id);
            });
          }
        })
        .catch(error => {
          console.error('Error deleting all annotations:', error);
          alert('Failed to delete all annotations. Please try again.');
        });
    }
  };

  if (!token) {
    return (
      <ThemeProvider theme={customTheme}>
        <LoginForm onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={customTheme}>
      <div style={{ padding: `${customTheme.spacing.xl} ${customTheme.spacing.md} ${customTheme.spacing.md}` }}>
        {/* Logout Button */}
        <div style={{
          position: 'absolute',
          top: customTheme.spacing.sm,
          right: customTheme.spacing.md,
          marginBottom: customTheme.spacing.md
        }}>
          <StyledButton onClick={handleLogout}>Logout</StyledButton>
        </div>
        <SearchBar
          onArticlesFetched={handleArticlesFetched}
          onClearSearchTrigger={clearSearchTrigger}
          onArticleSelect={handleArticleSelect}  // Pass the function here
        />
        {articles.length > 0 && (
          <div style={{
            position: 'absolute',
            backgroundColor: customTheme.colors.surface,
            border: `1px solid ${customTheme.colors.border}`,
            width: '100%',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1,
            boxShadow: customTheme.colors.shadow,
            borderRadius: customTheme.borderRadius
          }}>
            {articles.map(article => (
              <div
                key={article.id}
                onClick={() => handleArticleSelect(article)}
                style={{
                  padding: customTheme.spacing.sm,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${customTheme.colors.border}`
                }}
              >
                <h3 style={{ color: customTheme.colors.text.primary }}>{article.title || 'Untitled Article'}</h3>
                <p style={{ color: customTheme.colors.text.secondary }}>
                  <span><strong>Author:</strong> {article.author || 'Unknown'}</span>
                  <span style={{ marginLeft: customTheme.spacing.md }}>
                    <strong>Publication Date:</strong> {new Date(article.published_date).toLocaleDateString()}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
        {selectedArticle && (
          <div style={{ marginTop: customTheme.spacing.md, display: 'flex' }}>
            {/* Left Side: Article Details and Editor */}
            <div style={{ flex: 3, marginRight: customTheme.spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Article Details</h2>
                <StyledButton onClick={handleAnalyze}>Analyze</StyledButton>
              </div>
              <div style={{ marginTop: '10px' }}>
                {formatMetadata(selectedArticle)}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label htmlFor="category-select"><strong>Select Category:</strong></label>
                    <br />
                    <select
                      id="category-select"
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedOption('');
                      }}
                      style={{ padding: '10px', fontSize: '16px' }}
                    >
                      <option value="">--Choose an option--</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedCategory && (
                    <div>
                      <label htmlFor="option-select"><strong>Select Subcategory:</strong></label>
                      <br />
                      <select
                        id="option-select"
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        style={{ padding: '10px', fontSize: '16px' }}
                      >
                        <option value="">--Choose an option--</option>
                        {Object.entries(subcategories).map(([header, options]) => (
                          <optgroup key={header} label={header}>
                            {options.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  )}
                  <div style={{ alignSelf: 'flex-end' }}>
                    <StyledButton onClick={handleSaveAnnotation}>Save Annotation</StyledButton>
                  </div>
                </div>
                <Editor
                  initialContent={selectedArticle.text}
                  onTextSelect={handleTextSelect}
                  ref={editorRef}
                />
              </div>
            </div>
            {/* Right Side: Annotations Pane */}
            <div style={{ flex: 1, borderLeft: `1px solid ${customTheme.colors.border}`, paddingLeft: customTheme.spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Annotation History</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <StyledButton variant="danger" onClick={handleDeleteAllAnnotations}>
                    Delete All
                  </StyledButton>
                  {/* Existing Export CSV button */}
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <StyledButton variant="secondary" onClick={() => setExportMenuOpen(!exportMenuOpen)}>
                      Export CSV
                    </StyledButton>
                    {exportMenuOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #ccc',
                          boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
                          zIndex: 1,
                        }}
                      >
                        <StyledButton
                          variant="secondary"
                          onClick={() => {
                            setExportMenuOpen(false);
                            exportCurrentDocumentAnnotations();
                          }}
                          style={{ width: '100%', textAlign: 'left' }}
                        >
                          Export Current Document
                        </StyledButton>
                        <StyledButton
                          variant="secondary"
                          onClick={() => {
                            setExportMenuOpen(false);
                            exportAllUserAnnotations();
                          }}
                          style={{ width: '100%', textAlign: 'left' }}
                        >
                          Export All My Annotations
                        </StyledButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {annotations.length > 0 ? (
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {annotations.map((annotation) => (
                    <AnnotationItem
                      key={annotation.id}
                      annotation={annotation}
                      onDelete={handleAnnotationDelete}
                      onUpdate={handleAnnotationUpdate}
                    />
                  ))}
                </div>
              ) : (
                <p>No annotations found for this article.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
