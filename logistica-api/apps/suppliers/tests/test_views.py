from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.suppliers.models import Supplier


class SupplierViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/suppliers/'
        self.supplier = Supplier.objects.create(
            name='Proveedor Test',
            tax_id='20100000001',
            email='proveedor@test.com',
        )

    # ------------------------------------------------------------------ #
    # Happy path                                                           #
    # ------------------------------------------------------------------ #

    def test_list_suppliers_returns_200(self):
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_suppliers_returns_paginated_results(self):
        response = self.client.get(self.base_url)
        self.assertIn('results', response.data)

    def test_create_supplier_returns_201(self):
        data = {'name': 'Nuevo Proveedor', 'tax_id': '20200000002'}
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_retrieve_supplier_returns_200(self):
        url = f'{self.base_url}{self.supplier.pk}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.supplier.name)

    def test_update_supplier_returns_200(self):
        url = f'{self.base_url}{self.supplier.pk}/'
        data = {
            'name': 'Proveedor Actualizado',
            'tax_id': '20100000001',
            'email': 'nuevo@test.com',
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Proveedor Actualizado')

    def test_partial_update_supplier_returns_200(self):
        url = f'{self.base_url}{self.supplier.pk}/'
        data = {'name': 'Nombre Parcial'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Nombre Parcial')

    def test_soft_delete_returns_204(self):
        url = f'{self.base_url}{self.supplier.pk}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_retrieve_after_soft_delete_returns_404(self):
        url = f'{self.base_url}{self.supplier.pk}/'
        self.client.delete(url)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------ #
    # Unhappy path                                                         #
    # ------------------------------------------------------------------ #

    def test_list_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.invalido.aqui')
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_nonexistent_supplier_returns_404(self):
        response = self.client.get(f'{self.base_url}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_without_required_name_returns_400(self):
        data = {'tax_id': '20300000003', 'email': 'sin_nombre@test.com'}
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_duplicate_tax_id_returns_400(self):
        data = {'name': 'Proveedor Duplicado', 'tax_id': '20100000001'}
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # Edge cases                                                           #
    # ------------------------------------------------------------------ #

    def test_list_empty_when_no_active_suppliers(self):
        Supplier.objects.all().update(is_active=False)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_inactive_supplier_not_in_list(self):
        inactive = Supplier.objects.create(
            name='Proveedor Inactivo',
            tax_id='20100000099',
            is_active=False,
        )
        response = self.client.get(self.base_url)
        ids_in_response = [item['id'] for item in response.data['results']]
        self.assertNotIn(inactive.pk, ids_in_response)

    def test_soft_delete_does_not_remove_from_db(self):
        url = f'{self.base_url}{self.supplier.pk}/'
        self.client.delete(url)
        self.supplier.refresh_from_db()
        self.assertFalse(self.supplier.is_active)
        self.assertTrue(Supplier.objects.filter(pk=self.supplier.pk).exists())

    def test_pagination_with_more_than_20_suppliers(self):
        # El supplier creado en setUp ya existe; crear 20 más = 21 total
        for i in range(2, 22):
            Supplier.objects.create(name=f'Proveedor Paginacion {i:02d}')
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('next', response.data)
        self.assertIsNotNone(response.data['next'])

    def test_create_supplier_without_optional_fields(self):
        data = {'name': 'Solo Nombre'}
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['tax_id'])
        self.assertIsNone(response.data['email'])

    def test_response_contains_expected_fields(self):
        url = f'{self.base_url}{self.supplier.pk}/'
        response = self.client.get(url)
        expected_fields = {
            'id', 'name', 'tax_id', 'email', 'phone',
            'address', 'contact_name', 'is_active',
            'created_at', 'updated_at',
        }
        self.assertTrue(expected_fields.issubset(set(response.data.keys())))
