import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Editor from './components/Editor';
import SearchBar from './components/SearchBar';

function AnnotationItem({ annotation, onDelete }) {
  const [comments, setComments] = useState(annotation.comments || []);
  const [commentInputOpen, setCommentInputOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

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
          right: '0',
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
      <p><strong>Category:</strong> {annotation.category}</p>
      <p><strong>Subcategory:</strong> {annotation.subcategory}</p>
      <p><strong>Highlighted Text:</strong></p>
      <p style={{ backgroundColor: '#f9f9f9', padding: '5px' }}>{annotation.highlighted_text}</p>

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

    axios.get(`http://localhost:8000/annotations/article/${article.id}`)
      .then(response => {
        setAnnotations(response.data);
      })
      .catch(error => {
        console.error('Error fetching annotations:', error);
      });
  };

  const handleAnalyze = () => {
    if (selectedArticle && selectedArticle.text) {
      axios.post('http://localhost:8000/analyze', { text: selectedArticle.text })
        .then(response => {
          console.log('Analysis result:', response.data);
        })
        .catch(error => {
          console.error('Error analyzing text:', error);
        });
    }
  };

  const handleTextSelect = (data) => {
    setHighlightData(data);
  };

  const handleSaveAnnotation = () => {
    if (highlightData && selectedCategory && selectedOption) {
      const color = getColorForCategory(selectedCategory);

      if (editorRef.current && editorRef.current.addHighlight) {
        editorRef.current.addHighlight(highlightData.from, highlightData.to, color);
      }

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
          axios.get(`http://localhost:8000/annotations/article/${selectedArticle.id}`)
            .then(res => {
              setAnnotations(res.data);
            })
            .catch(err => {
              console.error('Error fetching annotations:', err);
            });
        })
        .catch(error => {
          console.error('Error saving annotation:', error);
        });

      setHighlightData(null);
      setSelectedCategory('');
      setSelectedOption('');
    } else {
      alert('Please select text and choose a category and subcategory before saving.');
    }
  };

  const handleAnnotationDelete = (deletedAnnotationId) => {
    setAnnotations(annotations.filter(a => a.id !== deletedAnnotationId));
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
    return categoryColors[categoryId] || '#FFFF00'; // Default to yellow
  };

  const formatMetadata = (article) => {
    return (
      <>
        <p><strong>Title:</strong> {article.title || 'N/A'}</p>
        <p><strong>Author:</strong> {article.author || 'N/A'}</p>
        <p><strong>Source:</strong> {article.source || 'N/A'}</p>
        <p><strong>Topic:</strong> {article.topic || 'N/A'}</p>
        <p><strong>Published Date:</strong> {article.published_date ? new Date(article.published_date).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Modified Date:</strong> {article.modified_date ? new Date(article.modified_date).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Membership:</strong> {article.membership || 'N/A'}</p>
        <p><strong>Language:</strong> {article.language || 'N/A'}</p>
        <hr />
      </>
    );
  };

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <SearchBar
        onArticlesFetched={handleArticlesFetched}
        onClearSearchTrigger={clearSearchTrigger}
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
              {article.title || 'Untitled Article'}
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

export default App;
