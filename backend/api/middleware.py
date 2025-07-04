# Create this file as: backend/api/middleware.py

import time
import json
from django.http import JsonResponse
from django.core.cache import cache
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from .utils import get_client_ip

class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware for API endpoints
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limits = getattr(settings, 'RATE_LIMIT_SETTINGS', {
            'REGISTRATION_LIMIT': 3,
            'LOGIN_LIMIT': 5,
            'CAPTCHA_LIMIT': 10,
            'LOCKOUT_DURATION': 3600,
        })
        super().__init__(get_response)
    
    def process_request(self, request):
        # Only apply rate limiting to specific endpoints
        if not self.should_rate_limit(request.path):
            return None
            
        ip_address = get_client_ip(request)
        
        # Check if IP is currently locked out
        if self.is_ip_locked(ip_address):
            return JsonResponse({
                'error': 'Too many requests. Please try again later.',
                'retry_after': self.get_lockout_remaining(ip_address)
            }, status=429)
        
        # Check rate limits for specific endpoints
        if request.path.endswith('/register/') and request.method == 'POST':
            if self.is_rate_limited(ip_address, 'registration', self.rate_limits['REGISTRATION_LIMIT']):
                self.lock_ip(ip_address)
                return JsonResponse({
                    'error': 'Too many registration attempts. Please try again later.',
                    'retry_after': self.rate_limits['LOCKOUT_DURATION']
                }, status=429)
        
        elif request.path.endswith('/login/') and request.method == 'POST':
            if self.is_rate_limited(ip_address, 'login', self.rate_limits['LOGIN_LIMIT']):
                self.lock_ip(ip_address)
                return JsonResponse({
                    'error': 'Too many login attempts. Please try again later.',
                    'retry_after': self.rate_limits['LOCKOUT_DURATION']
                }, status=429)
        
        elif request.path.endswith('/captcha/') and request.method == 'GET':
            if self.is_rate_limited(ip_address, 'captcha', self.rate_limits['CAPTCHA_LIMIT']):
                return JsonResponse({
                    'error': 'Too many CAPTCHA requests. Please try again later.',
                    'retry_after': 300  # 5 minutes
                }, status=429)
        
        return None
    
    def should_rate_limit(self, path):
        """Check if the path should be rate limited"""
        rate_limited_paths = [
            '/api/register/',
            '/api/login/',
            '/api/captcha/',
            '/api/otp/verify/',
            '/api/otp/resend/',
            '/api/password/reset/',
        ]
        return any(path.endswith(limited_path) for limited_path in rate_limited_paths)
    
    def is_rate_limited(self, ip_address, action, limit):
        """Check if IP has exceeded rate limit for specific action"""
        cache_key = f"rate_limit:{ip_address}:{action}"
        current_time = int(time.time())
        window_start = current_time - 3600  # 1 hour window
        
        # Get existing attempts
        attempts = cache.get(cache_key, [])
        
        # Remove attempts outside the window
        attempts = [attempt for attempt in attempts if attempt > window_start]
        
        # Check if limit exceeded
        if len(attempts) >= limit:
            return True
        
        # Add current attempt
        attempts.append(current_time)
        cache.set(cache_key, attempts, 3600)  # Store for 1 hour
        
        return False
    
    def is_ip_locked(self, ip_address):
        """Check if IP is currently locked out"""
        cache_key = f"ip_lockout:{ip_address}"
        lockout_time = cache.get(cache_key)
        
        if lockout_time:
            return int(time.time()) < lockout_time
        
        return False
    
    def lock_ip(self, ip_address):
        """Lock an IP address"""
        cache_key = f"ip_lockout:{ip_address}"
        lockout_until = int(time.time()) + self.rate_limits['LOCKOUT_DURATION']
        cache.set(cache_key, lockout_until, self.rate_limits['LOCKOUT_DURATION'])
    
    def get_lockout_remaining(self, ip_address):
        """Get remaining lockout time"""
        cache_key = f"ip_lockout:{ip_address}"
        lockout_time = cache.get(cache_key, 0)
        remaining = lockout_time - int(time.time())
        return max(0, remaining)

class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to responses
    """
    
    def process_response(self, request, response):
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        # Add CORS headers for API responses
        if request.path.startswith('/api/'):
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
        
        return response

class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log suspicious requests for security monitoring
    """
    
    def process_request(self, request):
        # Log suspicious patterns
        suspicious_patterns = [
            'sql injection',
            'script',
            'eval(',
            'base64',
            '../',
            '<?php',
            '<script',
            'union select',
            'drop table',
            'insert into',
            'update set',
            'delete from'
        ]
        
        request_data = ''
        if request.body:
            try:
                request_data = request.body.decode('utf-8').lower()
            except:
                request_data = str(request.body).lower()
        
        query_string = request.META.get('QUERY_STRING', '').lower()
        
        # Check for suspicious patterns
        for pattern in suspicious_patterns:
            if pattern in request_data or pattern in query_string:
                self.log_suspicious_request(request, pattern)
                break
        
        return None
    
    def log_suspicious_request(self, request, pattern):
        """Log suspicious request"""
        from .models import SecurityLog
        
        try:
            SecurityLog.objects.create(
                log_type='suspicious_activity',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={
                    'pattern': pattern,
                    'path': request.path,
                    'method': request.method,
                    'query_string': request.META.get('QUERY_STRING', ''),
                    'user_id': request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None
                }
            )
        except Exception as e:
            # Fail silently to avoid breaking the request
            pass