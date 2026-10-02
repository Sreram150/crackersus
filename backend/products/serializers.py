from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "icon", "product_count"]
        read_only_fields = ["slug"]

    def get_product_count(self, obj):
        return obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    category_icon = serializers.CharField(source="category.icon", read_only=True)
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    in_stock = serializers.SerializerMethodField()
    image_src = serializers.SerializerMethodField()
    spec_list = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "description", "category", "category_name", "category_slug", "category_icon",
            "price", "discount_price", "final_price", "discount_percent", "stock", "in_stock",
            "image", "image_url", "image_src", "rating", "rating_count", "sold_count", "is_featured",
            "specifications", "spec_list", "safety_info", "created_at",
        ]
        read_only_fields = ["sold_count", "created_at"]
        extra_kwargs = {"image": {"required": False, "write_only": True},
                        "discount_price": {"required": False, "allow_null": True}}

    def get_in_stock(self, obj):
        return obj.stock > 0

    def get_image_src(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return obj.image_url or None

    def get_spec_list(self, obj):
        out = []
        for line in (obj.specifications or "").splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                out.append({"label": k.strip(), "value": v.strip()})
        return out

    def validate(self, data):
        price = data.get("price", getattr(self.instance, "price", None))
        disc = data["discount_price"] if "discount_price" in data else getattr(self.instance, "discount_price", None)
        if price is not None and price <= 0:
            raise serializers.ValidationError({"price": "Price must be greater than zero."})
        if disc is not None and price is not None and disc >= price:
            raise serializers.ValidationError({"discount_price": "Discount price must be lower than the price."})
        rating = data.get("rating")
        if rating is not None and not (0 <= rating <= 5):
            raise serializers.ValidationError({"rating": "Rating must be between 0 and 5."})
        return data
