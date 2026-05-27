import datetime
from decimal import Decimal

from django.test import TestCase

from apps.customers.models import Customer
from apps.routes.models import Route
from apps.shipments.filters import ShipmentFilter
from apps.shipments.models import Shipment
from apps.transport.models import Transport
from apps.warehouses.models import Warehouse


class ShipmentFilterTest(TestCase):

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacen Filter Test',
            address='Calle Filter 1',
            city='Lima',
        )
        self.warehouse2 = Warehouse.objects.create(
            name='Almacen Filter Test 2',
            address='Calle Filter 2',
            city='Arequipa',
        )
        self.customer = Customer.objects.create(
            name='Cliente Filter',
            customer_type='company',
            email='filtertest@test.com',
        )
        self.customer2 = Customer.objects.create(
            name='Cliente Filter 2',
            customer_type='individual',
            email='filtertest2@test.com',
        )
        self.transport = Transport.objects.create(
            plate_number='FLT-001',
            vehicle_type='truck',
            max_capacity_kg=Decimal('2000.00'),
        )
        self.route = Route.objects.create(
            name='Ruta Filter Test',
            origin_warehouse=self.warehouse,
        )
        self.shipment_pending = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen 1',
            destination_address='Destino 1',
            status='pending',
            shipping_date=datetime.date(2025, 6, 1),
        )
        self.shipment_in_transit = Shipment.objects.create(
            customer=self.customer2,
            origin_warehouse=self.warehouse2,
            origin_address='Origen 2',
            destination_address='Destino 2',
            status='in_transit',
            transport=self.transport,
            route=self.route,
            shipping_date=datetime.date(2025, 7, 15),
        )
        self.shipment_delivered = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen 3',
            destination_address='Destino 3',
            status='delivered',
            shipping_date=datetime.date(2025, 8, 1),
        )

    def _apply_filter(self, params):
        qs = Shipment.objects.filter(is_active=True)
        return ShipmentFilter(params, queryset=qs).qs

    def test_filter_by_status_pending(self):
        result = self._apply_filter({'status': 'pending'})
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first(), self.shipment_pending)

    def test_filter_by_status_in_transit(self):
        result = self._apply_filter({'status': 'in_transit'})
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first(), self.shipment_in_transit)

    def test_filter_by_status_delivered(self):
        result = self._apply_filter({'status': 'delivered'})
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first(), self.shipment_delivered)

    def test_filter_by_customer(self):
        result = self._apply_filter({'customer': self.customer.id})
        self.assertEqual(result.count(), 2)
        for shipment in result:
            self.assertEqual(shipment.customer, self.customer)

    def test_filter_by_transport(self):
        result = self._apply_filter({'transport': self.transport.id})
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first(), self.shipment_in_transit)

    def test_filter_by_route(self):
        result = self._apply_filter({'route': self.route.id})
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first(), self.shipment_in_transit)

    def test_filter_by_origin_warehouse(self):
        result = self._apply_filter({'origin_warehouse': self.warehouse.id})
        self.assertEqual(result.count(), 2)

    def test_filter_by_shipping_date_exact(self):
        result = self._apply_filter({'shipping_date': '2025-06-01'})
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first(), self.shipment_pending)

    def test_filter_by_shipping_date_gte(self):
        result = self._apply_filter({'shipping_date__gte': '2025-07-01'})
        self.assertEqual(result.count(), 2)

    def test_filter_by_shipping_date_lte(self):
        result = self._apply_filter({'shipping_date__lte': '2025-07-01'})
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first(), self.shipment_pending)

    def test_no_filter_returns_all_active(self):
        result = self._apply_filter({})
        self.assertEqual(result.count(), 3)

    def test_filter_with_invalid_status_returns_all_results(self):
        # django-filter ignora valores que no matchean los choices exactos;
        # no filtra nada y devuelve el queryset completo.
        result = self._apply_filter({'status': 'inexistente'})
        self.assertEqual(result.count(), 3)
