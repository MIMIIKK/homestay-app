import React from 'react';

const Captcha = ({ captcha, onRefresh }) => (
  <div className="mb-3">
    <label className="form-label">CAPTCHA Verification</label>
    <div className="d-flex align-items-center gap-3 p-2 border rounded bg-light">
      {captcha?.image && (
        <img
          src={`data:image/png;base64,${captcha.image}`}
          alt="captcha"
          style={{ border: '1px solid #ccc', height: '50px' }}
        />
      )}
      <button type="button" className="btn btn-outline-dark btn-sm" onClick={onRefresh}>
        Refresh CAPTCHA
      </button>
    </div>
  </div>
);

export default Captcha;