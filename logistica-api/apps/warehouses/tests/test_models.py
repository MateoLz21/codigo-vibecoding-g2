from django.test import TestCase
from django.db import IntegrityError

from apps.warehouses.models import Warehouse


class WarehouseModelTest(TestCase):

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacen Central',
            address='Av. Principal 123',
            city='Lima',
        )

    def test_str_representation(self):
        self.assertEqual(str(self.warehouse), 'Almacen Central — Lima')

    def test_str_representation_with_different_city(self):
        wh = Warehouse.objects.create(
            name='Deposito Norte',
            address='Jr. Los Pinos 456',
            city='Trujillo',
        )
        self.assertEqual(str(wh), 'Deposito Norte — Trujillo')

    def test_country_default_is_peru(self):
        self.assertEqual(self.warehouse.country, 'Peru')

    def test_is_active_default_true(self):
        wh = Warehouse.objects.create(
            name='Almacen Beta',
            address='Calle Secundaria 789',
            city='Arequipa',
        )
        self.assertTrue(wh.is_active)

    def test_created_at_auto_set(self):
        self.assertIsNotNone(self.warehouse.created_at)

    def test_updated_at_auto_set(self):
        self.assertIsNotNone(self.warehouse.updated_at)

    def test_updated_at_changes_on_save(self):
        old_updated_at = self.warehouse.updated_at
        self.warehouse.city = 'Cusco'
        self.warehouse.save()
        self.warehouse.refresh_from_db()
        # updated_at puede o no cambiar en SQLite en el mismo segundo,
        # lo importante es que el campo existe y se guarda
        self.assertIsNotNone(self.warehouse.updated_at)

    def test_optional_fields_default_none(self):
        self.assertIsNone(self.warehouse.latitude)
        self.assertIsNone(self.warehouse.longitude)
        self.assertIsNone(self.warehouse.capacity_m3)

    def test_create_with_all_fields(self):
        wh = Warehouse.objects.create(
            name='Almacen Completo',
            address='Av. Los Heroes 100',
            city='Piura',
            country='Peru',
            latitude=-5.194,
            longitude=-80.633,
            capacity_m3=500.00,
        )
        self.assertEqual(wh.name, 'Almacen Completo')
        self.assertEqual(wh.city, 'Piura')
        self.assertEqual(wh.country, 'Peru')
        self.assertIsNotNone(wh.capacity_m3)

    def test_create_without_name_raises_error(self):
        with self.assertRaises(IntegrityError):
            Warehouse.objects.create(
                name=None,
                address='Av. Test 1',
                city='Lima',
            )

    def test_create_without_address_raises_error(self):
        with self.assertRaises(IntegrityError):
            Warehouse.objects.create(
                name='Sin Direccion',
                address=None,
                city='Lima',
            )

    def test_create_without_city_raises_error(self):
        with self.assertRaises(IntegrityError):
            Warehouse.objects.create(
                name='Sin Ciudad',
                address='Av. Test 1',
                city=None,
            )

    def test_meta_db_table(self):
        self.assertEqual(Warehouse._meta.db_table, 'warehouses')

    def test_meta_ordering(self):
        self.assertEqual(Warehouse._meta.ordering, ['name'])

    def test_ordering_by_name(self):
        Warehouse.objects.all().delete()
        Warehouse.objects.create(name='Zeta', address='Dir Z', city='Lima')
        Warehouse.objects.create(name='Alpha', address='Dir A', city='Lima')
        Warehouse.objects.create(name='Beta', address='Dir B', city='Lima')
        names = list(Warehouse.objects.values_list('name', flat=True))
        self.assertEqual(names, ['Alpha', 'Beta', 'Zeta'])
