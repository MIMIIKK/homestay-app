import React from 'react';

const PasswordStrengthBar = ({ password }) => {
  const checks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
    { label: "One symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter(c => c.valid).length;
  const getColor = () => {
    if (score <= 2) return 'danger';
    if (score === 3 || score === 4) return 'warning';
    return 'success';
  };

  return (
    <div className="mt-2">
      {/* Progress bar */}
      <div className="progress mb-2" style={{ height: '6px' }}>
        <div
          className={`progress-bar bg-${getColor()}`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="list-unstyled small">
        {checks.map((item, index) => (
          <li key={index} className={`d-flex align-items-center ${item.valid ? 'text-success' : 'text-muted'}`}>
            <span className="me-2">
              {item.valid ? '✔️' : '❌'}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthBar;
