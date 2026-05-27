from decimal import Decimal

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from apps.customers.models import Customer
from apps.products.models import Product
from apps.shipments.models import Shipment, ShipmentItem
from apps.shipments.serializers import ShipmentItemSerializer, ShipmentSerializer
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ShipmentSerializerTest(TestCase):

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Serializer',
            customer_type='company',
            email='serializertest@test.com',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Serializer',
            address='Calle Serializer 1',
            city='Lima',
        )

    def test_read_only_fields_not_writable(self):
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen',
            destination_address='Destino',
        )
        data = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'origin_address': 'Origen Nueva',
            'destination_address': 'Destino Nuevo',
            'id': 9999,
            'total_weight_kg': '100.000',
            'shipping_cost': '50.00',
            'created_at': '2020-01-01T00:00:00Z',
            'updated_at': '2020-01-01T00:00:00Z',
        }
        serializer = ShipmentSerializer(shipment, data=data)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        # Los campos read-only no deben cambiar
        self.assertNotEqual(updated.id, 9999)
        self.assertEqual(updated.total_weight_kg, Decimal('0'))
        self.assertEqual(updated.shipping_cost, Decimal('0'))

    def test_serializer_valid_with_minimum_fields(self):
        data = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'origin_address': 'Origen Min',
            'destination_address': 'Destino Min',
            'status': 'pending',
        }
        serializer = ShipmentSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_invalid_without_customer(self):
        data = {
            'origin_warehouse': self.warehouse.id,
            'origin_address': 'Origen',
            'destination_address': 'Destino',
        }
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer', serializer.errors)

    def test_serializer_invalid_without_origin_address(self):
        data = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'Destino',
        }
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_address', serializer.errors)


class ShipmentItemSerializerTest(TestCase):

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Item Serializer',
            customer_type='company',
            email='itemserializer@test.com',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Item Serializer',
            address='Calle Item 2',
            city='Arequipa',
        )
        self.supplier = Supplier.objects.create(name='Proveedor Item Serializer')
        self.product = Product.objects.create(
            name='Tablet',
            sku='TAB-001',
            unit_price=Decimal('350.00'),
            weight_kg=Decimal('0.500'),
            stock=25,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen Item',
            destination_address='Destino Item',
        )

    def test_validate_quantity_zero_raises_validation_error(self):
        data = {
            'shipment': self.shipment.id,
            'product': self.product.id,
            'quantity': 0,
        }
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_validate_quantity_negative_raises_validation_error(self):
        data = {
            'shipment': self.shipment.id,
            'product': self.product.id,
            'quantity': -5,
        }
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_validate_quantity_one_is_valid(self):
        data = {
            'shipment': self.shipment.id,
            'product': self.product.id,
            'quantity': 1,
        }
        serializer = ShipmentItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_unit_price_is_read_only(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price=Decimal('350.00'),
            subtotal=Decimal('700.00'),
        )
        data = {
            'shipment': self.shipment.id,
            'product': self.product.id,
            'quantity': 2,
            'unit_price': '9999.99',
            'subtotal': '9999.99',
        }
        serializer = ShipmentItemSerializer(item, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        # unit_price y subtotal son read-only — no deben cambiar al valor enviado
        self.assertNotEqual(updated.unit_price, Decimal('9999.99'))

    def test_subtotal_is_read_only(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price=Decimal('350.00'),
            subtotal=Decimal('700.00'),
        )
        data = {
            'shipment': self.shipment.id,
            'product': self.product.id,
            'quantity': 2,
            'subtotal': '9999.99',
        }
        serializer = ShipmentItemSerializer(item, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertNotEqual(updated.subtotal, Decimal('9999.99'))
