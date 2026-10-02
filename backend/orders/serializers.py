import re

from rest_framework import serializers

from .models import Order, OrderEvent, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "product_image", "original_price", "price", "quantity", "line_total"]

    def get_product_image(self, obj):
        p = obj.product
        if not p:
            return None
        req = self.context.get("request")
        if p.image:
            return req.build_absolute_uri(p.image.url) if req else p.image.url
        return p.image_url or None


class OrderEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderEvent
        fields = ["status", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    events = OrderEventSerializer(many=True, read_only=True)
    can_cancel = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "order_number", "status", "payment_method", "payment_status", "full_name", "phone",
                  "email", "address", "city", "state", "pincode", "notes", "subtotal", "discount",
                  "delivery_charge", "total", "created_at", "items", "events", "can_cancel", "customer"]

    def get_can_cancel(self, obj):
        return obj.status in ("Pending", "Confirmed")

    def get_customer(self, obj):
        return {"id": obj.user_id, "username": obj.user.username, "email": obj.user.email}


class CheckoutSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    phone = serializers.RegexField(r"^\+?[0-9]{10,13}$", error_messages={"invalid": "Enter a valid phone number."})
    email = serializers.EmailField()
    address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.RegexField(r"^[0-9]{6}$", error_messages={"invalid": "Pincode must be 6 digits."})
    payment_method = serializers.ChoiceField(choices=["COD", "ONLINE"])
    notes = serializers.CharField(max_length=255, required=False, allow_blank=True)
    age_confirmed = serializers.BooleanField()

    def validate_age_confirmed(self, v):
        if not v:
            raise serializers.ValidationError("Please confirm you meet the legal age requirement and will follow local laws.")
        return v
