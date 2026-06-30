import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Image from 'react-bootstrap/Image';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [url, setUrl] = useState('');
  const [adCopy, setAdCopy] = useState('');
  const [adImages, setAdImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      setAdImages(prev => [...prev, ...newImages]);
      
      // Create preview URLs
      const newPreviews = [];
      for (const file of newImages) {
        newPreviews.push(URL.createObjectURL(file));
      }
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...adImages];
    newImages.splice(index, 1);
    setAdImages(newImages);
    
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    
    if (!url.trim()) {
      setError('Please enter a landing page URL');
      return;
    }
    
    if (!adCopy.trim() && adImages.length === 0) {
      setError('Please provide ad copy text or upload ad images');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('url', url.trim());
      
      if (adCopy.trim()) {
        formData.append('adCopy', adCopy.trim());
      }
      
      // Add images
      adImages.forEach((image, index) => {
        formData.append('adImages', image, image.name);
      });
      
      const response = await axios.post('https://ad-to-landing-page-llm.onrender.com/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setResult(response.data);
    } catch (err) {
      console.error('Analysis error:', err);
      if (err.response) {
        setError(err.response.data.error || 'Analysis failed');
      } else if (err.request) {
        setError('No response from server. Please check if the backend is running.');
      } else {
        setError('An error occurred during analysis');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold text-primary">Ad-to-Landing Page Mismatch Detector</h1>
        <p className="lead text-muted">Analyze the alignment between your ad copy and landing page experience</p>
      </div>
      
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      
      <form onSubmit={handleSubmit} className="row g-4 needs-validation" noValidate>
        <div className="col-md-6">
          <Form.Group className="mb-3" controlId="url">
            <Form.Label>Landing Page URL</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://example.com/landing-page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please provide a valid URL
            </Form.Control.Feedback>
          </Form.Group>
        </div>
        
        <div className="col-md-6">
          <Form.Group className="mb-3" controlId="adCopy">
            <Form.Label>Ad Copy Text (optional if using images)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe your ad offer, target audience, etc."
              value={adCopy}
              onChange={(e) => setAdCopy(e.target.value)}
            />
            <Form.Text className="text-muted">
              You can provide ad copy text here or upload ad screenshots below
            </Form.Text>
          </Form.Group>
        </div>
        
        <div className="col-12">
          <Form.Group className="mb-3" controlId="adImages">
            <Form.Label>Ad Screenshots (optional)</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              multiple
              onClick={(e) => {
                // Clear previous selection to allow re-selecting same file
                e.target.value = '';
              }}
              onChange={handleImageChange}
              isInvalid={adImages.length > 0 && previewUrls.length !== adImages.length}
            />
            <Form.Text className="text-muted">
              Supported formats: JPG, PNG, GIF (max 5MB each)
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              Please upload valid image files
            </Form.Control.Feedback>
          </Form.Group>
          
          {previewUrls.length > 0 && (
            <div className="mb-3">
              <Form.Label>Previews:</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="position-relative">
                    <Image src={url} alt={`Ad preview ${index+1}`} fluid rounded 
                           style={{ maxWidth: '150px', height: 'auto' }} />
                    <div className="position-absolute top-0 start-100 translate-middle bg-danger rounded-circle p-1">
                      <Button 
                        variant="link"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="text-white p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="col-12">
          <div className="d-grid gap-2">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" role="status" aria-label="Loading" />
                  &nbsp; Analyzing...
                </>
              ) : (
                'Analyze Mismatch'
              )}
            </Button>
          </div>
        </div>
      </form>
      
      {result && (
        <>
          <hr className="my-5" />
          <h2 className="mb-4">Analysis Results</h2>
          <ResultsDisplay data={result.data} />
        </>
      )}
    </Container>
  );
}

export default App;