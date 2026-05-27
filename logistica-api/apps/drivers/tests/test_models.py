import datetime

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from apps.drivers.models import Driver

User = get_user_model()


class DriverModelTest(TestCase):
    """Tests unitarios para el modelo Driver."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='driver_user',
            password='testpass123',
            first_name='Juan',
            last_name='Perez',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
        )

    def test_str_with_full_name(self):
        """__str__ retorna nombre completo del user y numero de licencia."""
        expected = 'Juan Perez (LIC-001)'
        self.assertEqual(str(self.driver), expected)

    def test_str_without_full_name(self):
        """__str__ cuando el user no tiene nombre: retorna espacio vacío y licencia."""
        user_no_name = User.objects.create_user(
            username='nofullname',
            password='testpass123',
        )
        driver = Driver.objects.create(
            user=user_no_name,
            license_number='LIC-002',
            license_expiry=datetime.date(2027, 12, 31),
        )
        expected = ' (LIC-002)'
        self.assertEqual(str(driver), expected)

    def test_is_available_default_true(self):
        """is_available se inicializa en True por defecto."""
        self.assertTrue(self.driver.is_available)

    def test_phone_nullable(self):
        """phone acepta null correctamente."""
        self.assertIsNone(self.driver.phone)

    def test_phone_can_be_set(self):
        """phone acepta valor cuando se provee."""
        user2 = User.objects.create_user(username='driver2', password='pass')
        driver = Driver.objects.create(
            user=user2,
            license_number='LIC-003',
            license_expiry=datetime.date(2026, 6, 30),
            phone='+51999888777',
        )
        self.assertEqual(driver.phone, '+51999888777')

    def test_created_at_auto_set(self):
        """created_at se setea automaticamente al crear."""
        self.assertIsNotNone(self.driver.created_at)

    def test_updated_at_auto_set(self):
        """updated_at se setea automaticamente al crear."""
        self.assertIsNotNone(self.driver.updated_at)

    def test_updated_at_changes_on_save(self):
        """updated_at cambia cuando se guarda el objeto."""
        original_updated_at = self.driver.updated_at
        self.driver.is_available = False
        self.driver.save()
        self.driver.refresh_from_db()
        self.assertGreaterEqual(self.driver.updated_at, original_updated_at)

    def test_user_onetoone_uniqueness(self):
        """Crear dos drivers con el mismo user lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=self.user,
                license_number='LIC-DUPE-USER',
                license_expiry=datetime.date(2027, 1, 1),
            )

    def test_license_number_unique(self):
        """Crear dos drivers con el mismo license_number lanza IntegrityError."""
        user2 = User.objects.create_user(username='driver3', password='pass')
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=user2,
                license_number='LIC-001',  # duplicado
                license_expiry=datetime.date(2027, 1, 1),
            )

    def test_create_without_user_raises_error(self):
        """Crear driver sin user lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                license_number='LIC-NOUSER',
                license_expiry=datetime.date(2027, 1, 1),
            )

    def test_create_without_license_number_raises_error(self):
        """Crear driver sin license_number (None) lanza IntegrityError."""
        user2 = User.objects.create_user(username='driver4', password='pass')
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=user2,
                license_number=None,
                license_expiry=datetime.date(2027, 1, 1),
            )

    def test_meta_ordering(self):
        """El modelo ordena por -created_at por defecto."""
        self.assertEqual(Driver._meta.ordering, ['-created_at'])

    def test_meta_db_table(self):
        """La tabla de BD se llama drivers."""
        self.assertEqual(Driver._meta.db_table, 'drivers')

    def test_is_available_can_be_false(self):
        """is_available puede setearse a False."""
        self.driver.is_available = False
        self.driver.save()
        self.driver.refresh_from_db()
        self.assertFalse(self.driver.is_available)

    def test_driver_profile_related_name(self):
        """El user puede acceder al driver via driver_profile."""
        self.assertEqual(self.user.driver_profile, self.driver)
