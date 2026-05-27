from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.routes.models import Route, RouteStop
from apps.warehouses.models import Warehouse


class RouteViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/routes/'

        self.warehouse = Warehouse.objects.create(
            name='Almacén Test',
            address='Calle 1',
            city='Lima',
            capacity_m3=100.00,
        )
        self.route = Route.objects.create(
            name='Ruta Test Principal',
            origin_warehouse=self.warehouse,
            estimated_duration_hours=2.50,
        )

    # ------------------------------------------------------------------
    # Happy path — CRUD routes
    # ------------------------------------------------------------------

    def test_list_routes_returns_200(self):
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_routes_includes_created_route(self):
        response = self.client.get(self.base_url)
        ids = [r['id'] for r in response.data['results']]
        self.assertIn(self.route.id, ids)

    def test_create_route_returns_201(self):
        payload = {
            'name': 'Ruta Nueva',
            'origin_warehouse': self.warehouse.id,
            'estimated_duration_hours': '1.50',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Ruta Nueva')

    def test_retrieve_route_returns_200(self):
        url = f'{self.base_url}{self.route.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.route.id)

    def test_retrieve_route_includes_stops_field(self):
        url = f'{self.base_url}{self.route.id}/'
        response = self.client.get(url)
        self.assertIn('stops', response.data)

    def test_update_route_returns_200(self):
        url = f'{self.base_url}{self.route.id}/'
        payload = {
            'name': 'Ruta Actualizada',
            'origin_warehouse': self.warehouse.id,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Ruta Actualizada')

    def test_partial_update_route_returns_200(self):
        url = f'{self.base_url}{self.route.id}/'
        response = self.client.patch(url, {'name': 'Ruta Parcial'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Ruta Parcial')

    def test_delete_route_returns_204(self):
        url = f'{self.base_url}{self.route.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_deleted_route_returns_404_on_retrieve(self):
        url = f'{self.base_url}{self.route.id}/'
        self.client.delete(url)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------
    # Unhappy path — routes
    # ------------------------------------------------------------------

    def test_list_routes_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_route_without_token_returns_401(self):
        self.client.credentials()
        payload = {'name': 'Ruta Sin Auth', 'origin_warehouse': self.warehouse.id}
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_nonexistent_route_returns_404(self):
        response = self.client.get(f'{self.base_url}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_route_without_name_returns_400(self):
        payload = {'origin_warehouse': self.warehouse.id}
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_without_origin_warehouse_returns_400(self):
        payload = {'name': 'Ruta Sin Almacén'}
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_with_invalid_warehouse_id_returns_400(self):
        payload = {'name': 'Ruta Inválida', 'origin_warehouse': 99999}
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------
    # Edge cases — routes
    # ------------------------------------------------------------------

    def test_list_routes_empty_returns_empty_results(self):
        Route.objects.all().update(is_active=False)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_inactive_route_not_in_list(self):
        self.route.is_active = False
        self.route.save()
        response = self.client.get(self.base_url)
        ids = [r['id'] for r in response.data['results']]
        self.assertNotIn(self.route.id, ids)

    def test_soft_delete_does_not_remove_from_db(self):
        url = f'{self.base_url}{self.route.id}/'
        self.client.delete(url)
        self.route.refresh_from_db()
        self.assertFalse(self.route.is_active)

    def test_pagination_with_21_routes(self):
        for i in range(21):
            Route.objects.create(
                name=f'Ruta Paginación {i:02d}',
                origin_warehouse=self.warehouse,
            )
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('next', response.data)
        self.assertIsNotNone(response.data['next'])

    def test_filter_by_origin_warehouse(self):
        warehouse2 = Warehouse.objects.create(
            name='Almacén Secundario',
            address='Calle 2',
            city='Arequipa',
            capacity_m3=200.00,
        )
        Route.objects.create(
            name='Ruta Arequipa',
            origin_warehouse=warehouse2,
        )
        response = self.client.get(
            self.base_url, {'origin_warehouse': self.warehouse.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for route in response.data['results']:
            self.assertEqual(route['origin_warehouse'], self.warehouse.id)

    def test_search_by_name(self):
        Route.objects.create(
            name='Ruta Especial Única',
            origin_warehouse=self.warehouse,
        )
        response = self.client.get(self.base_url, {'search': 'Especial Única'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertIn('Ruta Especial Única', names)


class RouteStopViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.warehouse = Warehouse.objects.create(
            name='Almacén Test',
            address='Calle 1',
            city='Lima',
            capacity_m3=100.00,
        )
        self.route = Route.objects.create(
            name='Ruta Con Paradas',
            origin_warehouse=self.warehouse,
        )
        self.stops_url = f'/api/v1/routes/{self.route.id}/stops/'
        self.stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Av. Javier Prado 1000',
            city='San Isidro',
        )

    # ------------------------------------------------------------------
    # Happy path — stops anidados
    # ------------------------------------------------------------------

    def test_list_stops_returns_200(self):
        response = self.client.get(self.stops_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_stops_includes_created_stop(self):
        response = self.client.get(self.stops_url)
        results = response.data.get('results', response.data)
        ids = [s['id'] for s in results]
        self.assertIn(self.stop.id, ids)

    def test_create_stop_returns_201(self):
        payload = {
            'stop_order': 2,
            'address': 'Av. La Marina 2000',
            'city': 'San Miguel',
        }
        response = self.client.post(self.stops_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['city'], 'San Miguel')

    def test_create_stop_assigns_correct_route(self):
        payload = {
            'stop_order': 2,
            'address': 'Calle Los Pinos 50',
            'city': 'Miraflores',
        }
        response = self.client.post(self.stops_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_stop = RouteStop.objects.get(id=response.data['id'])
        self.assertEqual(created_stop.route_id, self.route.id)

    def test_retrieve_stop_returns_200(self):
        url = f'{self.stops_url}{self.stop.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.stop.id)

    def test_update_stop_returns_200(self):
        url = f'{self.stops_url}{self.stop.id}/'
        payload = {
            'stop_order': 1,
            'address': 'Nueva Dirección 999',
            'city': 'Barranco',
            'route': self.route.id,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Barranco')

    def test_partial_update_stop_returns_200(self):
        url = f'{self.stops_url}{self.stop.id}/'
        response = self.client.patch(url, {'city': 'Surco'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Surco')

    def test_delete_stop_returns_204(self):
        url = f'{self.stops_url}{self.stop.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_stop_removes_from_db(self):
        stop_id = self.stop.id
        url = f'{self.stops_url}{self.stop.id}/'
        self.client.delete(url)
        self.assertFalse(RouteStop.objects.filter(id=stop_id).exists())

    # ------------------------------------------------------------------
    # Unhappy path — stops
    # ------------------------------------------------------------------

    def test_list_stops_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.stops_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_stops_for_nonexistent_route_returns_empty(self):
        url = '/api/v1/routes/99999/stops/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_create_stop_without_address_returns_400(self):
        payload = {'stop_order': 3, 'city': 'Lima'}
        response = self.client.post(self.stops_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_without_city_returns_400(self):
        payload = {'stop_order': 3, 'address': 'Alguna Dirección'}
        response = self.client.post(self.stops_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_without_stop_order_returns_400(self):
        payload = {'address': 'Alguna Dirección', 'city': 'Lima'}
        response = self.client.post(self.stops_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------
    # Edge cases — stops
    # ------------------------------------------------------------------

    def test_list_stops_empty_when_route_has_no_stops(self):
        route2 = Route.objects.create(
            name='Ruta Sin Paradas',
            origin_warehouse=self.warehouse,
        )
        url = f'/api/v1/routes/{route2.id}/stops/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_stop_of_route_a_not_in_route_b_stops(self):
        route2 = Route.objects.create(
            name='Ruta B',
            origin_warehouse=self.warehouse,
        )
        RouteStop.objects.create(
            route=route2,
            stop_order=1,
            address='Otra Calle 100',
            city='Callao',
        )
        url_b = f'/api/v1/routes/{route2.id}/stops/'
        response = self.client.get(url_b)
        results = response.data.get('results', response.data)
        ids = [s['id'] for s in results]
        self.assertNotIn(self.stop.id, ids)

    def test_stops_deleted_when_route_is_hard_deleted(self):
        route_to_delete = Route.objects.create(
            name='Ruta a Borrar',
            origin_warehouse=self.warehouse,
        )
        stop = RouteStop.objects.create(
            route=route_to_delete,
            stop_order=1,
            address='Dirección Borrada',
            city='Lima',
        )
        stop_id = stop.id
        route_to_delete.delete()
        self.assertFalse(RouteStop.objects.filter(id=stop_id).exists())
