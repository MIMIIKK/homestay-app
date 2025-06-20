from django.contrib import admin
from .models import User, CaptchaChallenge

admin.site.register(User)
admin.site.register(CaptchaChallenge)
