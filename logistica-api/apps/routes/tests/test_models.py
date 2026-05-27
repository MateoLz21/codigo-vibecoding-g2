from django.db import IntegrityError
from django.test import TestCase

from apps.routes.models import Route, RouteStop
from apps.warehouses.models import Warehouse


class RouteModelTest(TestCase):

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacén Central',
            address='Av. Industrial 100',
            city='Lima',
            capacity_m3=500.00,
        )

    def test_str_returns_name(self):
        route = Route.objects.create(
            name='Ruta Lima Norte',
            origin_warehouse=self.warehouse,
        )
        self.assertEqual(str(route), 'Ruta Lima Norte')

    def test_is_active_default_true(self):
        route = Route.objects.create(
            name='Ruta Test',
            origin_warehouse=self.warehouse,
        )
        self.assertTrue(route.is_active)

    def test_estimated_duration_hours_nullable(self):
        route = Route.objects.create(
            name='Ruta Sin Duración',
            origin_warehouse=self.warehouse,
        )
        self.assertIsNone(route.estimated_duration_hours)

    def test_estimated_duration_hours_stored(self):
        route = Route.objects.create(
            name='Ruta Con Duración',
            origin_warehouse=self.warehouse,
            estimated_duration_hours=3.50,
        )
        self.assertEqual(float(route.estimated_duration_hours), 3.50)

    def test_created_at_set_automatically(self):
        route = Route.objects.create(
            name='Ruta Timestamps',
            origin_warehouse=self.warehouse,
        )
        self.assertIsNotNone(route.created_at)

    def test_updated_at_set_automatically(self):
        route = Route.objects.create(
            name='Ruta Timestamps 2',
            origin_warehouse=self.warehouse,
        )
        self.assertIsNotNone(route.updated_at)

    def test_create_without_name_raises_error(self):
        with self.assertRaises(IntegrityError):
            Route.objects.create(
                name=None,
                origin_warehouse=self.warehouse,
            )

    def test_create_without_origin_warehouse_raises_error(self):
        with self.assertRaises(IntegrityError):
            Route.objects.create(
                name='Ruta Sin Almacén',
                origin_warehouse_id=None,
            )

    def test_default_ordering_by_name(self):
        Route.objects.create(name='Zeta', origin_warehouse=self.warehouse)
        Route.objects.create(name='Alpha', origin_warehouse=self.warehouse)
        Route.objects.create(name='Medio', origin_warehouse=self.warehouse)
        routes = list(Route.objects.values_list('name', flat=True))
        self.assertEqual(routes, sorted(routes))

    def test_db_table_name(self):
        self.assertEqual(Route._meta.db_table, 'routes')


class RouteStopModelTest(TestCase):

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacén Central',
            address='Av. Industrial 100',
            city='Lima',
            capacity_m3=500.00,
        )
        self.route = Route.objects.create(
            name='Ruta Lima Sur',
            origin_warehouse=self.warehouse,
        )

    def test_str_returns_stop_order_and_city(self):
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Calle Principal 200',
            city='Miraflores',
        )
        self.assertEqual(str(stop), 'Stop 1 — Miraflores')

    def test_stop_order_stored_correctly(self):
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=3,
            address='Calle Secundaria 300',
            city='San Isidro',
        )
        self.assertEqual(stop.stop_order, 3)

    def test_latitude_longitude_nullable(self):
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Calle Sin Coords',
            city='Barranco',
        )
        self.assertIsNone(stop.latitude)
        self.assertIsNone(stop.longitude)

    def test_estimated_arrival_nullable(self):
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Calle Sin Hora',
            city='Surco',
        )
        self.assertIsNone(stop.estimated_arrival)

    def test_cascade_delete_when_route_deleted(self):
        RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Av. Arequipa 500',
            city='Lima',
        )
        route_id = self.route.id
        self.route.delete()
        self.assertEqual(RouteStop.objects.filter(route_id=route_id).count(), 0)

    def test_create_without_address_raises_error(self):
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(
                route=self.route,
                stop_order=1,
                address=None,
                city='Lima',
            )

    def test_create_without_city_raises_error(self):
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(
                route=self.route,
                stop_order=1,
                address='Alguna Dirección',
                city=None,
            )

    def test_create_without_route_raises_error(self):
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(
                route_id=None,
                stop_order=1,
                address='Alguna Dirección',
                city='Lima',
            )

    def test_multiple_stops_ordered_by_stop_order(self):
        RouteStop.objects.create(
            route=self.route, stop_order=3, address='Parada C', city='Surco'
        )
        RouteStop.objects.create(
            route=self.route, stop_order=1, address='Parada A', city='Lima'
        )
        RouteStop.objects.create(
            route=self.route, stop_order=2, address='Parada B', city='Miraflores'
        )
        stops = list(self.route.stops.values_list('stop_order', flat=True))
        self.assertEqual(stops, [1, 2, 3])

    def test_db_table_name(self):
        self.assertEqual(RouteStop._meta.db_table, 'route_stops')
