from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.suppliers.models import Supplier


class SupplierFilterTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='filteruser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/suppliers/'

        self.supplier_alpha = Supplier.objects.create(
            name='Alpha Tecnologia',
            contact_name='Carlos Ramirez',
            is_active=True,
        )
        self.supplier_beta = Supplier.objects.create(
            name='Beta Soluciones',
            contact_name='Maria Lopez',
            is_active=True,
        )
        self.supplier_inactive = Supplier.objects.create(
            name='Gamma Inactivo',
            contact_name='Pedro Gomez',
            is_active=False,
        )

    def test_filter_by_name_icontains(self):
        response = self.client.get(self.base_url, {'name': 'alpha'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Alpha Tecnologia', names)
        self.assertNotIn('Beta Soluciones', names)

    def test_filter_by_name_case_insensitive(self):
        response = self.client.get(self.base_url, {'name': 'BETA'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Beta Soluciones', names)

    def test_filter_by_name_partial_match(self):
        response = self.client.get(self.base_url, {'name': 'Tecnolog'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Alpha Tecnologia', names)
        self.assertNotIn('Beta Soluciones', names)

    def test_filter_by_contact_name_icontains(self):
        response = self.client.get(self.base_url, {'contact_name': 'carlos'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Alpha Tecnologia', names)
        self.assertNotIn('Beta Soluciones', names)

    def test_filter_by_contact_name_case_insensitive(self):
        response = self.client.get(self.base_url, {'contact_name': 'LOPEZ'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Beta Soluciones', names)
        self.assertNotIn('Alpha Tecnologia', names)

    def test_filter_active_suppliers_only(self):
        response = self.client.get(self.base_url, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertNotIn('Gamma Inactivo', names)

    def test_filter_no_match_returns_empty_results(self):
        response = self.client.get(self.base_url, {'name': 'XYZ_NO_EXISTE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_combined_name_and_contact_name_filter(self):
        response = self.client.get(self.base_url, {
            'name': 'alpha',
            'contact_name': 'carlos',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Alpha Tecnologia', names)
        self.assertNotIn('Beta Soluciones', names)
