from django.db import IntegrityError
from django.test import TestCase

from apps.suppliers.models import Supplier


class SupplierModelTest(TestCase):

    def test_str_returns_name(self):
        supplier = Supplier(name='Tech Corp')
        self.assertEqual(str(supplier), 'Tech Corp')

    def test_is_active_default_true(self):
        supplier = Supplier.objects.create(name='Proveedor Activo')
        self.assertTrue(supplier.is_active)

    def test_created_at_set_automatically(self):
        supplier = Supplier.objects.create(name='Proveedor Fecha')
        self.assertIsNotNone(supplier.created_at)

    def test_updated_at_set_automatically(self):
        supplier = Supplier.objects.create(name='Proveedor Updated')
        self.assertIsNotNone(supplier.updated_at)

    def test_name_is_required(self):
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(name=None)

    def test_tax_id_nullable(self):
        supplier = Supplier.objects.create(name='Sin RUC')
        self.assertIsNone(supplier.tax_id)

    def test_email_nullable(self):
        supplier = Supplier.objects.create(name='Sin Email')
        self.assertIsNone(supplier.email)

    def test_phone_nullable(self):
        supplier = Supplier.objects.create(name='Sin Telefono')
        self.assertIsNone(supplier.phone)

    def test_address_nullable(self):
        supplier = Supplier.objects.create(name='Sin Direccion')
        self.assertIsNone(supplier.address)

    def test_contact_name_nullable(self):
        supplier = Supplier.objects.create(name='Sin Contacto')
        self.assertIsNone(supplier.contact_name)

    def test_tax_id_unique_constraint(self):
        Supplier.objects.create(name='Proveedor A', tax_id='20123456789')
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(name='Proveedor B', tax_id='20123456789')

    def test_multiple_suppliers_can_have_null_tax_id(self):
        supplier_a = Supplier.objects.create(name='Proveedor A', tax_id=None)
        supplier_b = Supplier.objects.create(name='Proveedor B', tax_id=None)
        self.assertIsNone(supplier_a.tax_id)
        self.assertIsNone(supplier_b.tax_id)

    def test_create_with_all_fields(self):
        supplier = Supplier.objects.create(
            name='Full Corp',
            tax_id='20999999999',
            email='contact@fullcorp.com',
            phone='999888777',
            address='Av. Siempre Viva 123',
            contact_name='Juan Perez',
        )
        self.assertEqual(supplier.name, 'Full Corp')
        self.assertEqual(supplier.tax_id, '20999999999')
        self.assertEqual(supplier.email, 'contact@fullcorp.com')
        self.assertEqual(supplier.phone, '999888777')
        self.assertEqual(supplier.address, 'Av. Siempre Viva 123')
        self.assertEqual(supplier.contact_name, 'Juan Perez')

    def test_ordering_by_name(self):
        Supplier.objects.create(name='Zebra Corp')
        Supplier.objects.create(name='Alpha Corp')
        Supplier.objects.create(name='Medium Corp')
        suppliers = list(Supplier.objects.values_list('name', flat=True))
        self.assertEqual(suppliers, ['Alpha Corp', 'Medium Corp', 'Zebra Corp'])

    def test_db_table_name(self):
        self.assertEqual(Supplier._meta.db_table, 'suppliers')
