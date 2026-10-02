import random

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from cart.utils import compute_totals
from products.models import Product
from .models import Order, OrderEvent, OrderItem, STATUSES
from .serializers import CheckoutSerializer, OrderSerializer


def new_order_number():
    while True:
        n = "CH" + timezone.now().strftime("%y%m%d") + str(random.randint(1000, 9999))
        if not Order.objects.filter(order_number=n).exists():
            return n


def order_qs():
    return Order.objects.select_related("user").prefetch_related("items__product", "events")


class OrderListCreateView(APIView):
    def get(self, request):
        orders = order_qs().filter(user=request.user)
        return Response(OrderSerializer(orders, many=True, context={"request": request}).data)

    def post(self, request):
        s = CheckoutSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        with transaction.atomic():
            cart, _ = Cart.objects.get_or_create(user=request.user)
            cart_items = list(cart.items.all())
            if not cart_items:
                return Response({"detail": "Your cart is empty."}, status=400)
            products = {p.id: p for p in Product.objects.select_for_update().filter(id__in=[i.product_id for i in cart_items])}
            for ci in cart_items:
                p = products[ci.product_id]
                if ci.quantity > p.stock:
                    return Response({"detail": f"Only {p.stock} of '{p.name}' left in stock. Please update your cart."}, status=400)
            totals = compute_totals((products[ci.product_id], ci.quantity) for ci in cart_items)
            order = Order.objects.create(
                user=request.user, order_number=new_order_number(), payment_method=d["payment_method"],
                full_name=d["full_name"], phone=d["phone"], email=d["email"], address=d["address"],
                city=d["city"], state=d["state"], pincode=d["pincode"], notes=d.get("notes", ""), **totals)
            for ci in cart_items:
                p = products[ci.product_id]
                OrderItem.objects.create(order=order, product=p, product_name=p.name, original_price=p.price,
                                         price=p.final_price, quantity=ci.quantity)
                p.stock -= ci.quantity
                p.sold_count += ci.quantity
                p.save(update_fields=["stock", "sold_count"])
            OrderEvent.objects.create(order=order, status="Pending")
            cart.items.all().delete()
        return Response(OrderSerializer(order_qs().get(pk=order.pk), context={"request": request}).data, status=201)


class OrderDetailView(APIView):
    def get_order(self, request, pk):
        qs = order_qs() if request.user.is_staff else order_qs().filter(user=request.user)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        return Response(OrderSerializer(self.get_order(request, pk), context={"request": request}).data)

    def put(self, request, pk):
        """Customers may cancel (Pending/Confirmed only). Admins may set any status except reviving a cancelled order."""
        order = self.get_order(request, pk)
        new = request.data.get("status")
        if new not in STATUSES:
            return Response({"status": f"Choose one of: {', '.join(STATUSES)}."}, status=400)
        if new == order.status:
            return Response(OrderSerializer(order, context={"request": request}).data)
        if order.status == "Cancelled":
            return Response({"detail": "A cancelled order cannot be changed."}, status=400)
        if not request.user.is_staff:
            if new != "Cancelled" or order.status not in ("Pending", "Confirmed"):
                return Response({"detail": "This order can no longer be cancelled."}, status=403)
        with transaction.atomic():
            if new == "Cancelled":  # put stock back
                for it in order.items.select_related("product"):
                    if it.product:
                        Product.objects.filter(pk=it.product_id).update(
                            stock=it.product.stock + it.quantity,
                            sold_count=max(0, it.product.sold_count - it.quantity))
            order.status = new
            if new == "Delivered" and order.payment_method == "COD":
                order.payment_status = "Paid"
            order.save()
            OrderEvent.objects.create(order=order, status=new)
        return Response(OrderSerializer(order_qs().get(pk=order.pk), context={"request": request}).data)
