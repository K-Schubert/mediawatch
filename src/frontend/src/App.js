import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Editor from './components/Editor';
import SearchBar from './components/SearchBar';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import { setupAxiosInterceptors } from './utils/auth';

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

  return (
    <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', position: 'relative' }}>
      <button
        onClick={handleDelete}
        style={{
          position: 'absolute',
          top: '0',
          right: '10px', // Adjusted position to move it inward
          background: 'transparent',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
        }}
        title="Delete Annotation"
      >
        &#10005; {/* Unicode character for 'X' */}
      </button>

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
          <button onClick={handleSave} style={{ marginRight: '10px' }}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </>
      ) : (
        <>
          <p><strong>Category:</strong> {annotation.category}</p>
          <p><strong>Subcategory:</strong> {annotation.subcategory}</p>
          <p><strong>Highlighted Text:</strong></p>
          <p style={{ backgroundColor: '#f9f9f9', padding: '5px' }}>{annotation.highlighted_text}</p>
          <button onClick={handleEditClick} style={{ marginTop: '10px' }}>Edit</button>
        </>
      )}

      <div style={{ marginTop: '10px' }}>
        <strong>Comments:</strong>
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <div key={index} style={{ marginTop: '5px' }}>
              <p style={{ margin: '0' }}>
                {comment.comment_text} ({comment.user}, {new Date(comment.timestamp).toLocaleString()})
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
            <button onClick={handleCommentSubmit} style={{ marginTop: '5px' }}>Submit Comment</button>
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

function MainApp() {
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

    // Fetch annotations for the selected article
    axios.get(`http://localhost:8000/annotations/article/${article.id}`)
      .then(response => {
        setAnnotations(response.data);

        // Highlight annotations in the editor
        if (editorRef.current && editorRef.current.addHighlight) {
          response.data.forEach(annotation => {
            const { highlighted_text, category, id } = annotation;
            const positions = findAllOccurrences(article.text, highlighted_text);
            const color = getColorForCategory(category);

            positions.forEach(({ from, to }) => {
              editorRef.current.addHighlight(from, to, color, id);
            });
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

          // Update annotations state
          setAnnotations(prevAnnotations => [...prevAnnotations, ...newAnnotations]);

          // Highlight annotations in the editor
          if (editorRef.current && editorRef.current.addHighlight) {
            newAnnotations.forEach(annotation => {
              const { highlighted_text, category, id } = annotation;
              const positions = findAllOccurrences(selectedArticle.text, highlighted_text);
              const color = getColorForCategory(category);

              positions.forEach(({ from, to }) => {
                editorRef.current.addHighlight(from, to, color, id);
              });
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
            const { highlighted_text, category, id } = newAnnotation;
            const positions = findAllOccurrences(selectedArticle.text, highlighted_text);
            const color = getColorForCategory(category);

            positions.forEach(({ from, to }) => {
              editorRef.current.addHighlight(from, to, color, id);
            });
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

      // Add the new highlight
      const { highlighted_text, category, id } = updatedAnnotation;
      const positions = findAllOccurrences(selectedArticle.text, highlighted_text);
      const color = getColorForCategory(category);

      positions.forEach(({ from, to }) => {
        editorRef.current.addHighlight(from, to, color, id);
      });
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

  // Helper function to find all occurrences of highlighted_text in article.text
  const findAllOccurrences = (content, searchText) => {
    const positions = [];
    const normalizedContent = content.toLowerCase();
    const normalizedSearchText = searchText.toLowerCase().trim();
    let startIndex = 0;

    while (startIndex < normalizedContent.length) {
      const index = normalizedContent.indexOf(normalizedSearchText, startIndex);
      if (index === -1) break;

      const from = index;
      const to = from + normalizedSearchText.length;
      positions.push({ from, to });
      startIndex = index + normalizedSearchText.length;
    }

    return positions;
  };

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <SearchBar
        onArticlesFetched={handleArticlesFetched}
        onClearSearchTrigger={clearSearchTrigger}
        onArticleSelect={handleArticleSelect}  // Pass the function here
      />
      {articles.length > 0 && (
        <div style={{
          position: 'absolute',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          width: '100%',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1
        }}>
          {articles.map(article => (
            <div
              key={article.id}
              onClick={() => handleArticleSelect(article)}
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
            >
              <h3>{article.title || 'Untitled Article'}</h3>
              <p>
                <span><strong>Author:</strong> {article.author || 'Unknown'}</span>
                <span style={{ marginLeft: '20px' }}><strong>Publication Date:</strong> {new Date(article.published_date).toLocaleDateString()}</span>
              </p>
            </div>
          ))}
        </div>
      )}
      {selectedArticle && (
        <div style={{ marginTop: '20px', display: 'flex' }}>
          {/* Left Side: Article Details and Editor */}
          <div style={{ flex: 3, marginRight: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Article Details</h2>
              <button
                onClick={handleAnalyze}
                style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
              >
                Analyze
              </button>
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
                  <button
                    onClick={handleSaveAnnotation}
                    style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
                  >
                    Save Annotation
                  </button>
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
          <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Annotation History</h3>
              {/* Export CSV Button */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  style={{ padding: '5px 10px', cursor: 'pointer' }}
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                >
                  Export CSV
                </button>
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
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer' }}
                      onClick={() => {
                        setExportMenuOpen(false);
                        exportCurrentDocumentAnnotations();
                      }}
                    >
                      Export Current Document Annotations
                    </div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer' }}
                      onClick={() => {
                        setExportMenuOpen(false);
                        exportAllUserAnnotations();
                      }}
                    >
                      Export All My Annotations
                    </div>
                  </div>
                )}
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
  );
}

function App() {
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8000/login/logout');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div>
                <nav className="bg-gray-800 p-4">
                  <button
                    onClick={handleLogout}
                    className="float-right text-white bg-red-600 px-4 py-2 rounded"
                  >
                    Logout
                  </button>
                </nav>
                <MainApp />
              </div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
