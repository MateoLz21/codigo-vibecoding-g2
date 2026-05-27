from django.test import TestCase
from django.db import IntegrityError

from apps.transport.models import Transport


class TransportModelTest(TestCase):

    def _make_transport(self, **kwargs):
        defaults = {
            'plate_number': 'ABC-123',
            'vehicle_type': Transport.TRUCK,
            'max_capacity_kg': 1000.00,
        }
        defaults.update(kwargs)
        return Transport.objects.create(**defaults)

    # --- __str__ ---

    def test_str_returns_plate_and_type(self):
        transport = self._make_transport(plate_number='XYZ-999', vehicle_type=Transport.VAN)
        self.assertEqual(str(transport), 'XYZ-999 (van)')

    def test_str_with_motorcycle(self):
        transport = self._make_transport(plate_number='M001', vehicle_type=Transport.MOTORCYCLE)
        self.assertEqual(str(transport), 'M001 (motorcycle)')

    # --- Choices ---

    def test_vehicle_type_choices_values(self):
        expected = {'truck', 'van', 'motorcycle'}
        actual = {value for value, _ in Transport.VEHICLE_TYPE_CHOICES}
        self.assertEqual(actual, expected)

    def test_vehicle_type_choices_labels(self):
        label_map = dict(Transport.VEHICLE_TYPE_CHOICES)
        self.assertEqual(label_map['truck'], 'Truck')
        self.assertEqual(label_map['van'], 'Van')
        self.assertEqual(label_map['motorcycle'], 'Motorcycle')

    # --- Defaults ---

    def test_is_active_default_true(self):
        transport = self._make_transport(plate_number='DEF-001')
        self.assertTrue(transport.is_active)

    def test_driver_defaults_to_null(self):
        transport = self._make_transport(plate_number='DEF-002')
        self.assertIsNone(transport.driver)

    def test_brand_defaults_to_null(self):
        transport = self._make_transport(plate_number='DEF-003')
        self.assertIsNone(transport.brand)

    def test_model_defaults_to_null(self):
        transport = self._make_transport(plate_number='DEF-004')
        self.assertIsNone(transport.model)

    def test_year_defaults_to_null(self):
        transport = self._make_transport(plate_number='DEF-005')
        self.assertIsNone(transport.year)

    # --- Timestamps ---

    def test_created_at_set_on_creation(self):
        transport = self._make_transport(plate_number='TS-001')
        self.assertIsNotNone(transport.created_at)

    def test_updated_at_set_on_creation(self):
        transport = self._make_transport(plate_number='TS-002')
        self.assertIsNotNone(transport.updated_at)

    def test_updated_at_changes_on_save(self):
        transport = self._make_transport(plate_number='TS-003')
        created_updated_at = transport.updated_at
        transport.brand = 'Toyota'
        transport.save()
        transport.refresh_from_db()
        # updated_at debe ser >= al valor original (puede ser igual si granularidad es baja)
        self.assertGreaterEqual(transport.updated_at, created_updated_at)

    # --- Unique constraint: plate_number ---

    def test_duplicate_plate_number_raises_integrity_error(self):
        self._make_transport(plate_number='DUP-001')
        with self.assertRaises(IntegrityError):
            self._make_transport(plate_number='DUP-001')

    # --- Campos requeridos ---

    def test_create_without_plate_number_raises_error(self):
        # CharField es NOT NULL a nivel modelo; full_clean() detecta el error
        # antes de llegar a la BD.
        transport = Transport(
            vehicle_type=Transport.TRUCK,
            max_capacity_kg=500.00,
        )
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            transport.full_clean()

    def test_create_without_max_capacity_kg_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                plate_number='REQ-001',
                vehicle_type=Transport.TRUCK,
            )

    # --- Campos nullable aceptan null ---

    def test_nullable_fields_accept_none(self):
        transport = Transport.objects.create(
            plate_number='NULL-001',
            vehicle_type=Transport.VAN,
            max_capacity_kg=800.00,
            driver=None,
            brand=None,
            model=None,
            year=None,
        )
        self.assertIsNone(transport.driver)
        self.assertIsNone(transport.brand)
        self.assertIsNone(transport.model)
        self.assertIsNone(transport.year)

    # --- Meta ---

    def test_db_table_name(self):
        self.assertEqual(Transport._meta.db_table, 'transport')

    def test_default_ordering_by_plate_number(self):
        self.assertEqual(Transport._meta.ordering, ['plate_number'])
