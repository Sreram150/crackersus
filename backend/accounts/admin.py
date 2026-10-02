from django.contrib import admin
from .models import Address, UserProfile

admin.site.register(UserProfile)
admin.site.register(Address)
