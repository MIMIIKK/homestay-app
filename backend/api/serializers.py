from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, OTPVerification, CaptchaChallenge
from .utils import validate_password_security, calculate_password_entropy

class UserSerializer(serializers.ModelSerializer):
    password_strength = serializers.SerializerMethodField()
    profile_completion = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'address', 'role', 'avatar', 'is_email_verified',
            'is_phone_verified', 'profile_completion', 'password_strength',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_email_verified', 'is_phone_verified']
    
    def get_password_strength(self, obj):
        # Don't expose password strength in serialization for security
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.USER_ROLES, default='guest')
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'phone', 'address', 'role'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'phone': {'required': True},
            'address': {'required': True},
        }
    
    def validate_username(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        
        if not value.isalnum():
            raise serializers.ValidationError("Username can only contain letters and numbers.")
        
        # Check for reserved usernames
        reserved_usernames = ['admin', 'administrator', 'root', 'system', 'api', 'www', 'ftp', 'mail']
        if value.lower() in reserved_usernames:
            raise serializers.ValidationError("This username is reserved.")
        
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        # Additional email validation
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            raise serializers.ValidationError("Enter a valid email address.")
        
        return value
    
    def validate_phone(self, value):
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        
        # Basic phone validation
        import re
        phone_pattern = r'^\+?1?\d{9,15}$'
        if not re.match(phone_pattern, value.replace('-', '').replace(' ', '')):
            raise serializers.ValidationError("Enter a valid phone number.")
        
        return value
    
    def validate_password(self, value):
        username = self.initial_data.get('username')
        email = self.initial_data.get('email')
        
        # Use our enhanced password validation
        validation_result = validate_password_security(value, username, email)
        
        if not validation_result['is_valid']:
            raise serializers.ValidationError(validation_result['errors'])
        
        return value
    
    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        
        # Remove confirm_password from attrs as it's not needed for creation
        attrs.pop('confirm_password', None)
        
        return attrs
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        
        # Calculate initial profile completion
        user.calculate_profile_completion()
        
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="Username or Email address")
    password = serializers.CharField()
    
    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("Username or Email is required.")
        return value
    
    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError("Password is required.")
        return value

class OTPVerificationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    otp_code = serializers.CharField(max_length=6, min_length=6)
    otp_type = serializers.ChoiceField(choices=OTPVerification.OTP_TYPES)
    
    def validate_otp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain only digits.")
        return value
    
    def validate_user_id(self, value):
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid user ID.")
        return value

class ResendOTPSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    otp_type = serializers.ChoiceField(choices=OTPVerification.OTP_TYPES)
    
    def validate_user_id(self, value):
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid user ID.")
        return value

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate_new_password(self, value):
        user = self.context['request'].user
        
        # Check if new password is same as old password
        if user.check_password(value):
            raise serializers.ValidationError("New password cannot be the same as current password.")
        
        # Use our enhanced password validation
        validation_result = validate_password_security(value, user.username, user.email)
        
        if not validation_result['is_valid']:
            raise serializers.ValidationError(validation_result['errors'])
        
        return value
    
    def validate(self, attrs):
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        
        if new_password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        
        return attrs

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address.")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    otp_code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()
    
    def validate_user_id(self, value):
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid user ID.")
        return value
    
    def validate_otp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain only digits.")
        return value
    
    def validate_new_password(self, value):
        user_id = self.initial_data.get('user_id')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                validation_result = validate_password_security(value, user.username, user.email)
                
                if not validation_result['is_valid']:
                    raise serializers.ValidationError(validation_result['errors'])
            except User.DoesNotExist:
                pass
        
        return value
    
    def validate(self, attrs):
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        
        if new_password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        
        return attrs

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'address']
        
    def validate_phone(self, value):
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        
        # Basic phone validation
        import re
        phone_pattern = r'^\+?1?\d{9,15}$'
        if not re.match(phone_pattern, value.replace('-', '').replace(' ', '')):
            raise serializers.ValidationError("Enter a valid phone number.")
        
        return value

class CaptchaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaptchaChallenge
        fields = ['session_id', 'question', 'captcha_type']
        read_only_fields = ['session_id', 'question', 'captcha_type']

class UserStatsSerializer(serializers.ModelSerializer):
    """Serializer for user statistics and analytics"""
    total_bookings = serializers.SerializerMethodField()
    total_listings = serializers.SerializerMethodField()
    account_age_days = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'role', 'profile_completion',
            'total_bookings', 'total_listings', 'account_age_days',
            'date_joined', 'last_login'
        ]
    
    def get_total_bookings(self, obj):
        # You'll need to implement this based on your booking model
        # return obj.bookings.count()
        return 0
    
    def get_total_listings(self, obj):
        # You'll need to implement this based on your listing model
        # return obj.listings.count()
        return 0
    
    def get_account_age_days(self, obj):
        from django.utils import timezone
        return (timezone.now() - obj.date_joined).days