from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    is_host = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

class CaptchaChallenge(models.Model):
    session_id = models.CharField(max_length=100, unique=True)
    question = models.CharField(max_length=255)
    answer = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Captcha for {self.session_id}"
