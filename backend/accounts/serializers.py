import re

from django.contrib.auth import password_validation
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Address

PHONE_RE = re.compile(r"^\+?[0-9]{10,13}$")
USERNAME_RE = re.compile(r"^[\w.@+-]+$")


def validate_phone(value):
    value = (value or "").strip().replace(" ", "")
    if value and not PHONE_RE.match(value):
        raise serializers.ValidationError("Enter a valid phone number (10-13 digits).")
    return value


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "full_name", "phone", "line1", "city", "state", "pincode", "is_default"]


def user_payload(user, request=None):
    p = user.profile
    addr = user.addresses.filter(is_default=True).first() or user.addresses.first()
    avatar = None
    if p.avatar:
        avatar = request.build_absolute_uri(p.avatar.url) if request else p.avatar.url
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": p.full_name,
        "phone": p.phone,
        "avatar": avatar,
        "is_admin": user.is_staff,
        "date_joined": user.date_joined,
        "address": AddressSerializer(addr).data if addr else None,
    }


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_username(self, v):
        v = v.strip()
        if not USERNAME_RE.match(v):
            raise serializers.ValidationError("Use letters, numbers and . @ + - _ only.")
        if User.objects.filter(username__iexact=v).exists():
            raise serializers.ValidationError("This username is already taken.")
        return v

    def validate_email(self, v):
        v = v.strip().lower()
        if User.objects.filter(email__iexact=v).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return v

    def validate_phone(self, v):
        v = validate_phone(v)
        if not v:
            raise serializers.ValidationError("Phone number is required.")
        return v

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            password_validation.validate_password(data["password"])
        except Exception as e:
            raise serializers.ValidationError({"password": list(getattr(e, "messages", [str(e)]))})
        return data

    def create(self, data):
        user = User.objects.create_user(
            username=data["username"], email=data["email"], password=data["password"],
            first_name=data["full_name"].split(" ")[0][:150],
        )
        p = user.profile
        p.full_name, p.phone = data["full_name"].strip(), data["phone"]
        p.save()
        return user


class ProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=False)
    username = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    line1 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    pincode = serializers.RegexField(r"^[0-9]{6}$", required=False, allow_blank=True,
                                     error_messages={"invalid": "Pincode must be 6 digits."})
    avatar = serializers.ImageField(required=False)

    def validate_username(self, v):
        v = v.strip()
        if not USERNAME_RE.match(v):
            raise serializers.ValidationError("Use letters, numbers and . @ + - _ only.")
        if User.objects.filter(username__iexact=v).exclude(pk=self.context["user"].pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return v

    def validate_email(self, v):
        v = v.strip().lower()
        if User.objects.filter(email__iexact=v).exclude(pk=self.context["user"].pk).exists():
            raise serializers.ValidationError("This email is already in use.")
        return v

    def validate_phone(self, v):
        return validate_phone(v)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField()
    confirm_password = serializers.CharField()

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            password_validation.validate_password(data["new_password"], self.context["user"])
        except Exception as e:
            raise serializers.ValidationError({"new_password": list(getattr(e, "messages", [str(e)]))})
        return data
