from django.urls import path
from .views import RegisterView, CaptchaView, UserDetailView, UserProfileUpdateView, UserAvatarUpdateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('captcha/', CaptchaView.as_view(), name='captcha'),
    path('user/', UserDetailView.as_view(), name='user_detail'),
    path('user/profile/', UserProfileUpdateView.as_view(), name='user-profile'),
    path('user/avatar/', UserAvatarUpdateView.as_view(), name='user-avatar-update'),  # Note the trailing slash
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)