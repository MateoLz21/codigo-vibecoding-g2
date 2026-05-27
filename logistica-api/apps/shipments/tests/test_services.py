from decimal import Decimal

from django.test import TestCase

from apps.customers.models import Customer
from apps.products.models import Product
from apps.shipments.models import Shipment, ShipmentItem
from apps.shipments.services import (
    create_shipment_item,
    delete_shipment_item,
    recalculate_shipment_totals,
    update_shipment_item,
)
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class RecalculateShipmentTotalsTest(TestCase):

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Service Test',
            customer_type='company',
            email='servicetest@test.com',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Service',
            address='Calle Service 1',
            city='Lima',
        )
        self.supplier = Supplier.objects.create(name='Proveedor Service')
        self.product_a = Product.objects.create(
            name='Producto A',
            sku='PROD-A-001',
            unit_price=Decimal('500.00'),
            weight_kg=Decimal('2.000'),
            stock=20,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.product_b = Product.objects.create(
            name='Producto B',
            sku='PROD-B-001',
            unit_price=Decimal('300.00'),
            weight_kg=Decimal('1.500'),
            stock=15,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen 1',
            destination_address='Destino 1',
        )

    def test_recalculate_with_no_items_sets_zero(self):
        self.shipment.total_weight_kg = Decimal('99.000')
        self.shipment.shipping_cost = Decimal('99.00')
        self.shipment.save()
        recalculate_shipment_totals(self.shipment)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.total_weight_kg, Decimal('0'))
        self.assertEqual(self.shipment.shipping_cost, Decimal('0'))

    def test_recalculate_with_one_item(self):
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product_a,
            quantity=3,
            unit_price=self.product_a.unit_price,
            subtotal=3 * self.product_a.unit_price,
        )
        recalculate_shipment_totals(self.shipment)
        self.shipment.refresh_from_db()
        # total_weight_kg = 3 * 2.000 = 6.000
        self.assertEqual(self.shipment.total_weight_kg, Decimal('6.000'))
        # shipping_cost = 6.000 * 0.5 = 3.000
        self.assertEqual(self.shipment.shipping_cost, Decimal('3.000'))

    def test_recalculate_with_two_items(self):
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product_a,
            quantity=2,
            unit_price=self.product_a.unit_price,
            subtotal=2 * self.product_a.unit_price,
        )
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product_b,
            quantity=4,
            unit_price=self.product_b.unit_price,
            subtotal=4 * self.product_b.unit_price,
        )
        recalculate_shipment_totals(self.shipment)
        self.shipment.refresh_from_db()
        # total_weight_kg = (2 * 2.000) + (4 * 1.500) = 4.000 + 6.000 = 10.000
        self.assertEqual(self.shipment.total_weight_kg, Decimal('10.000'))
        # shipping_cost = 10.000 * 0.5 = 5.000
        self.assertEqual(self.shipment.shipping_cost, Decimal('5.000'))


