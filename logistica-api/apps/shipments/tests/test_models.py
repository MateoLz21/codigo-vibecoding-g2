from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase

from apps.customers.models import Customer
from apps.products.models import Product
from apps.shipments.models import Shipment, ShipmentItem
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ShipmentModelTest(TestCase):

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Test',
            customer_type='company',
            email='cliente@test.com',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Test',
            address='Av. Principal 123',
            city='Lima',
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Av. Origen 100',
            destination_address='Av. Destino 200',
        )

    def test_str_representation(self):
        expected = f"Shipment {self.shipment.id} — {self.customer} [pending]"
        self.assertEqual(str(self.shipment), expected)

    def test_status_choices_values(self):
        choices_values = [choice[0] for choice in Shipment.STATUS_CHOICES]
        self.assertIn('pending', choices_values)
        self.assertIn('in_transit', choices_values)
        self.assertIn('delivered', choices_values)
        self.assertIn('cancelled', choices_values)

    def test_status_default_is_pending(self):
        self.assertEqual(self.shipment.status, Shipment.PENDING)
        self.assertEqual(self.shipment.status, 'pending')

    def test_is_active_default_true(self):
        self.assertTrue(self.shipment.is_active)

    def test_total_weight_kg_default_zero(self):
        self.assertEqual(self.shipment.total_weight_kg, Decimal('0'))

    def test_shipping_cost_default_zero(self):
        self.assertEqual(self.shipment.shipping_cost, Decimal('0'))

    def test_created_at_set_automatically(self):
        self.assertIsNotNone(self.shipment.created_at)

    def test_updated_at_set_automatically(self):
        self.assertIsNotNone(self.shipment.updated_at)

    def test_transport_is_nullable(self):
        self.assertIsNone(self.shipment.transport)

    def test_route_is_nullable(self):
        self.assertIsNone(self.shipment.route)

    def test_shipping_date_is_nullable(self):
        self.assertIsNone(self.shipment.shipping_date)

    def test_estimated_delivery_date_is_nullable(self):
        self.assertIsNone(self.shipment.estimated_delivery_date)

    def test_actual_delivery_date_is_nullable(self):
        self.assertIsNone(self.shipment.actual_delivery_date)

    def test_notes_is_nullable(self):
        self.assertIsNone(self.shipment.notes)

    def test_shipment_without_customer_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(
                origin_warehouse=self.warehouse,
                origin_address='Av. Origen 100',
                destination_address='Av. Destino 200',
            )

    def test_shipment_without_origin_warehouse_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(
                customer=self.customer,
                origin_address='Av. Origen 100',
                destination_address='Av. Destino 200',
            )

    def test_db_table_name(self):
        self.assertEqual(Shipment._meta.db_table, 'shipments')


class ShipmentItemModelTest(TestCase):

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Item Test',
            customer_type='company',
            email='itemcliente@test.com',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Item Test',
            address='Av. Item 456',
            city='Arequipa',
        )
        self.supplier = Supplier.objects.create(name='Proveedor Item Test')
        self.product = Product.objects.create(
            name='Laptop Test',
            sku='LAP-TEST-001',
            unit_price=Decimal('999.99'),
            weight_kg=Decimal('1.500'),
            stock=10,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Av. Origen 100',
            destination_address='Av. Destino 200',
        )
        self.item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price=Decimal('999.99'),
            subtotal=Decimal('1999.98'),
        )

    def test_str_representation(self):
        expected = f"2x {self.product} @ 999.99"
        self.assertEqual(str(self.item), expected)

    def test_fk_to_shipment_cascade_on_delete(self):
        item_id = self.item.id
        self.shipment.delete()
        self.assertFalse(ShipmentItem.objects.filter(pk=item_id).exists())

    def test_fk_to_product_protect_on_delete(self):
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.product.delete()

    def test_subtotal_stored_correctly(self):
        self.assertEqual(self.item.subtotal, Decimal('1999.98'))

    def test_unit_price_stored_correctly(self):
        self.assertEqual(self.item.unit_price, Decimal('999.99'))

    def test_quantity_stored_correctly(self):
        self.assertEqual(self.item.quantity, 2)

    def test_item_belongs_to_correct_shipment(self):
        self.assertEqual(self.item.shipment, self.shipment)

    def test_item_without_shipment_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            ShipmentItem.objects.create(
                product=self.product,
                quantity=1,
                unit_price=Decimal('999.99'),
                subtotal=Decimal('999.99'),
            )

    def test_item_without_product_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            ShipmentItem.objects.create(
                shipment=self.shipment,
                quantity=1,
                unit_price=Decimal('999.99'),
                subtotal=Decimal('999.99'),
            )

    def test_db_table_name(self):
        self.assertEqual(ShipmentItem._meta.db_table, 'shipment_items')
