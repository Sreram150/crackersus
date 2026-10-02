from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from .models import Cart, CartItem, Wishlist, WishlistItem
from .serializers import CartItemSerializer, WishlistItemSerializer
from .utils import compute_totals


def cart_payload(request):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    items = list(cart.items.select_related("product__category").order_by("id"))
    t = compute_totals((i.product, i.quantity) for i in items)
    return {
        "items": CartItemSerializer(items, many=True, context={"request": request}).data,
        "item_count": sum(i.quantity for i in items),
        **{k: float(v) for k, v in t.items()},
    }


def parse_qty(value, default=1):
    try:
        q = int(value if value is not None else default)
    except (TypeError, ValueError):
        return None
    return q if q >= 1 else None


class CartView(APIView):
    def get(self, request):
        return Response(cart_payload(request))

    def post(self, request):
        product = get_object_or_404(Product, pk=request.data.get("product_id"))
        qty = parse_qty(request.data.get("quantity"))
        if qty is None:
            return Response({"detail": "Quantity must be at least 1."}, status=400)
        if product.stock < 1:
            return Response({"detail": f"{product.name} is out of stock."}, status=400)
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item, _ = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": 0})
        item.quantity = min(item.quantity + qty, product.stock)
        item.save()
        return Response(cart_payload(request), status=201)


class CartItemView(APIView):
    def put(self, request, pk):
        item = get_object_or_404(CartItem, pk=pk, cart__user=request.user)
        qty = parse_qty(request.data.get("quantity"), None)
        if qty is None:
            return Response({"detail": "Quantity must be at least 1."}, status=400)
        if qty > item.product.stock:
            return Response({"detail": f"Only {item.product.stock} in stock."}, status=400)
        item.quantity = qty
        item.save()
        return Response(cart_payload(request))

    def delete(self, request, pk):
        get_object_or_404(CartItem, pk=pk, cart__user=request.user).delete()
        return Response(cart_payload(request))


def wishlist_payload(request):
    wl, _ = Wishlist.objects.get_or_create(user=request.user)
    items = wl.items.select_related("product__category")
    return {"items": WishlistItemSerializer(items, many=True, context={"request": request}).data,
            "product_ids": [i.product_id for i in items]}


class WishlistView(APIView):
    def get(self, request):
        return Response(wishlist_payload(request))

    def post(self, request):
        product = get_object_or_404(Product, pk=request.data.get("product_id"))
        wl, _ = Wishlist.objects.get_or_create(user=request.user)
        WishlistItem.objects.get_or_create(wishlist=wl, product=product)
        return Response(wishlist_payload(request), status=201)


class WishlistItemView(APIView):
    """DELETE /api/wishlist/<product_id>/ removes that product from the wishlist."""

    def delete(self, request, pk):
        WishlistItem.objects.filter(wishlist__user=request.user, product_id=pk).delete()
        return Response(wishlist_payload(request))
