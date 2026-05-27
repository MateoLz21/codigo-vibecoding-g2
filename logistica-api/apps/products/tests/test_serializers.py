from django.test import TestCase

from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductSerializerValidationTest(TestCase):

    def setUp(self):
        self.supplier = Supplier.objects.create(name='Proveedor Test')
        self.warehouse = Warehouse.objects.create(
            name='Almacen Test',
            address='Av. Industrial 123',
            city='Lima',
        )
        self.valid_data = {
            'supplier': self.supplier.id,
            'warehouse': self.warehouse.id,
            'name': 'Laptop Pro',
            'sku': 'SER-001',
            'weight_kg': '1.500',
            'unit_price': '999.99',
            'stock': 10,
        }

    # ------------------------------------------------------------------
    # Datos completos y válidos
    # ------------------------------------------------------------------

    def test_valid_data_is_valid(self):
        serializer = ProductSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # ------------------------------------------------------------------
    # Validación de stock
    # ------------------------------------------------------------------

    def test_stock_zero_is_valid(self):
        data = {**self.valid_data, 'stock': 0, 'sku': 'SER-002'}
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_stock_positive_is_valid(self):
        data = {**self.valid_data, 'stock': 100, 'sku': 'SER-003'}
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_stock_minus_one_is_invalid(self):
        data = {**self.valid_data, 'stock': -1, 'sku': 'SER-004'}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stock', serializer.errors)

    def test_stock_large_negative_is_invalid(self):
        data = {**self.valid_data, 'stock': -100, 'sku': 'SER-005'}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stock', serializer.errors)

    # ------------------------------------------------------------------
    # Validación de unit_price
    # ------------------------------------------------------------------

    def test_unit_price_positive_is_valid(self):
        data = {**self.valid_data, 'unit_price': '0.01', 'sku': 'SER-006'}
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_unit_price_zero_is_invalid(self):
        data = {**self.valid_data, 'unit_price': '0.00', 'sku': 'SER-007'}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price', serializer.errors)

    def test_unit_price_negative_is_invalid(self):
        data = {**self.valid_data, 'unit_price': '-5.00', 'sku': 'SER-008'}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price', serializer.errors)

    def test_unit_price_large_negative_is_invalid(self):
        data = {**self.valid_data, 'unit_price': '-999.99', 'sku': 'SER-009'}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price', serializer.errors)

    # ------------------------------------------------------------------
    # Validación de weight_kg
    # ------------------------------------------------------------------

    def test_weight_kg_positive_is_valid(self):
        data = {**self.valid_data, 'weight_kg': '0.001', 'sku': 'SER-010'}
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # ------------------------------------------------------------------
    # Campos requeridos
    # ------------------------------------------------------------------

    def test_missing_name_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'name'}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_sku_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'sku'}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_missing_supplier_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'supplier'}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('supplier', serializer.errors)

    def test_missing_warehouse_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'warehouse'}
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('warehouse', serializer.errors)

    # ------------------------------------------------------------------
    # Campos read-only
    # ------------------------------------------------------------------

    def test_id_is_read_only(self):
        meta_read_only = ProductSerializer.Meta.read_only_fields
        self.assertIn('id', meta_read_only)

    def test_created_at_is_read_only(self):
        meta_read_only = ProductSerializer.Meta.read_only_fields
        self.assertIn('created_at', meta_read_only)

    def test_updated_at_is_read_only(self):
        meta_read_only = ProductSerializer.Meta.read_only_fields
        self.assertIn('updated_at', meta_read_only)
