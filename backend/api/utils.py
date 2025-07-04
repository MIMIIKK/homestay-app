import re
import random
import string
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import io
import base64
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import SecurityLog

# Common passwords list (you should expand this or use a library like django-passwords)
COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    'qwerty123', 'dragon', 'master', 'hello', 'login', 'welcome123',
    'superman', 'princess', 'sunshine', 'iloveyou', 'football', 'charlie',
    'shadow', 'michael', 'jennifer', 'jordan', 'michelle', 'daniel',
    'anthony', 'joshua', 'andrew', 'david', 'james', 'robert', 'john',
    'william', 'richard', 'thomas', 'mark', 'charles', 'steven', 'paul',
    'kevin', 'jason', 'matthew', 'gary', 'timothy', 'jose', 'larry',
    'jeffrey', 'frank', 'scott', 'eric', 'stephen', 'andrew', 'raymond',
    'joshua', 'jerry', 'dennis', 'walter', 'patrick', 'peter', 'harold',
    'douglas', 'henry', 'carl', 'arthur', 'ryan', 'roger', 'joe',
    'juan', 'jack', 'albert', 'jonathan', 'wayne', 'ralph', 'roy',
    'eugene', 'louis', 'philip', 'bobby', 'noah', 'austin', 'sean',
    'brooklyn', 'emma', 'olivia', 'sophia', 'ava', 'isabella', 'mia',
    'amelia', 'harper', 'evelyn', 'abigail', 'emily', 'elizabeth',
    'mila', 'ella', 'avery', 'sofia', 'camila', 'aria', 'scarlett',
    'victoria', 'madison', 'luna', 'grace', 'chloe', 'penelope',
    'layla', 'riley', 'zoey', 'nora', 'lily', 'eleanor', 'hannah',
    'lillian', 'addison', 'aubrey', 'ellie', 'stella', 'natalie',
    'zoe', 'leah', 'hazel', 'violet', 'aurora', 'savannah', 'audrey',
    'brooklyn', 'bella', 'claire', 'skylar', 'lucy', 'paisley', 'everly',
    'anna', 'caroline', 'nova', 'genesis', 'emilia', 'kennedy', 'samantha',
    'maya', 'willow', 'kinsley', 'naomi', 'aaliyah', 'elena', 'sarah',
    'ariana', 'allison', 'gabriella', 'alice', 'madelyn', 'cora', 'ruby',
    'eva', 'serenity', 'autumn', 'adeline', 'hailey', 'gianna', 'valentina',
    'isla', 'eliana', 'quinn', 'nevaeh', 'ivy', 'sadie', 'piper', 'lydia',
    'alexa', 'josephine', 'emery', 'julia', 'delilah', 'arianna', 'vivian',
    'kaylee', 'sophie', 'brielle', 'madeline', 'peyton', 'rylee', 'clara',
    'hadley', 'melanie', 'mackenzie', 'reagan', 'adalynn', 'liliana',
    'maria', 'amanda', 'stephanie', 'melissa', 'nicole', 'jessica',
    'elizabeth', 'helen', 'sharon', 'cynthia', 'kathleen', 'amy',
    'anna', 'shirley', 'brenda', 'emma', 'carol', 'pamela', 'catherine',
    'janet', 'frances', 'martha', 'janice', 'gloria', 'cheryl', 'andrea',
    'hannah', 'jacqueline', 'megan', 'samantha', 'caroline', 'julia',
    'rachel', 'marie', 'janet', 'virginia', 'maria', 'heather', 'diane',
    'ruth', 'julie', 'joyce', 'victoria', 'kelly', 'christina', 'joan',
    'evelyn', 'lauren', 'judith', 'megan', 'sarah', 'cheryl', 'andrea',
    'donna', 'marie', 'janet', 'cathrine', 'frances', 'martha', 'janice',
    'gloria', 'cheryl', 'andrea', 'hannah', 'jacqueline', 'megan', 'samantha',
    'caroline', 'julia', 'rachel', 'marie', 'janet', 'virginia', 'maria',
    'heather', 'diane', 'ruth', 'julie', 'joyce', 'victoria', 'kelly',
    'christina', 'joan', 'evelyn', 'lauren', 'judith', 'megan', 'sarah',
    'cheryl', 'andrea', 'donna', 'marie', 'janet', 'cathrine', 'frances',
    'martha', 'janice', 'gloria'
]

