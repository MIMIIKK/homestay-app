import re
import random
import string
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import io
import base64

def check_password_strength(password):
    length_error = len(password) < 8
    digit_error = re.search(r"\d", password) is None
    uppercase_error = re.search(r"[A-Z]", password) is None
    lowercase_error = re.search(r"[a-z]", password) is None
    symbol_error = re.search(r"[ @!#$%^&*()<>?/\\|}{~:]", password) is None

    score = 5 - sum([length_error, digit_error, uppercase_error, lowercase_error, symbol_error])
    return {
        "score": score,
        "strength": "Weak" if score < 3 else "Moderate" if score < 5 else "Strong"
    }

def generate_captcha_text(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def generate_captcha_image(text):
    width, height = 180, 60
    img = Image.new('RGB', (width, height), (255, 255, 255))

    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except:
        font = ImageFont.load_default()

    draw = ImageDraw.Draw(img)

    # Background noise
    for _ in range(120):
        x1 = random.randint(0, width)
        y1 = random.randint(0, height)
        draw.point((x1, y1), fill=(random.randint(100, 200), random.randint(100, 200), random.randint(100, 200)))

    # Distorted characters
    for i, char in enumerate(text):
        x = 20 + i * 25
        y = random.randint(0, 10)
        draw.text((x, y), char, font=font, fill=(random.randint(0, 100), 0, random.randint(150, 255)))

    # Blur for bot resistance
    img = img.filter(ImageFilter.GaussianBlur(1))

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode('utf-8')
