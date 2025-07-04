from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from django.utils.crypto import get_random_string
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
import os
import re
import random
import string
from datetime import timedelta

from .serializers import (
    RegisterSerializer, UserSerializer, LoginSerializer, 
    OTPVerificationSerializer, ResendOTPSerializer,
    PasswordChangeSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer
)
from .utils import (
    generate_captcha_text, generate_captcha_image, generate_math_captcha,
    check_password_strength, validate_password_security, get_client_ip,
    send_otp_email, send_otp_sms, log_security_event
)
from .models import CaptchaChallenge, User, OTPVerification, LoginAttempt, SecurityLog

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            ip_address = get_client_ip(request)
            session_id = request.data.get('session_id')
            captcha_answer = request.data.get('captcha')

            print(f"DEBUG: session_id={session_id}, captcha_answer={captcha_answer}")

            if not session_id or not captcha_answer:
                return Response({
                    "error": "CAPTCHA verification required", 
                    "details": f"session_id: {session_id}, captcha: {captcha_answer}"
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                captcha = CaptchaChallenge.objects.get(session_id=session_id)
                print(f"DEBUG: Found captcha with answer: {captcha.answer}")

                if captcha.is_expired():
                    return Response({"error": "CAPTCHA has expired"}, status=status.HTTP_400_BAD_REQUEST)
                if captcha.is_max_attempts_reached():
                    return Response({"error": "Maximum CAPTCHA attempts reached"}, status=status.HTTP_400_BAD_REQUEST)

                stored_answer = captcha.answer.strip().lower()
                provided_answer = captcha_answer.strip().lower()
                
                print(f"DEBUG: Comparing '{stored_answer}' with '{provided_answer}'")

                if stored_answer != provided_answer:
                    captcha.increment_attempts()
                    return Response({
                        "error": f"Invalid CAPTCHA. Expected: {captcha.answer}, Got: {captcha_answer}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                captcha.delete()
                
            except CaptchaChallenge.DoesNotExist:
                return Response({"error": "Invalid CAPTCHA session"}, status=status.HTTP_400_BAD_REQUEST)

            # DEBUG SECTION
            print(f"DEBUG: CAPTCHA validated successfully")
            print(f"DEBUG: Request data: {request.data}")

            password = request.data.get('password')
            username = request.data.get('username')
            email = request.data.get('email')

            print(f"DEBUG: About to validate password")
            password_validation = validate_password_security(password, username, email)
            print(f"DEBUG: Password validation result: {password_validation}")
            
            if not password_validation['is_valid']:
                print(f"DEBUG: Password validation failed: {password_validation['errors']}")
                return Response({"password_errors": password_validation['errors']}, status=status.HTTP_400_BAD_REQUEST)

            print(f"DEBUG: About to validate serializer")
            serializer = RegisterSerializer(data=request.data)
            print(f"DEBUG: Serializer is_valid: {serializer.is_valid()}")
            
            if not serializer.is_valid():
                print(f"DEBUG: Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            print(f"DEBUG: Creating user...")
            user = serializer.save()
            print(f"DEBUG: User created: {user.id}")
            
            user.calculate_profile_completion()
            print(f"DEBUG: Profile completion calculated")

            print(f"DEBUG: Generating OTP...")
            otp = OTPVerification.generate_otp(user, 'email')
            print(f"DEBUG: OTP generated: {otp.otp_code}")

            print(f"DEBUG: Attempting to send email...")
            try:
                send_otp_email(user, otp.otp_code)
                print(f"DEBUG: Email sent successfully")
            except Exception as e:
                print(f"DEBUG: Email sending failed: {e}")

            print(f"DEBUG: Logging security event...")
            try:
                log_security_event(
                    user=user,
                    log_type='registration',
                    ip_address=ip_address,
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    details={'role': user.role}
                )
                print(f"DEBUG: Security event logged")
            except Exception as e:
                print(f"DEBUG: Security logging failed: {e}")

            print(f"DEBUG: Registration successful, returning response")
            return Response({
                "message": "Registration successful. Please check your email for verification code.",
                "user_id": user.id,
                "email_verification_required": True
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"DEBUG: Exception in registration: {e}")
            print(f"DEBUG: Exception type: {type(e)}")
            import traceback
            print(f"DEBUG: Full traceback: {traceback.format_exc()}")
            return Response({"error": "Registration failed. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        try:
            username_or_email = request.data.get('username')  # Can be username or email
            password = request.data.get('password')
            
            print(f"DEBUG: Login attempt with: {username_or_email}")
            
            if not username_or_email or not password:
                return Response(
                    {"error": "Username/Email and password required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Try to find user by username OR email
            user = None
            try:
                # First try to find by username
                user = User.objects.get(username=username_or_email)
                print(f"DEBUG: Found user by username: {user.username}")
            except User.DoesNotExist:
                try:
                    # If not found by username, try by email
                    user = User.objects.get(email=username_or_email)
                    print(f"DEBUG: Found user by email: {user.email}")
                except User.DoesNotExist:
                    print(f"DEBUG: User not found with username/email: {username_or_email}")
                    # Log failed attempt
                    LoginAttempt.objects.create(
                        ip_address=ip_address,
                        user_agent=user_agent,
                        success=False,
                        failure_reason='User not found'
                    )
                    return Response(
                        {"error": "Invalid credentials"}, 
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            
            # Check if account is locked
            if user.is_account_locked():
                LoginAttempt.objects.create(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    failure_reason='Account locked'
                )
                return Response(
                    {"error": "Account is temporarily locked. Please try again later."}, 
                    status=status.HTTP_423_LOCKED
                )
            
            # Authenticate user (Django authenticate requires username, not email)
            authenticated_user = authenticate(username=user.username, password=password)
            
            print(f"DEBUG: Authentication result: {authenticated_user is not None}")
            
            if not authenticated_user:
                user.increment_failed_attempts()
                LoginAttempt.objects.create(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    failure_reason='Invalid password'
                )
                return Response(
                    {"error": "Invalid credentials"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Reset failed attempts on successful authentication
            user.unlock_account()
            
            # Generate OTP for login verification
            print(f"DEBUG: Generating OTP for user: {user.username}")
            otp = OTPVerification.generate_otp(user, 'login')
            
            # Send OTP via email
            print(f"DEBUG: Sending OTP to email: {user.email}")
            email_sent = send_otp_email(user, otp.otp_code, otp_type='login')
            print(f"DEBUG: Email sent result: {email_sent}")
            
            # Log successful login attempt (pending OTP verification)
            LoginAttempt.objects.create(
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
                success=True,
                failure_reason=''
            )
            
            return Response({
                "message": "Login verification required. Please check your email for OTP.",
                "user_id": user.id,
                "otp_required": True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"DEBUG: Login exception: {e}")
            import traceback
            print(f"DEBUG: Login traceback: {traceback.format_exc()}")
            return Response(
                {"error": "Login failed. Please try again."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class OTPVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            user_id = request.data.get('user_id')
            otp_code = request.data.get('otp_code')
            otp_type = request.data.get('otp_type', 'login')
            
            if not user_id or not otp_code:
                return Response(
                    {"error": "User ID and OTP code required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                user = User.objects.get(id=user_id)
                otp = OTPVerification.objects.filter(
                    user=user, 
                    otp_type=otp_type, 
                    is_used=False
                ).first()
                
                if not otp:
                    return Response(
                        {"error": "No valid OTP found"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                is_valid, message = otp.verify_otp(otp_code)
                
                if not is_valid:
                    return Response(
                        {"error": message}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Handle different OTP types
                if otp_type == 'email':
                    user.is_email_verified = True
                    user.save()
                    
                    return Response({
                        "message": "Email verified successfully",
                        "email_verified": True
                    }, status=status.HTTP_200_OK)
                
                elif otp_type == 'login':
                    # Generate JWT tokens
                    from rest_framework_simplejwt.tokens import RefreshToken
                    
                    refresh = RefreshToken.for_user(user)
                    access_token = str(refresh.access_token)
                    
                    # Log security event
                    log_security_event(
                        user=user,
                        log_type='login',
                        ip_address=get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        details={'otp_verified': True}
                    )
                    
                    return Response({
                        "message": "Login successful",
                        "access": access_token,
                        "refresh": str(refresh),
                        "user": UserSerializer(user).data
                    }, status=status.HTTP_200_OK)
                
                return Response(
                    {"message": "OTP verified successfully"}, 
                    status=status.HTTP_200_OK
                )
                
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {"error": "OTP verification failed"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CaptchaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            session_id = get_random_string(20)
            captcha_type = request.GET.get('type', 'image')
            
            print(f"DEBUG: Generating CAPTCHA - Type: {captcha_type}, Session: {session_id}")
            
            if captcha_type == 'math':
                question, answer = generate_math_captcha()
                captcha_data = {
                    "session_id": session_id,
                    "question": question,
                    "type": "math"
                }
                print(f"DEBUG: Math CAPTCHA - Question: {question}, Answer: {answer}")
            else:
                captcha_text = generate_captcha_text()
                captcha_image = generate_captcha_image(captcha_text)
                answer = captcha_text
                captcha_data = {
                    "session_id": session_id,
                    "image": captcha_image,
                    "type": "image"
                }
                print(f"DEBUG: Image CAPTCHA - Text: {captcha_text}")
            
            # Clean up expired captchas
            expired_time = timezone.now() - timedelta(minutes=10)
            deleted_count = CaptchaChallenge.objects.filter(created_at__lt=expired_time).delete()
            print(f"DEBUG: Deleted {deleted_count[0]} expired captchas")
            
            # Create new captcha challenge
            captcha_challenge = CaptchaChallenge.objects.create(
                session_id=session_id,
                captcha_type=captcha_type,
                question=question if captcha_type == 'math' else 'image',
                answer=answer
            )
            print(f"DEBUG: Created CAPTCHA challenge with ID: {captcha_challenge.id}")
            
            return Response(captcha_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"DEBUG: CAPTCHA generation error: {str(e)}")
            return Response(
                {"error": "Failed to generate CAPTCHA"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            user_id = request.data.get('user_id')
            otp_type = request.data.get('otp_type', 'login')
            
            if not user_id:
                return Response(
                    {"error": "User ID required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                user = User.objects.get(id=user_id)
                
                # Generate new OTP
                otp = OTPVerification.generate_otp(user, otp_type)
                
                # Send OTP
                if otp_type == 'email' or otp_type == 'login':
                    send_otp_email(user, otp.otp_code, otp_type)
                
                return Response({
                    "message": "OTP sent successfully"
                }, status=status.HTTP_200_OK)
                
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {"error": "Failed to resend OTP"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)
        
    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            user.calculate_profile_completion()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            user.calculate_profile_completion()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserAvatarUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        try:
            if 'avatar' not in request.FILES:
                return Response({
                    'error': 'No avatar file provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = request.user
            avatar_file = request.FILES['avatar']
            
            # Validate file
            if avatar_file.size > 5 * 1024 * 1024:  # 5MB limit
                return Response({
                    'error': 'File too large (max 5MB)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not avatar_file.content_type.startswith('image/'):
                return Response({
                    'error': 'Only image files allowed'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Delete old avatar if exists
            if user.avatar and os.path.isfile(user.avatar.path):
                try:
                    os.remove(user.avatar.path)
                except Exception:
                    pass
            
            # Save new avatar
            ext = avatar_file.name.split('.')[-1]
            filename = f"user_{user.id}_avatar.{ext}"
            user.avatar.save(filename, avatar_file)
            user.calculate_profile_completion()
            
            return Response({
                'avatar_url': user.avatar.url,
                'message': 'Avatar updated successfully'
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': 'Failed to update avatar',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                user = request.user
                user.set_password(serializer.validated_data['new_password'])
                user.last_password_change = timezone.now()
                user.save()

                # Log security event
                log_security_event(
                    user=user,
                    log_type='password_change',
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    details={}
                )

                return Response({
                    "message": "Password changed successfully"
                }, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                "error": "Password change failed"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = PasswordResetSerializer(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data['email']
                user = User.objects.get(email=email)

                # Generate OTP for password reset
                otp = OTPVerification.generate_otp(user, 'password_reset')

                # Send OTP via email
                send_otp_email(user, otp.otp_code, otp_type='password_reset')

                return Response({
                    "message": "Password reset code sent to your email",
                    "user_id": user.id
                }, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                "error": "Password reset request failed"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = PasswordResetConfirmSerializer(data=request.data)
            if serializer.is_valid():
                user_id = serializer.validated_data['user_id']
                otp_code = serializer.validated_data['otp_code']
                new_password = serializer.validated_data['new_password']

                user = User.objects.get(id=user_id)
                otp = OTPVerification.objects.filter(
                    user=user,
                    otp_type='password_reset',
                    is_used=False
                ).first()

                if not otp:
                    return Response({
                        "error": "No valid reset code found"
                    }, status=status.HTTP_400_BAD_REQUEST)

                is_valid, message = otp.verify_otp(otp_code)
                if not is_valid:
                    return Response({
                        "error": message
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Reset password
                user.set_password(new_password)
                user.last_password_change = timezone.now()
                user.failed_login_attempts = 0
                user.account_locked_until = None
                user.save()

                # Log security event
                log_security_event(
                    user=user,
                    log_type='password_reset',
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    details={}
                )

                return Response({
                    "message": "Password reset successful"
                }, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except User.DoesNotExist:
            return Response({
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                "error": "Password reset failed"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)