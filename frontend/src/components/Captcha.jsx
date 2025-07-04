import React from 'react';

const Captcha = ({ captcha, onRefresh }) => {
  if (!captcha) {
    return (
      <div className="text-center">
        <p>Loading CAPTCHA...</p>
      </div>
    );
  }

  console.log('CAPTCHA data:', captcha); // Debug log

  return (
    <div className="mb-3">
      <label className="form-label">Security Verification</label>
      
      {/* Debug information */}
      <div className="alert alert-info small">
        <strong>Debug Info:</strong><br/>
        Session ID: {captcha.session_id}<br/>
        Type: {captcha.type}<br/>
        {captcha.type === 'math' && `Question: ${captcha.question}`}
        {captcha.type === 'image' && `Image length: ${captcha.image ? captcha.image.length : 'No image'}`}
      </div>
      
      <div className="card">
        <div className="card-body text-center">
          {captcha.type === 'math' ? (
            <div>
              <h4 className="text-primary">{captcha.question}</h4>
              <p className="text-muted">Solve the math problem above</p>
            </div>
          ) : (
            <div>
              {captcha.image ? (
                <img 
                  src={`data:image/png;base64,${captcha.image}`} 
                  alt="CAPTCHA" 
                  className="img-fluid"
                  style={{ maxHeight: '80px' }}
                />
              ) : (
                <p className="text-danger">No CAPTCHA image available</p>
              )}
              <p className="text-muted mt-2">Enter the characters shown above</p>
            </div>
          )}
          
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm mt-2"
            onClick={onRefresh}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            New CAPTCHA
          </button>
        </div>
      </div>
    </div>
  );
};

export default Captcha;