from django.urls import path
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts import views as acc
from cart import views as cart
from orders import views as orders
from products.views import CategoryViewSet, ProductViewSet
from . import views as admin_views

router = SimpleRouter()
router.register("products", ProductViewSet, basename="product")
router.register("categories", CategoryViewSet, basename="category")

urlpatterns = [
    # auth
    path("register/", acc.RegisterView.as_view()),
    path("login/", acc.LoginView.as_view()),
    path("logout/", acc.LogoutView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path("password-reset/", acc.PasswordResetRequestView.as_view()),
    path("password-reset/confirm/", acc.PasswordResetConfirmView.as_view()),
    path("change-password/", acc.ChangePasswordView.as_view()),
    path("profile/", acc.ProfileView.as_view()),
    # cart / wishlist
    path("cart/", cart.CartView.as_view()),
    path("cart/<int:pk>/", cart.CartItemView.as_view()),
    path("wishlist/", cart.WishlistView.as_view()),
    path("wishlist/<int:pk>/", cart.WishlistItemView.as_view()),  # pk = product id
    # orders
    path("orders/", orders.OrderListCreateView.as_view()),
    path("orders/<int:pk>/", orders.OrderDetailView.as_view()),
    # admin
    path("admin/dashboard/", admin_views.AdminDashboardView.as_view()),
    path("admin/customers/", admin_views.AdminCustomersView.as_view()),
    path("admin/orders/", admin_views.AdminOrdersView.as_view()),
    path("admin/products/", admin_views.AdminProductsView.as_view()),
] + router.urls
