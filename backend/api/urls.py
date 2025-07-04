from django.urls import path
from .views import (
    RegisterView, LoginView, CaptchaView, 
    OTPVerificationView, ResendOTPView,
    UserDetailView, UserProfileUpdateView, UserAvatarUpdateView,
    PasswordChangeView, PasswordResetView, PasswordResetConfirmView
)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    
    # OTP endpoints
    path('otp/verify/', OTPVerificationView.as_view(), name='otp-verify'),
    path('otp/resend/', ResendOTPView.as_view(), name='otp-resend'),
    
    # CAPTCHA endpoints
    path('captcha/', CaptchaView.as_view(), name='captcha'),
    
    # User management endpoints
    path('user/', UserDetailView.as_view(), name='user-detail'),
    path('user/profile/', UserProfileUpdateView.as_view(), name='user-profile'),
    path('user/avatar/', UserAvatarUpdateView.as_view(), name='user-avatar-update'),
    
    # Password management endpoints
    path('password/change/', PasswordChangeView.as_view(), name='password-change'),
    path('password/reset/', PasswordResetView.as_view(), name='password-reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)