from django.conf import settings
from django.contrib.auth import password_validation
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address
from .serializers import (ChangePasswordSerializer, ProfileUpdateSerializer, RegisterSerializer,
                          user_payload)


def issue_tokens(user, request):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh),
            "user": user_payload(user, request)}


class AuthBase(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class RegisterView(AuthBase):
    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response(issue_tokens(user, request), status=status.HTTP_201_CREATED)


class LoginView(AuthBase):
    def post(self, request):
        ident = (request.data.get("identifier") or request.data.get("email")
                 or request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        user = User.objects.filter(Q(username__iexact=ident) | Q(email__iexact=ident)).first() if ident else None
        if not user or not user.is_active or not user.check_password(password):
            return Response({"detail": "Invalid email/username or password."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(issue_tokens(user, request))


class LogoutView(APIView):
    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh")).blacklist()
        except (TokenError, TypeError):
            pass  # already invalid/expired: nothing to revoke
        return Response({"detail": "Logged out."})


class ProfileView(APIView):
    def get(self, request):
        return Response(user_payload(request.user, request))

    def put(self, request):
        user = request.user
        s = ProfileUpdateSerializer(data=request.data, context={"user": user})
        s.is_valid(raise_exception=True)
        d = s.validated_data
        if "username" in d:
            user.username = d["username"]
        if "email" in d:
            user.email = d["email"]
        user.save()
        p = user.profile
        for f in ("full_name", "phone", "avatar"):
            if f in d:
                setattr(p, f, d[f])
        p.save()
        addr_fields = {k: d[k] for k in ("line1", "city", "state", "pincode") if k in d}
        if addr_fields:
            addr = user.addresses.filter(is_default=True).first() or Address(user=user, is_default=True)
            for k, v in addr_fields.items():
                setattr(addr, k, v)
            addr.full_name, addr.phone = p.full_name, p.phone
            addr.save()
        return Response(user_payload(user, request))


class ChangePasswordView(APIView):
    def post(self, request):
        s = ChangePasswordSerializer(data=request.data, context={"user": request.user})
        s.is_valid(raise_exception=True)
        if not request.user.check_password(s.validated_data["old_password"]):
            return Response({"old_password": "Current password is incorrect."}, status=400)
        request.user.set_password(s.validated_data["new_password"])
        request.user.save()
        return Response({"detail": "Password changed. Please log in again on other devices."})


class PasswordResetRequestView(AuthBase):
    def post(self, request):
        email = (request.data.get("email") or "").strip()
        out = {"detail": "If an account exists for that email, a reset link has been sent."}
        user = User.objects.filter(email__iexact=email, is_active=True).first() if email else None
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_mail("Reset your CrackersHub password",
                      f"Hi {user.username},\n\nReset your password using this link:\n{link}\n\n"
                      "If you did not request this, ignore this email.",
                      None, [user.email])
            if settings.DEBUG:
                out["dev_reset_link"] = link  # convenience in development only
        return Response(out)


class PasswordResetConfirmView(AuthBase):
    def post(self, request):
        uid, token = request.data.get("uid"), request.data.get("token")
        pw, pw2 = request.data.get("new_password") or "", request.data.get("confirm_password") or ""
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except Exception:
            user = None
        if not user or not default_token_generator.check_token(user, token or ""):
            return Response({"detail": "This reset link is invalid or has expired."}, status=400)
        if pw != pw2:
            return Response({"confirm_password": "Passwords do not match."}, status=400)
        try:
            password_validation.validate_password(pw, user)
        except Exception as e:
            return Response({"new_password": list(getattr(e, "messages", [str(e)]))}, status=400)
        user.set_password(pw)
        user.save()
        return Response({"detail": "Password reset successful. You can now log in."})