def check_password_strength(password):
    """Enhanced password strength checker with detailed analysis"""
    if not password:
        return {"score": 0, "strength": "Very Weak", "feedback": ["Password is required"]}
    
    feedback = []
    score = 0
    max_score = 10
    
    # Length check
    if len(password) >= 8:
        score += 2
    elif len(password) >= 6:
        score += 1
        feedback.append("Password should be at least 8 characters long")
    else:
        feedback.append("Password is too short (minimum 8 characters)")
    
    # Character variety checks
    if re.search(r'[A-Z]', password):
        score += 1
    else:
        feedback.append("Add uppercase letters")
    
    if re.search(r'[a-z]', password):
        score += 1
    else:
        feedback.append("Add lowercase letters")
    
    if re.search(r'\d', password):
        score += 1
    else:
        feedback.append("Add numbers")
    
    if re.search(r'[^A-Za-z0-9]', password):
        score += 1
    else:
        feedback.append("Add special characters (!@#$%^&*)")
    
    # Bonus points for longer passwords
    if len(password) >= 12:
        score += 1
    if len(password) >= 16:
        score += 1
    
    # Penalty for common patterns
    if re.search(r'(.)\1{2,}', password):  # Repeated characters
        score -= 1
        feedback.append("Avoid repeated characters")
    
    if re.search(r'(012|123|234|345|456|567|678|789|890)', password):
        score -= 1
        feedback.append("Avoid sequential numbers")
    
    if re.search(r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', password.lower()):
        score -= 1
        feedback.append("Avoid sequential letters")
    
    # Determine strength
    if score >= 8:
        strength = "Very Strong"
    elif score >= 6:
        strength = "Strong"
    elif score >= 4:
        strength = "Moderate"
    elif score >= 2:
        strength = "Weak"
    else:
        strength = "Very Weak"
    
    return {
        "score": max(0, score),
        "max_score": max_score,
        "strength": strength,
        "feedback": feedback
    }

def validate_password_security(password, username=None, email=None):
    """Comprehensive password security validation"""
    errors = []
    
    # Basic strength check
    strength_result = check_password_strength(password)
    
    if strength_result["score"] < 4:
        errors.extend(strength_result["feedback"])
    
    # Check against common passwords
    if password.lower() in [p.lower() for p in COMMON_PASSWORDS]:
        errors.append("Password is too common. Choose a more unique password.")
    
    # Check similarity with username
    if username and username.lower() in password.lower():
        errors.append("Password should not contain your username.")
    
    # Check similarity with email
    if email:
        email_parts = email.split('@')[0].split('.')
        for part in email_parts:
            if len(part) > 2 and part.lower() in password.lower():
                errors.append("Password should not contain parts of your email address.")
    
    # Check for dictionary words (simplified check)
    common_words = ['password', 'admin', 'user', 'login', 'welcome', 'hello', 'world']
    for word in common_words:
        if word in password.lower():
            errors.append(f"Password should not contain common words like '{word}'.")
    
    # Check for keyboard patterns
    keyboard_patterns = ['qwerty', 'qwertyuiop', 'asdfgh', 'zxcvbn', '1234567890']
    for pattern in keyboard_patterns:
        if pattern in password.lower():
            errors.append("Avoid keyboard patterns in your password.")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "strength": strength_result["strength"],
        "score": strength_result["score"]
    }

def calculate_password_entropy(password):
    """Calculate password entropy for security measurement"""
    if not password:
        return 0
    
    char_space = 0
    if re.search(r'[a-z]', password):
        char_space += 26
    if re.search(r'[A-Z]', password):
        char_space += 26
    if re.search(r'\d', password):
        char_space += 10
    if re.search(r'[^A-Za-z0-9]', password):
        char_space += 32
    
    if char_space == 0:
        return 0
    
    entropy = len(password) * math.log2(char_space)
    return entropy

def generate_captcha_text(length=6):
    """Generate random text for image CAPTCHA"""
    # Avoid confusing characters
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'
    return ''.join(random.choices(chars, k=length))

def generate_math_captcha():
    """Generate math-based CAPTCHA"""
    operations = ['+', '-', '*']
    operation = random.choice(operations)
    
    if operation == '+':
        a = random.randint(1, 50)
        b = random.randint(1, 50)
        question = f"What is {a} + {b}?"
        answer = str(a + b)
    elif operation == '-':
        a = random.randint(10, 100)
        b = random.randint(1, a)
        question = f"What is {a} - {b}?"
        answer = str(a - b)
    else:  # multiplication
        a = random.randint(1, 12)
        b = random.randint(1, 12)
        question = f"What is {a} × {b}?"
        answer = str(a * b)
    
    return question, answer

