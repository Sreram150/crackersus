from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from accounts.serializers import user_payload
from orders.models import Order, STATUSES
from orders.serializers import OrderSerializer
from products.models import Product
from products.serializers import ProductSerializer

LOW_STOCK_LIMIT = 10


class AdminDashboardView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        ctx = {"request": request}
        valid = Order.objects.exclude(status="Cancelled")
        today = timezone.localdate()
        days = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            qs = valid.filter(created_at__date=d)
            days.append({"date": d.isoformat(), "orders": qs.count(),
                         "sales": float(qs.aggregate(s=Sum("total"))["s"] or 0)})
        by_status = {s: 0 for s in STATUSES}
        for row in Order.objects.values("status").annotate(c=Count("id")):
            by_status[row["status"]] = row["c"]
        customers = User.objects.filter(is_staff=False)
        return Response({
            "total_products": Product.objects.count(),
            "total_customers": customers.count(),
            "total_orders": Order.objects.count(),
            "pending_orders": by_status["Pending"],
            "completed_orders": by_status["Delivered"],
            "total_sales": float(valid.aggregate(s=Sum("total"))["s"] or 0),
            "sales_overview": days,
            "orders_by_status": by_status,
            "recent_orders": OrderSerializer(Order.objects.select_related("user")[:6], many=True, context=ctx).data,
            "low_stock": ProductSerializer(Product.objects.filter(stock__lte=LOW_STOCK_LIMIT).order_by("stock")[:8],
                                           many=True, context=ctx).data,
            "recent_customers": [user_payload(u, request) for u in customers.order_by("-date_joined")[:5]],
        })


class AdminCustomersView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        users = User.objects.filter(is_staff=False).annotate(order_count=Count("orders"),
                                                           spent=Sum("orders__total")).order_by("-date_joined")
        out = []
        for u in users:
            row = user_payload(u, request)
            row["order_count"], row["total_spent"] = u.order_count, float(u.spent or 0)
            out.append(row)
        return Response(out)


class AdminOrdersView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = Order.objects.select_related("user").prefetch_related("items__product", "events")
        if request.query_params.get("status") in STATUSES:
            qs = qs.filter(status=request.query_params["status"])
        return Response(OrderSerializer(qs, many=True, context={"request": request}).data)


class AdminProductsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = Product.objects.select_related("category").order_by("name")
        if request.query_params.get("low_stock") == "1":
            qs = qs.filter(stock__lte=LOW_STOCK_LIMIT)
        return Response(ProductSerializer(qs, many=True, context={"request": request}).data)
