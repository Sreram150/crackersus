from django.contrib import admin
from .models import Cart, CartItem, Wishlist, WishlistItem

for m in (Cart, CartItem, Wishlist, WishlistItem):
    admin.site.register(m)
