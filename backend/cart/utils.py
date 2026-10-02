from decimal import Decimal

DELIVERY_CHARGE = Decimal("60")
FREE_DELIVERY_ABOVE = Decimal("999")


def compute_totals(lines):
    """lines: iterable of (product, quantity). Returns Decimal totals."""
    subtotal = discount = Decimal("0")
    for product, qty in lines:
        subtotal += product.price * qty
        discount += (product.price - product.final_price) * qty
    net = subtotal - discount
    delivery = Decimal("0") if (net == 0 or net >= FREE_DELIVERY_ABOVE) else DELIVERY_CHARGE
    return {"subtotal": subtotal, "discount": discount, "delivery_charge": delivery, "total": net + delivery}
