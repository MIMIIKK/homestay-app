from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CaptchaChallenge
from .utils import check_password_strength

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_host', 'phone', 'address', 'avatar', 'avatar_url']
        extra_kwargs = {
            'avatar': {'write_only': True},
        }
    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

class RegisterSerializer(serializers.ModelSerializer):
    captcha = serializers.CharField(write_only=True)
    session_id = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'phone', 'address', 'captcha', 'session_id']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        result = check_password_strength(value)
        if result['score'] < 3:
            raise serializers.ValidationError("Password is too weak.")
        return value

    def validate(self, data):
        session_id = data.get('session_id')
        captcha_input = data.get('captcha')

        try:
            challenge = CaptchaChallenge.objects.get(session_id=session_id)
        except CaptchaChallenge.DoesNotExist:
            raise serializers.ValidationError("Invalid CAPTCHA session.")

        if challenge.answer.lower() != captcha_input.lower():
            raise serializers.ValidationError("CAPTCHA answer is incorrect.")

        return data

    def create(self, validated_data):
        validated_data.pop('captcha')
        validated_data.pop('session_id')
        user = User.objects.create_user(**validated_data)
        return user
