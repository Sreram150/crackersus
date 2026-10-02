from django.contrib.auth.models import User
from django.db import models

from products.models import Product

STATUSES = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]
STATUS_CHOICES = [(s, s) for s in STATUSES]


class Order(models.Model):
    PAYMENT_CHOICES = [("COD", "Cash on Delivery"), ("ONLINE", "Online Payment (placeholder)")]
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="orders")
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="Pending")
    payment_method = models.CharField(max_length=8, choices=PAYMENT_CHOICES, default="COD")
    payment_status = models.CharField(max_length=10, default="Pending")
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    notes = models.CharField(max_length=255, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_charge = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=200)
    original_price = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # unit price actually charged
    quantity = models.PositiveIntegerField()

    @property
    def line_total(self):
        return self.price * self.quantity


class OrderEvent(models.Model):
    """Status history used for order tracking."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="events")
    status = models.CharField(max_length=12)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
