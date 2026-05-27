from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from django.test import TestCase

from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductModelTest(TestCase):

    def setUp(self):
        self.supplier = Supplier.objects.create(name='Proveedor Test')
        self.warehouse = Warehouse.objects.create(
            name='Almacen Test',
            address='Av. Industrial 123',
            city='Lima',
        )

    def _make_product(self, **kwargs):
        defaults = {
            'supplier': self.supplier,
            'warehouse': self.warehouse,
            'name': 'Laptop Pro',
            'sku': 'SKU-001',
            'weight_kg': '1.500',
            'unit_price': '999.99',
            'stock': 10,
        }
        defaults.update(kwargs)
        return Product.objects.create(**defaults)

    # ------------------------------------------------------------------
    # __str__
    # ------------------------------------------------------------------

    def test_str_representation(self):
        product = self._make_product(sku='LAP-001', name='Laptop Pro')
        self.assertEqual(str(product), 'LAP-001 — Laptop Pro')

    # ------------------------------------------------------------------
    # Campos con default
    # ------------------------------------------------------------------

    def test_stock_default_is_zero(self):
        product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Teclado',
            sku='TEC-001',
            weight_kg='0.300',
            unit_price='49.99',
        )
        self.assertEqual(product.stock, 0)

    def test_is_active_default_true(self):
        product = self._make_product(sku='ACT-001')
        self.assertTrue(product.is_active)

    # ------------------------------------------------------------------
    # Timestamps automáticos
    # ------------------------------------------------------------------

    def test_created_at_set_on_create(self):
        product = self._make_product(sku='TS-001')
        self.assertIsNotNone(product.created_at)

    def test_updated_at_set_on_create(self):
        product = self._make_product(sku='TS-002')
        self.assertIsNotNone(product.updated_at)

    def test_updated_at_changes_on_save(self):
        product = self._make_product(sku='TS-003')
        original_updated_at = product.updated_at
        product.name = 'Laptop Pro Updated'
        product.save()
        product.refresh_from_db()
        # updated_at debe ser >= al valor original
        self.assertGreaterEqual(product.updated_at, original_updated_at)

    # ------------------------------------------------------------------
    # Campos requeridos — IntegrityError si faltan
    # ------------------------------------------------------------------

    def test_create_without_name_raises_error(self):
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                supplier=self.supplier,
                warehouse=self.warehouse,
                name=None,
                sku='REQ-001',
                weight_kg='1.000',
                unit_price='100.00',
            )

    def test_create_without_sku_raises_error(self):
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                supplier=self.supplier,
                warehouse=self.warehouse,
                name='Producto Sin SKU',
                sku=None,
                weight_kg='1.000',
                unit_price='100.00',
            )

    def test_sku_is_unique(self):
        self._make_product(sku='UNIQUE-001')
        with self.assertRaises(IntegrityError):
            self._make_product(sku='UNIQUE-001')

    # ------------------------------------------------------------------
    # FK on_delete=PROTECT — supplier y warehouse
    # ------------------------------------------------------------------

    def test_delete_supplier_with_products_raises_protected_error(self):
        self._make_product(sku='PROT-001')
        with self.assertRaises(ProtectedError):
            self.supplier.delete()

    def test_delete_warehouse_with_products_raises_protected_error(self):
        self._make_product(sku='PROT-002')
        with self.assertRaises(ProtectedError):
            self.warehouse.delete()

    # ------------------------------------------------------------------
    # Ordenamiento del modelo
    # ------------------------------------------------------------------

    def test_ordering_by_name(self):
        self._make_product(sku='ORD-001', name='Zebra')
        self._make_product(sku='ORD-002', name='Apple')
        self._make_product(sku='ORD-003', name='Monitor')
        names = list(Product.objects.values_list('name', flat=True))
        self.assertEqual(names, sorted(names))

    # ------------------------------------------------------------------
    # Campo db_table
    # ------------------------------------------------------------------

    def test_db_table_name(self):
        self.assertEqual(Product._meta.db_table, 'products')
