from django.db import models


class Customer(models.Model):
    COMPANY = 'company'
    INDIVIDUAL = 'individual'
    CUSTOMER_TYPE_CHOICES = [
        (COMPANY, 'Company'),
        (INDIVIDUAL, 'Individual'),
    ]

    name = models.CharField(max_length=200, null=False)
    customer_type = models.CharField(
        max_length=10,
        choices=CUSTOMER_TYPE_CHOICES,
        null=False,
    )
    tax_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(max_length=254, unique=True, null=False)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True, null=False)
    created_at = models.DateTimeField(auto_now_add=True, null=False)
    updated_at = models.DateTimeField(auto_now=True, null=False)

    class Meta:
        db_table = 'customers'
        ordering = ['name']

    def __str__(self):
        return self.name