def generate_captcha_image(text):
    """Generate image CAPTCHA with enhanced security"""
    width, height = 200, 80
    img = Image.new('RGB', (width, height), (255, 255, 255))
    
    try:
        # Try to load a system font
        font = ImageFont.truetype("arial.ttf", 36)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 36)
        except:
            font = ImageFont.load_default()
    
    draw = ImageDraw.Draw(img)
    
    # Add background noise
    for _ in range(200):
        x = random.randint(0, width)
        y = random.randint(0, height)
        draw.point((x, y), fill=(
            random.randint(100, 200),
            random.randint(100, 200),
            random.randint(100, 200)
        ))
    
    # Add lines for extra security
    for _ in range(5):
        x1 = random.randint(0, width)
        y1 = random.randint(0, height)
        x2 = random.randint(0, width)
        y2 = random.randint(0, height)
        draw.line([(x1, y1), (x2, y2)], fill=(
            random.randint(0, 100),
            random.randint(0, 100),
            random.randint(0, 100)
        ), width=2)
    
    # Draw distorted characters
    for i, char in enumerate(text):
        x = 20 + i * 25 + random.randint(-5, 5)
        y = random.randint(10, 25)
        angle = random.randint(-15, 15)
        
        # Create a temporary image for rotation
        temp_img = Image.new('RGBA', (50, 50), (255, 255, 255, 0))
        temp_draw = ImageDraw.Draw(temp_img)
        temp_draw.text((10, 10), char, font=font, fill=(
            random.randint(0, 100),
            random.randint(0, 100),
            random.randint(150, 255)
        ))
        
        # Rotate and paste
        rotated = temp_img.rotate(angle, expand=1)
        img.paste(rotated, (x, y), rotated)
    
    # Apply blur for bot resistance
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def send_otp_email(user, otp_code, otp_type='login'):
    """Send OTP via email with enhanced error handling"""
    if otp_type == 'login':
        subject = 'Your Login Verification Code - Homestay'
        message = f"""
Hi {user.first_name or user.username},

Your login verification code is: {otp_code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Homestay Team
        """
    elif otp_type == 'email':
        subject = 'Verify Your Email Address - Homestay'
        message = f"""
Hi {user.first_name or user.username},

Welcome to Homestay! Your email verification code is: {otp_code}

This code will expire in 10 minutes.

Please enter this code to activate your account.

Best regards,
Homestay Team
        """
    else:
        subject = 'Your Verification Code - Homestay'
        message = f"""
Hi {user.first_name or user.username},

Your verification code is: {otp_code}

This code will expire in 10 minutes.

Best regards,
Homestay Team
        """
    
    try:
        # Get email settings with fallbacks
        from_email = getattr(settings, 'EMAIL_HOST_USER', None) or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@homestay.com')
        
        print(f"DEBUG: Attempting to send email to {user.email}")
        print(f"DEBUG: From email: {from_email}")
        print(f"DEBUG: Subject: {subject}")
        print(f"DEBUG: OTP Code: {otp_code}")
        
        result = send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        print(f"DEBUG: Email send result: {result}")
        print(f"DEBUG: Email sent successfully to {user.email}")
        return True
        
    except Exception as e:
        print(f"DEBUG: Failed to send email: {str(e)}")
        print(f"DEBUG: Exception type: {type(e).__name__}")
        
        # Log the full error for debugging
        import traceback
        print(f"DEBUG: Full traceback: {traceback.format_exc()}")
        
        return False

def send_otp_sms(user, otp_code):
    """Send OTP via SMS (implement with your SMS provider)"""
    # Implement SMS sending logic here
    # This is a placeholder - you'll need to integrate with an SMS service
    # like Twilio, AWS SNS, etc.
    message = f"Your Homestay verification code is: {otp_code}. Valid for 10 minutes."
    
    # Placeholder implementation
    print(f"SMS to {user.phone}: {message}")
    return True

def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_security_event(user, log_type, ip_address, user_agent, details=None):
    """Log security events for monitoring"""
    try:
        SecurityLog.objects.create(
            user=user,
            log_type=log_type,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {}
        )
    except Exception as e:
        print(f"Failed to log security event: {e}")

def is_suspicious_activity(user, ip_address):
    """Check for suspicious activity patterns"""
    from datetime import timedelta
    
    # Check for multiple failed attempts from same IP
    recent_failures = SecurityLog.objects.filter(
        log_type='login_failure',
        ip_address=ip_address,
        timestamp__gte=timezone.now() - timedelta(hours=1)
    ).count()
    
    if recent_failures >= 10:
        return True
    
    # Check for rapid login attempts
    recent_logins = SecurityLog.objects.filter(
        user=user,
        log_type='login',
        timestamp__gte=timezone.now() - timedelta(minutes=5)
    ).count()
    
    if recent_logins >= 5:
        return True
    
    return False

def generate_secure_filename(filename):
    """Generate secure filename for uploads"""
    import os
    import uuid
    
    # Get file extension
    _, ext = os.path.splitext(filename)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{ext}"
    
    return unique_filename

def validate_file_upload(file, allowed_types=None, max_size=5*1024*1024):
    """Validate file uploads for security"""
    errors = []
    
    if not file:
        errors.append("No file provided")
        return errors
    
    # Check file size
    if file.size > max_size:
        errors.append(f"File too large (max {max_size//1024//1024}MB)")
    
    # Check file type
    if allowed_types:
        if not any(file.content_type.startswith(t) for t in allowed_types):
            errors.append(f"File type not allowed. Allowed types: {', '.join(allowed_types)}")
    
    # Check for malicious filenames
    dangerous_patterns = ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*']
    for pattern in dangerous_patterns:
        if pattern in file.name:
            errors.append("Filename contains dangerous characters")
            break
    
    return errors