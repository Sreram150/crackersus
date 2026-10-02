from django.db.models import Case, DecimalField, F, Q, When
from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        from rest_framework.response import Response
        cat = self.get_object()
        if cat.products.exists():
            return Response({"detail": "Move or delete this category's products first."}, status=400)
        return super().destroy(request, *args, **kwargs)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        p = self.request.query_params
        qs = Product.objects.select_related("category").annotate(
            fp=Case(When(discount_price__isnull=False, then=F("discount_price")), default=F("price"),
                    output_field=DecimalField(max_digits=10, decimal_places=2)))
        if q := p.get("q"):
            qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q) | Q(category__name__icontains=q))
        if cat := p.get("category"):
            qs = qs.filter(category_id=cat) if cat.isdigit() else qs.filter(category__slug=cat)
        try:
            if p.get("min_price"):
                qs = qs.filter(fp__gte=p["min_price"])
            if p.get("max_price"):
                qs = qs.filter(fp__lte=p["max_price"])
        except Exception:
            pass
        if p.get("featured") == "1":
            qs = qs.filter(is_featured=True)
        if p.get("offers") == "1":
            qs = qs.filter(discount_price__isnull=False)
        order = {"price_asc": "fp", "price_desc": "-fp", "popularity": "-sold_count",
                 "newest": "-created_at"}.get(p.get("ordering"), "-created_at")
        qs = qs.order_by(order, "-id")
        if self.action == "list" and (p.get("limit") or "").isdigit():
            qs = qs[: int(p["limit"])]
        return qs
