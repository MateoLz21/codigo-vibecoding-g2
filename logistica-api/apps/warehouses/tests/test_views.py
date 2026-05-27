from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.warehouses.models import Warehouse


class WarehouseViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/warehouses/'
        self.warehouse = Warehouse.objects.create(
            name='Almacen Principal',
            address='Av. Central 100',
            city='Lima',
            country='Peru',
        )

    # -------------------------------------------------------------------------
    # Happy path
    # -------------------------------------------------------------------------

    def test_list_warehouses_returns_200(self):
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_warehouses_response_is_paginated(self):
        response = self.client.get(self.base_url)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_list_warehouses_contains_created_warehouse(self):
        response = self.client.get(self.base_url)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Almacen Principal', names)

    def test_create_warehouse_returns_201(self):
        data = {
            'name': 'Almacen Nuevo',
            'address': 'Jr. Los Cedros 200',
            'city': 'Arequipa',
            'country': 'Peru',
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_warehouse_stores_data_correctly(self):
        data = {
            'name': 'Almacen Norte',
            'address': 'Calle Real 300',
            'city': 'Trujillo',
            'country': 'Peru',
            'capacity_m3': '250.50',
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Almacen Norte')
        self.assertEqual(response.data['city'], 'Trujillo')

    def test_retrieve_warehouse_returns_200(self):
        url = f'{self.base_url}{self.warehouse.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Almacen Principal')

    def test_retrieve_warehouse_has_expected_fields(self):
        url = f'{self.base_url}{self.warehouse.id}/'
        response = self.client.get(url)
        expected_fields = {'id', 'name', 'address', 'city', 'country',
                           'latitude', 'longitude', 'capacity_m3',
                           'is_active', 'created_at', 'updated_at'}
        self.assertEqual(set(response.data.keys()), expected_fields)

    def test_put_warehouse_returns_200(self):
        url = f'{self.base_url}{self.warehouse.id}/'
        data = {
            'name': 'Almacen Actualizado',
            'address': 'Av. Nueva 999',
            'city': 'Lima',
            'country': 'Peru',
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Almacen Actualizado')

    def test_patch_warehouse_returns_200(self):
        url = f'{self.base_url}{self.warehouse.id}/'
        data = {'city': 'Cusco'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Cusco')

    def test_delete_warehouse_returns_204(self):
        url = f'{self.base_url}{self.warehouse.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_deleted_warehouse_returns_404_on_retrieve(self):
        url = f'{self.base_url}{self.warehouse.id}/'
        self.client.delete(url)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------------------------------------------------------
    # Unhappy path
    # -------------------------------------------------------------------------

    def test_list_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer tokeninvalido123')
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_nonexistent_warehouse_returns_404(self):
        url = f'{self.base_url}99999/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_missing_required_name_returns_400(self):
        data = {
            'address': 'Av. Test 1',
            'city': 'Lima',
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_missing_required_address_returns_400(self):
        data = {
            'name': 'Sin Direccion',
            'city': 'Lima',
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_missing_required_city_returns_400(self):
        data = {
            'name': 'Sin Ciudad',
            'address': 'Av. Test 1',
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_without_token_returns_401(self):
        self.client.credentials()
        url = f'{self.base_url}{self.warehouse.id}/'
        data = {'name': 'X', 'address': 'X', 'city': 'X', 'country': 'X'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_without_token_returns_401(self):
        self.client.credentials()
        url = f'{self.base_url}{self.warehouse.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------------------
    # Edge cases
    # -------------------------------------------------------------------------

    def test_list_empty_when_no_active_warehouses(self):
        Warehouse.objects.all().update(is_active=False)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_inactive_warehouse_not_in_list(self):
        inactive_wh = Warehouse.objects.create(
            name='Almacen Inactivo',
            address='Calle Vieja 1',
            city='Lima',
            is_active=False,
        )
        response = self.client.get(self.base_url)
        ids_in_response = [item['id'] for item in response.data['results']]
        self.assertNotIn(inactive_wh.id, ids_in_response)

    def test_soft_delete_does_not_remove_from_db(self):
        warehouse_id = self.warehouse.id
        url = f'{self.base_url}{warehouse_id}/'
        self.client.delete(url)
        # El objeto sigue existiendo en la base de datos
        self.assertTrue(Warehouse.objects.filter(id=warehouse_id).exists())

    def test_soft_delete_sets_is_active_false(self):
        warehouse_id = self.warehouse.id
        url = f'{self.base_url}{warehouse_id}/'
        self.client.delete(url)
        self.warehouse.refresh_from_db()
        self.assertFalse(self.warehouse.is_active)

    def test_pagination_with_more_than_20_warehouses(self):
        # Crear 21 warehouses activos (ya existe 1 del setUp)
        for i in range(20):
            Warehouse.objects.create(
                name=f'Almacen Extra {i:02d}',
                address=f'Calle {i}',
                city='Lima',
            )
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIsNotNone(response.data['next'])
        self.assertEqual(len(response.data['results']), 20)

    def test_read_only_fields_not_settable_on_create(self):
        data = {
            'name': 'Almacen Con ID Forzado',
            'address': 'Av. X 1',
            'city': 'Lima',
            'id': 9999,
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # El id asignado debe ser el generado por la BD, no el enviado
        self.assertNotEqual(response.data['id'], 9999)

    def test_create_warehouse_with_optional_fields(self):
        data = {
            'name': 'Almacen Con Coords',
            'address': 'Av. GPS 500',
            'city': 'Lima',
            'country': 'Peru',
            'latitude': '-12.046374',
            'longitude': '-77.042793',
            'capacity_m3': '1000.00',
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['latitude'], '-12.046374')
        self.assertEqual(response.data['capacity_m3'], '1000.00')
