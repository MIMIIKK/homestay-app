from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
from django.conf import settings
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils.crypto import get_random_string
from django.core.files.storage import default_storage
from .serializers import RegisterSerializer, UserSerializer
from .utils import generate_captcha_text, generate_captcha_image
from .models import CaptchaChallenge, User

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Registration successful"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CaptchaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        session_id = get_random_string(20)
        captcha_text = generate_captcha_text()
        captcha_image = generate_captcha_image(captcha_text)

        CaptchaChallenge.objects.create(
            session_id=session_id,
            question='image',
            answer=captcha_text
        )

        return Response({
            "session_id": session_id,
            "image": captcha_image
        })

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
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserAvatarUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        try:
            if 'avatar' not in request.FILES:
                return Response({'error': 'No avatar file provided'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            user = request.user
            avatar_file = request.FILES['avatar']
            
            # Validate file
            if avatar_file.size > 5 * 1024 * 1024:  # 5MB limit
                return Response({'error': 'File too large (max 5MB)'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            if not avatar_file.content_type.startswith('image/'):
                return Response({'error': 'Only image files allowed'}, 
                              status=status.HTTP_400_BAD_REQUEST)

            # Delete old avatar if exists
            if user.avatar:
                if os.path.isfile(user.avatar.path):
                    os.remove(user.avatar.path)
            
            # Save new avatar
            ext = avatar_file.name.split('.')[-1]
            filename = f"user_{user.id}_avatar.{ext}"
            user.avatar.save(filename, avatar_file)
            user.save()
            
            return Response({
                'avatar_url': user.avatar.url,
                'message': 'Avatar updated successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'detail': 'Avatar upload failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)