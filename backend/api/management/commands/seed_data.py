from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from products.models import Category, Product

CATEGORIES = [
    ("Sparklers", "🎇", "Handheld glittering sparklers"), ("Flower Pots", "🌸", "Fountains of colourful sparks"),
    ("Rockets", "🚀", "Sky-bound crowd pleasers"), ("Ground Chakkars", "🌀", "Spinning ground wheels"),
    ("Fancy Crackers", "🎆", "Premium fancy assortments"), ("Gift Boxes", "🎁", "Ready-to-gift festive boxes"),
    ("Kids Collection", "🧒", "Low-noise, kid-friendly picks"), ("Family Packs", "👨‍👩‍👧", "Big packs for the whole family"),
    ("Combo Packs", "🎉", "Value combos with a bit of everything"),
]

# name, category, price, discount_price, stock, rating, sold, featured, description
PRODUCTS = [
    ("1000 Wala Garland", "Fancy Crackers", 650, 520, 40, 4.6, 320, True, "Classic 1000-shot garland crackers for celebrations."),
    ("Flower Pot Big (10 pcs)", "Flower Pots", 450, 360, 60, 4.7, 410, True, "Tall fountain of colourful sparks. Pack of 10."),
    ("Flower Pot Deluxe (5 pcs)", "Flower Pots", 380, None, 8, 4.5, 150, False, "Deluxe flower pots with a longer burst."),
    ("Colour Sparklers 10cm (10 pcs)", "Sparklers", 90, 75, 200, 4.4, 610, True, "Bright colourful sparklers. 10 per pack."),
    ("Golden Sparklers 30cm (10 pcs)", "Sparklers", 180, 150, 120, 4.6, 380, False, "Long-lasting golden sparklers."),
    ("Rocket Bomb (10 pcs)", "Rockets", 320, 270, 50, 4.3, 240, False, "Classic sky rockets. Pack of 10."),
    ("Whistling Rocket (5 pcs)", "Rockets", 260, None, 35, 4.2, 120, False, "Rockets with a whistling effect."),
    ("Ground Chakkar Big (10 pcs)", "Ground Chakkars", 210, 170, 90, 4.5, 330, True, "Bright spinning ground chakkars."),
    ("Ground Chakkar Special (25 pcs)", "Ground Chakkars", 480, 400, 45, 4.4, 175, False, "Value pack of special chakkars."),
    ("Fancy Fountain 5-in-1", "Fancy Crackers", 750, 600, 25, 4.8, 290, True, "Five-colour fancy fountain."),
    ("Colour Shot 7 Shot", "Fancy Crackers", 540, 450, 30, 4.7, 210, False, "Seven-shot multicolour aerial effect."),
    ("Festive Gift Box (Small)", "Gift Boxes", 899, 749, 30, 4.6, 260, True, "Assorted crackers in a pretty gift box."),
    ("Festive Gift Box (Premium)", "Gift Boxes", 1999, 1599, 15, 4.9, 140, True, "Premium assortment for gifting."),
    ("Kids Combo (20 items)", "Kids Collection", 599, 480, 55, 4.7, 450, True, "Low-noise combo picked for kids, to be used with adults."),
    ("Mini Sparkler Fun Pack", "Kids Collection", 199, 160, 100, 4.5, 280, False, "Small sparklers and fun items."),
    ("Family Combo (35 items)", "Family Packs", 1499, 1199, 20, 4.8, 330, True, "A big mix for the family."),
    ("Family Mega Pack (60 items)", "Family Packs", 2799, 2199, 5, 4.9, 180, False, "Our biggest family pack."),
    ("Diwali Value Combo", "Combo Packs", 999, 799, 70, 4.6, 520, True, "Best-selling value combo."),
    ("Party Combo Deluxe", "Combo Packs", 1299, None, 0, 4.3, 90, False, "Deluxe party assortment (currently sold out)."),
]


class Command(BaseCommand):
    help = "Create sample categories, products, an admin and a demo customer."

    def handle(self, *args, **opts):
        cats = {}
        for name, icon, desc in CATEGORIES:
            cats[name], _ = Category.objects.get_or_create(name=name, defaults={"icon": icon, "description": desc})
        for name, cat, price, disc, stock, rating, sold, feat, desc in PRODUCTS:
            Product.objects.get_or_create(name=name, defaults=dict(
                category=cats[cat], price=Decimal(price), discount_price=Decimal(disc) if disc else None,
                stock=stock, rating=Decimal(str(rating)), rating_count=sold // 3, sold_count=sold,
                is_featured=feat, description=desc,
                specifications=f"Category: {cat}\nPack: As described\nBrand: CrackersHub\nUse: Outdoor, adult supervision"))
        if not User.objects.filter(username="admin").exists():
            u = User.objects.create_superuser("admin", "admin@crackershub.com", "Admin@12345")
            u.profile.full_name = "Store Admin"
            u.profile.save()
        if not User.objects.filter(username="customer").exists():
            u = User.objects.create_user("customer", "customer@example.com", "Customer@123")
            u.profile.full_name, u.profile.phone = "Demo Customer", "9876543210"
            u.profile.save()
        self.stdout.write(self.style.SUCCESS(
            "Seed complete.\n  Admin:    admin / Admin@12345\n  Customer: customer / Customer@123"))