class CreateShipmentItemTest(TestCase):

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Create Item',
            customer_type='individual',
            email='createitem@test.com',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Create',
            address='Calle Create 10',
            city='Cusco',
        )
        self.supplier = Supplier.objects.create(name='Proveedor Create')
        self.product = Product.objects.create(
            name='Mouse Gamer',
            sku='MOUSE-001',
            unit_price=Decimal('150.00'),
            weight_kg=Decimal('0.300'),
            stock=100,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen Create',
            destination_address='Destino Create',
        )

    def test_create_item_returns_shipment_item_instance(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )
        self.assertIsInstance(item, ShipmentItem)

    def test_create_item_freezes_unit_price(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        self.assertEqual(item.unit_price, self.product.unit_price)

    def test_create_item_price_is_frozen_not_current(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        frozen_price = item.unit_price
        # Si el precio del producto cambia, el item mantiene el precio original
        self.product.unit_price = Decimal('200.00')
        self.product.save()
        item.refresh_from_db()
        self.assertEqual(item.unit_price, frozen_price)
        self.assertNotEqual(item.unit_price, Decimal('200.00'))

    def test_create_item_calculates_subtotal(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=3,
        )
        # subtotal = 3 * 150.00 = 450.00
        self.assertEqual(item.subtotal, Decimal('450.00'))

    def test_create_item_assigns_correct_shipment(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        self.assertEqual(item.shipment, self.shipment)

    def test_create_item_assigns_correct_product(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        self.assertEqual(item.product, self.product)

    def test_create_item_recalculates_total_weight_kg(self):
        self.assertEqual(self.shipment.total_weight_kg, Decimal('0'))
        create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )
        self.shipment.refresh_from_db()
        # total_weight_kg = 2 * 0.300 = 0.600
        self.assertEqual(self.shipment.total_weight_kg, Decimal('0.600'))

    def test_create_item_recalculates_shipping_cost(self):
        self.assertEqual(self.shipment.shipping_cost, Decimal('0'))
        create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )
        self.shipment.refresh_from_db()
        # shipping_cost = 0.600 * 0.5 = 0.300
        self.assertEqual(self.shipment.shipping_cost, Decimal('0.300'))

    def test_create_two_items_accumulates_weight(self):
        product2 = Product.objects.create(
            name='Teclado',
            sku='TECLADO-001',
            unit_price=Decimal('80.00'),
            weight_kg=Decimal('0.500'),
            stock=50,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        create_shipment_item(shipment=self.shipment, product=self.product, quantity=2)
        create_shipment_item(shipment=self.shipment, product=product2, quantity=3)
        self.shipment.refresh_from_db()
        # total_weight_kg = (2 * 0.300) + (3 * 0.500) = 0.600 + 1.500 = 2.100
        self.assertEqual(self.shipment.total_weight_kg, Decimal('2.100'))
        # shipping_cost = 2.100 * 0.5 = 1.050
        self.assertEqual(self.shipment.shipping_cost, Decimal('1.050'))


class UpdateShipmentItemTest(TestCase):

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Update Item',
            customer_type='company',
            email='updateitem@test.com',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Update',
            address='Calle Update 20',
            city='Trujillo',
        )
        self.supplier = Supplier.objects.create(name='Proveedor Update')
        self.product = Product.objects.create(
            name='Monitor',
            sku='MON-001',
            unit_price=Decimal('400.00'),
            weight_kg=Decimal('3.000'),
            stock=30,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen Update',
            destination_address='Destino Update',
        )
        self.item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )

    def test_update_item_changes_quantity(self):
        updated = update_shipment_item(item=self.item, quantity=5)
        self.assertEqual(updated.quantity, 5)

    def test_update_item_recalculates_subtotal_using_frozen_price(self):
        # El precio congelado es 400.00
        updated = update_shipment_item(item=self.item, quantity=3)
        # subtotal = 3 * 400.00 = 1200.00
        self.assertEqual(updated.subtotal, Decimal('1200.00'))

    def test_update_item_recalculates_shipment_total_weight(self):
        update_shipment_item(item=self.item, quantity=4)
        self.shipment.refresh_from_db()
        # total_weight_kg = 4 * 3.000 = 12.000
        self.assertEqual(self.shipment.total_weight_kg, Decimal('12.000'))

    def test_update_item_recalculates_shipping_cost(self):
        update_shipment_item(item=self.item, quantity=4)
        self.shipment.refresh_from_db()
        # shipping_cost = 12.000 * 0.5 = 6.000
        self.assertEqual(self.shipment.shipping_cost, Decimal('6.000'))

    def test_update_item_does_not_change_unit_price(self):
        original_price = self.item.unit_price
        update_shipment_item(item=self.item, quantity=10)
        self.item.refresh_from_db()
        self.assertEqual(self.item.unit_price, original_price)


class DeleteShipmentItemTest(TestCase):

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Delete Item',
            customer_type='company',
            email='deleteitem@test.com',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Delete',
            address='Calle Delete 30',
            city='Piura',
        )
        self.supplier = Supplier.objects.create(name='Proveedor Delete')
        self.product = Product.objects.create(
            name='Impresora',
            sku='IMP-001',
            unit_price=Decimal('250.00'),
            weight_kg=Decimal('5.000'),
            stock=10,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen Delete',
            destination_address='Destino Delete',
        )
        self.item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )

    def test_delete_item_removes_from_db(self):
        item_id = self.item.id
        delete_shipment_item(self.item)
        self.assertFalse(ShipmentItem.objects.filter(pk=item_id).exists())

    def test_delete_item_recalculates_weight_to_zero(self):
        delete_shipment_item(self.item)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.total_weight_kg, Decimal('0'))

    def test_delete_item_recalculates_shipping_cost_to_zero(self):
        delete_shipment_item(self.item)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.shipping_cost, Decimal('0'))

    def test_delete_one_of_two_items_recalculates_remaining(self):
        product2 = Product.objects.create(
            name='Scanner',
            sku='SCAN-001',
            unit_price=Decimal('180.00'),
            weight_kg=Decimal('2.000'),
            stock=5,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        item2 = create_shipment_item(
            shipment=self.shipment,
            product=product2,
            quantity=1,
        )
        # Eliminar primer item (2 * 5.000 = 10 kg), queda item2 (1 * 2.000 = 2 kg)
        delete_shipment_item(self.item)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.total_weight_kg, Decimal('2.000'))
        self.assertEqual(self.shipment.shipping_cost, Decimal('1.000'))
