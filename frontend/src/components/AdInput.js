import React from 'react';
import { Form, Button } from 'react-bootstrap';

const AdInput = ({ adCopy, setAdCopy, adImages, setAdImages, previewUrls, setPreviewUrls, handleImageChange, removeImage }) => {
  return (
    <>
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
        />
        <Form.Text className="text-muted">
          Supported formats: JPG, PNG, GIF (max 5MB each)
        </Form.Text>
        
        {previewUrls.length > 0 && (
          <div className="mt-2">
            <h6>Previews:</h6>
            <div className="d-flex flex-wrap gap-2">
              {previewUrls.map((url, index) => (
                <div key={index} className="position-relative">
                  <img src={url} alt={`Ad preview ${index+1}`} className="img-thumbnail" style={{ maxWidth: '150px', height: 'auto' }} />
                  <button 
                    type="button" 
                    className="btn btn-sm btn-danger position-absolute top-0 end-0" 
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Form.Group>
    </>
  );
};

export default AdInput;