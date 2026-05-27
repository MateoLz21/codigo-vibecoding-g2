import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.drivers.filters import DriverFilter
from apps.drivers.models import Driver

User = get_user_model()


def create_driver(username, license_number, license_expiry, is_available=True, is_active=True):
    """Helper: crea un User y un Driver para tests de filtros."""
    user = User.objects.create_user(
        username=username,
        password='pass',
        is_active=is_active,
    )
    return Driver.objects.create(
        user=user,
        license_number=license_number,
        license_expiry=license_expiry,
        is_available=is_available,
    )


class DriverFilterTest(TestCase):
    """Tests para DriverFilter."""

    def setUp(self):
        self.driver_available = create_driver(
            username='avail',
            license_number='LIC-A',
            license_expiry=datetime.date(2030, 6, 1),
            is_available=True,
        )
        self.driver_unavailable = create_driver(
            username='unavail',
            license_number='LIC-B',
            license_expiry=datetime.date(2025, 1, 15),
            is_available=False,
        )
        self.driver_inactive_user = create_driver(
            username='inactive',
            license_number='LIC-C',
            license_expiry=datetime.date(2028, 3, 10),
            is_active=False,
        )

    def test_filter_is_available_true(self):
        """Filtro is_available=True retorna solo drivers disponibles."""
        qs = Driver.objects.all()
        f = DriverFilter({'is_available': True}, queryset=qs)
        results = list(f.qs)
        self.assertIn(self.driver_available, results)
        self.assertNotIn(self.driver_unavailable, results)

    def test_filter_is_available_false(self):
        """Filtro is_available=False retorna solo drivers no disponibles."""
        qs = Driver.objects.all()
        f = DriverFilter({'is_available': False}, queryset=qs)
        results = list(f.qs)
        self.assertNotIn(self.driver_available, results)
        self.assertIn(self.driver_unavailable, results)

    def test_filter_license_expiry_gte(self):
        """Filtro license_expiry_gte filtra correctamente por fecha de vencimiento minima."""
        qs = Driver.objects.all()
        f = DriverFilter({'license_expiry_gte': '2026-01-01'}, queryset=qs)
        results = list(f.qs)
        self.assertIn(self.driver_available, results)   # expira 2030
        self.assertNotIn(self.driver_unavailable, results)  # expira 2025

    def test_filter_license_expiry_lte(self):
        """Filtro license_expiry_lte filtra correctamente por fecha de vencimiento maxima."""
        qs = Driver.objects.all()
        f = DriverFilter({'license_expiry_lte': '2026-01-01'}, queryset=qs)
        results = list(f.qs)
        self.assertNotIn(self.driver_available, results)  # expira 2030
        self.assertIn(self.driver_unavailable, results)   # expira 2025

    def test_filter_license_expiry_range(self):
        """Combinacion de gte y lte retorna drivers dentro del rango de fechas."""
        qs = Driver.objects.all()
        f = DriverFilter(
            {'license_expiry_gte': '2027-01-01', 'license_expiry_lte': '2031-01-01'},
            queryset=qs,
        )
        results = list(f.qs)
        self.assertIn(self.driver_available, results)    # 2030 en rango
        self.assertIn(self.driver_inactive_user, results)  # 2028 en rango
        self.assertNotIn(self.driver_unavailable, results)  # 2025 fuera del rango

    def test_filter_user_is_active_false(self):
        """Filtro user_is_active=False retorna solo drivers cuyo user esta inactivo."""
        qs = Driver.objects.all()
        f = DriverFilter({'user_is_active': False}, queryset=qs)
        results = list(f.qs)
        self.assertIn(self.driver_inactive_user, results)
        self.assertNotIn(self.driver_available, results)
        self.assertNotIn(self.driver_unavailable, results)

    def test_filter_user_is_active_true(self):
        """Filtro user_is_active=True retorna solo drivers cuyo user esta activo."""
        qs = Driver.objects.all()
        f = DriverFilter({'user_is_active': True}, queryset=qs)
        results = list(f.qs)
        self.assertNotIn(self.driver_inactive_user, results)
        self.assertIn(self.driver_available, results)
        self.assertIn(self.driver_unavailable, results)

    def test_no_filters_returns_all(self):
        """Sin filtros retorna todos los drivers del queryset."""
        qs = Driver.objects.all()
        f = DriverFilter({}, queryset=qs)
        self.assertEqual(f.qs.count(), 3)

    def test_combined_is_available_and_license_expiry(self):
        """Combinacion de is_available y license_expiry_gte filtra correctamente."""
        qs = Driver.objects.all()
        f = DriverFilter(
            {'is_available': True, 'license_expiry_gte': '2029-01-01'},
            queryset=qs,
        )
        results = list(f.qs)
        self.assertIn(self.driver_available, results)   # disponible y expira 2030
        self.assertNotIn(self.driver_unavailable, results)  # no disponible
        self.assertNotIn(self.driver_inactive_user, results)  # expira 2028 < 2029
