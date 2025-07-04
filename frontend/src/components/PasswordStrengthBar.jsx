import React, { useState, useEffect } from 'react';

const PasswordStrengthBar = ({ password, username = '', email = '' }) => {
  const [strength, setStrength] = useState({
    score: 0,
    level: 'Very Weak',
    feedback: [],
    color: 'danger',
    percentage: 0
  });

  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    'dragon', 'master', 'hello', 'login', 'superman', 'princess'
  ];

  const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', '1234567890'];

  useEffect(() => {
    if (!password) {
      setStrength({
        score: 0,
        level: 'Very Weak',
        feedback: [],
        color: 'danger',
        percentage: 0
      });
      return;
    }

    calculateStrength(password);
  }, [password, username, email]);

  const calculateStrength = (pwd) => {
    let score = 0;
    let feedback = [];
    const maxScore = 10;

    // Length checks
    if (pwd.length >= 8) {
      score += 2;
    } else if (pwd.length >= 6) {
      score += 1;
      feedback.push('Password should be at least 8 characters long');
    } else {
      feedback.push('Password is too short (minimum 8 characters)');
    }

    // Character variety checks
    const checks = [
      { regex: /[A-Z]/, message: 'Add uppercase letters (A-Z)', points: 1 },
      { regex: /[a-z]/, message: 'Add lowercase letters (a-z)', points: 1 },
      { regex: /\d/, message: 'Add numbers (0-9)', points: 1 },
      { regex: /[^A-Za-z0-9]/, message: 'Add special characters (!@#$%^&*)', points: 1 }
    ];

    checks.forEach(check => {
      if (check.regex.test(pwd)) {
        score += check.points;
      } else {
        feedback.push(check.message);
      }
    });

    // Bonus points for longer passwords
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;

    // Security penalties
    const penalties = [];

    // Check for repeated characters
    if (/(.)\1{2,}/.test(pwd)) {
      score -= 1;
      penalties.push('Avoid repeated characters (aaa, 111)');
    }

    // Check for sequential patterns
    if (/012|123|234|345|456|567|678|789|890/.test(pwd)) {
      score -= 1;
      penalties.push('Avoid sequential numbers (123, 456)');
    }

    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(pwd)) {
      score -= 1;
      penalties.push('Avoid sequential letters (abc, def)');
    }

    // Check for common passwords
    if (commonPasswords.some(common => pwd.toLowerCase().includes(common))) {
      score -= 2;
      penalties.push('Avoid common passwords');
    }

    // Check for keyboard patterns
    if (keyboardPatterns.some(pattern => pwd.toLowerCase().includes(pattern))) {
      score -= 1;
      penalties.push('Avoid keyboard patterns (qwerty, asdfgh)');
    }

    // Check similarity with username
    if (username && username.length > 2 && pwd.toLowerCase().includes(username.toLowerCase())) {
      score -= 2;
      penalties.push('Password should not contain your username');
    }

    // Check similarity with email
    if (email) {
      const emailParts = email.split('@')[0].split('.');
      for (let part of emailParts) {
        if (part.length > 2 && pwd.toLowerCase().includes(part.toLowerCase())) {
          score -= 1;
          penalties.push('Password should not contain parts of your email');
          break;
        }
      }
    }

    // Dictionary words check (simplified)
    const commonWords = ['password', 'admin', 'user', 'login', 'welcome', 'hello', 'world', 'computer', 'internet'];
    for (let word of commonWords) {
      if (pwd.toLowerCase().includes(word)) {
        score -= 1;
        penalties.push(`Avoid common words like "${word}"`);
        break;
      }
    }

    // Combine feedback
    feedback = [...feedback, ...penalties];

    // Calculate final score (0-10)
    score = Math.max(0, Math.min(maxScore, score));

    // Determine strength level and color
    let level, color;
    if (score >= 8) {
      level = 'Very Strong';
      color = 'success';
    } else if (score >= 6) {
      level = 'Strong';
      color = 'success';
    } else if (score >= 4) {
      level = 'Moderate';
      color = 'warning';
    } else if (score >= 2) {
      level = 'Weak';
      color = 'danger';
    } else {
      level = 'Very Weak';
      color = 'danger';
    }

    const percentage = (score / maxScore) * 100;

    setStrength({
      score,
      level,
      feedback,
      color,
      percentage
    });
  };

  const getStrengthIcon = () => {
    switch (strength.level) {
      case 'Very Strong':
        return '🛡️';
      case 'Strong':
        return '💪';
      case 'Moderate':
        return '⚠️';
      case 'Weak':
        return '🔓';
      default:
        return '❌';
    }
  };

  const getProgressBarVariant = () => {
    if (strength.percentage >= 80) return 'success';
    if (strength.percentage >= 60) return 'info';
    if (strength.percentage >= 40) return 'warning';
    return 'danger';
  };

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2">
      {/* Strength indicator */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center">
          <span className="me-2">{getStrengthIcon()}</span>
          <span className={`fw-bold text-${strength.color}`}>
            {strength.level}
          </span>
        </div>
        <small className="text-muted">
          {strength.score}/10
        </small>
      </div>

      {/* Progress bar */}
      <div className="progress mb-3" style={{ height: '8px' }}>
        <div
          className={`progress-bar bg-${getProgressBarVariant()}`}
          role="progressbar"
          style={{ width: `${strength.percentage}%` }}
          aria-valuenow={strength.percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        >
        </div>
      </div>

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div className="card border-0 bg-light">
          <div className="card-body p-3">
            <h6 className="card-title text-muted mb-2">
              <i className="bi bi-lightbulb me-1"></i>
              Password Suggestions:
            </h6>
            <ul className="list-unstyled mb-0">
              {strength.feedback.slice(0, 4).map((item, index) => (
                <li key={index} className="small text-muted mb-1">
                  <i className="bi bi-arrow-right me-1"></i>
                  {item}
                </li>
              ))}
              {strength.feedback.length > 4 && (
                <li className="small text-muted">
                  <i className="bi bi-three-dots me-1"></i>
                  And {strength.feedback.length - 4} more suggestions...
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Security tips for strong passwords */}
      {strength.score >= 8 && (
        <div className="alert alert-success alert-sm mt-2 p-2">
          <i className="bi bi-check-circle me-1"></i>
          <small>Excellent! Your password is very secure.</small>
        </div>
      )}

      {/* Detailed requirements checklist */}
      <div className="mt-3">
        <small className="text-muted">Password Requirements:</small>
        <div className="row mt-2">
          <div className="col-md-6">
            <RequirementCheck 
              met={password.length >= 8} 
              text="At least 8 characters" 
            />
            <RequirementCheck 
              met={/[A-Z]/.test(password)} 
              text="Uppercase letter" 
            />
            <RequirementCheck 
              met={/[a-z]/.test(password)} 
              text="Lowercase letter" 
            />
          </div>
          <div className="col-md-6">
            <RequirementCheck 
              met={/\d/.test(password)} 
              text="Number" 
            />
            <RequirementCheck 
              met={/[^A-Za-z0-9]/.test(password)} 
              text="Special character" 
            />
            <RequirementCheck 
              met={!commonPasswords.some(common => password.toLowerCase().includes(common))} 
              text="Not a common password" 
            />
          </div>
        </div>
      </div>

      {/* Additional security info */}
      {password && (
        <div className="mt-3">
          <div className="d-flex justify-content-between text-muted small">
            <span>Length: {password.length} characters</span>
            <span>Entropy: ~{calculateEntropy(password).toFixed(1)} bits</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for requirement checks
const RequirementCheck = ({ met, text }) => (
  <div className={`small d-flex align-items-center mb-1 ${met ? 'text-success' : 'text-muted'}`}>
    <span className="me-2">
      {met ? (
        <i className="bi bi-check-circle-fill"></i>
      ) : (
        <i className="bi bi-circle"></i>
      )}
    </span>
    {text}
  </div>
);

// Calculate password entropy
const calculateEntropy = (password) => {
  if (!password) return 0;
  
  let charSpace = 0;
  if (/[a-z]/.test(password)) charSpace += 26;
  if (/[A-Z]/.test(password)) charSpace += 26;
  if (/\d/.test(password)) charSpace += 10;
  if (/[^A-Za-z0-9]/.test(password)) charSpace += 32;
  
  if (charSpace === 0) return 0;
  
  return password.length * Math.log2(charSpace);
};

export default PasswordStrengthBar;