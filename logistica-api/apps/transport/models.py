from django.db import models


class Transport(models.Model):
    TRUCK = 'truck'
    VAN = 'van'
    MOTORCYCLE = 'motorcycle'
    VEHICLE_TYPE_CHOICES = [
        (TRUCK, 'Truck'),
        (VAN, 'Van'),
        (MOTORCYCLE, 'Motorcycle'),
    ]

    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicles',
    )
    plate_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES)
    brand = models.CharField(max_length=100, null=True, blank=True)
    model = models.CharField(max_length=100, null=True, blank=True)
    year = models.IntegerField(null=True, blank=True)
    max_capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transport'
        ordering = ['plate_number']

    def __str__(self):
        return f"{self.plate_number} ({self.vehicle_type})"
