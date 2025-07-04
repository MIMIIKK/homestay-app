from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import random
import string

class User(AbstractUser):
    USER_ROLES = [
        ('guest', 'Guest'),
        ('host', 'Host'),
        ('admin', 'Admin'),
    ]
    
    role = models.CharField(max_length=10, choices=USER_ROLES, default='guest')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Account security fields
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    last_password_change = models.DateTimeField(auto_now_add=True)
    
    # Profile completion
    profile_completion = models.IntegerField(default=0)
    
    def is_account_locked(self):
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False
    
    def lock_account(self, duration_minutes=30):
        self.account_locked_until = timezone.now() + timedelta(minutes=duration_minutes)
        self.save()
    
    def unlock_account(self):
        self.failed_login_attempts = 0
        self.account_locked_until = None
        self.save()
    
    def increment_failed_attempts(self):
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.lock_account()
        self.save()
    
    def calculate_profile_completion(self):
        fields = ['first_name', 'last_name', 'email', 'phone', 'address']
        completed = sum(1 for field in fields if getattr(self, field))
        if self.avatar:
            completed += 1
        self.profile_completion = int((completed / 6) * 100)
        self.save()
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class CaptchaChallenge(models.Model):
    CAPTCHA_TYPES = [
        ('image', 'Image CAPTCHA'),
        ('math', 'Math CAPTCHA'),
        ('text', 'Text CAPTCHA'),
    ]
    
    session_id = models.CharField(max_length=100, unique=True)
    captcha_type = models.CharField(max_length=10, choices=CAPTCHA_TYPES, default='image')
    question = models.CharField(max_length=255)
    answer = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    
    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)
    
    def is_max_attempts_reached(self):
        return self.attempts >= self.max_attempts
    
    def increment_attempts(self):
        self.attempts += 1
        self.save()
    
    def __str__(self):
        return f"Captcha for {self.session_id} - {self.captcha_type}"

class OTPVerification(models.Model):
    OTP_TYPES = [
        ('email', 'Email Verification'),
        ('phone', 'Phone Verification'),
        ('login', 'Login Verification'),
        ('password_reset', 'Password Reset'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_type = models.CharField(max_length=20, choices=OTP_TYPES)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def is_max_attempts_reached(self):
        return self.attempts >= self.max_attempts
    
    def increment_attempts(self):
        self.attempts += 1
        self.save()
    
    def verify_otp(self, provided_otp):
        if self.is_expired():
            return False, "OTP has expired"
        
        if self.is_max_attempts_reached():
            return False, "Maximum attempts reached"
        
        if self.is_used:
            return False, "OTP has already been used"
        
        if self.otp_code != provided_otp:
            self.increment_attempts()
            return False, "Invalid OTP"
        
        self.is_used = True
        self.save()
        return True, "OTP verified successfully"
    
    @classmethod
    def generate_otp(cls, user, otp_type):
        # Deactivate any existing OTPs for this user and type
        cls.objects.filter(user=user, otp_type=otp_type, is_used=False).update(is_used=True)
        
        # Generate new OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        return cls.objects.create(
            user=user,
            otp_type=otp_type,
            otp_code=otp_code
        )
    
    def __str__(self):
        return f"OTP for {self.user.username} - {self.otp_type}"

class LoginAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)
    failure_reason = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        status = "Success" if self.success else "Failed"
        return f"{status} login attempt for {self.user.username if self.user else 'Unknown'} from {self.ip_address}"

class SecurityLog(models.Model):
    LOG_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('password_change', 'Password Change'),
        ('account_lock', 'Account Lock'),
        ('account_unlock', 'Account Unlock'),
        ('otp_generation', 'OTP Generation'),
        ('otp_verification', 'OTP Verification'),
        ('captcha_fail', 'CAPTCHA Failure'),
        ('suspicious_activity', 'Suspicious Activity'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    log_type = models.CharField(max_length=20, choices=LOG_TYPES)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.log_type} - {self.user.username if self.user else 'Unknown'} - {self.timestamp}"