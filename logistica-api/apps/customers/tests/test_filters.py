from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer


class CustomerFilterTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='filteruser',
            password='filterpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/customers/'

        self.company_a = Customer.objects.create(
            name='Alpha Logistics',
            customer_type=Customer.COMPANY,
            email='alpha@example.com',
            tax_id='20100001111',
        )
        self.individual_a = Customer.objects.create(
            name='Juan Pérez',
            customer_type=Customer.INDIVIDUAL,
            email='juan.perez@example.com',
        )
        self.company_b = Customer.objects.create(
            name='Beta Tech S.A.',
            customer_type=Customer.COMPANY,
            email='beta@betamail.com',
        )
        self.inactive = Customer.objects.create(
            name='Inactivo Corp',
            customer_type=Customer.COMPANY,
            email='inactivo@example.com',
            is_active=False,
        )

    # --- Filtro por customer_type ---

    def test_filter_customer_type_company(self):
        response = self.client.get(self.base_url, {'customer_type': 'company'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        types = {c['customer_type'] for c in results}
        self.assertEqual(types, {'company'})

    def test_filter_customer_type_individual(self):
        response = self.client.get(self.base_url, {'customer_type': 'individual'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.individual_a.pk)

    # --- Filtro por is_active ---
    # El queryset base del ViewSet ya filtra is_active=True.
    # Al pasar is_active=false la intersección con el queryset base es vacía.
    # Al pasar is_active=true se obtienen los activos (mismo comportamiento que sin filtro).

    def test_filter_is_active_false_returns_empty_because_queryset_only_shows_active(self):
        # El queryset base ya excluye inactivos; is_active=false devuelve lista vacía.
        response = self.client.get(self.base_url, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_filter_is_active_true_returns_only_active(self):
        response = self.client.get(self.base_url, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [c['id'] for c in response.data['results']]
        self.assertNotIn(self.inactive.pk, ids)
        self.assertIn(self.company_a.pk, ids)

    # --- Filtro por email (icontains) ---

    def test_filter_email_icontains_partial_match(self):
        response = self.client.get(self.base_url, {'email': 'betamail'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [c['id'] for c in response.data['results']]
        self.assertIn(self.company_b.pk, ids)
        self.assertNotIn(self.company_a.pk, ids)

    def test_filter_email_icontains_case_insensitive(self):
        response = self.client.get(self.base_url, {'email': 'ALPHA'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [c['id'] for c in response.data['results']]
        self.assertIn(self.company_a.pk, ids)

    def test_filter_email_no_match_returns_empty(self):
        response = self.client.get(self.base_url, {'email': 'noexiste99999'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    # --- Filtro por name (icontains) ---

    def test_filter_name_icontains_partial_match(self):
        response = self.client.get(self.base_url, {'name': 'alpha'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [c['id'] for c in response.data['results']]
        self.assertIn(self.company_a.pk, ids)
        self.assertNotIn(self.individual_a.pk, ids)

    def test_filter_name_icontains_case_insensitive(self):
        response = self.client.get(self.base_url, {'name': 'JUAN'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [c['id'] for c in response.data['results']]
        self.assertIn(self.individual_a.pk, ids)

    def test_filter_name_no_match_returns_empty(self):
        response = self.client.get(self.base_url, {'name': 'XYZ_NO_EXISTE_123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    # --- Combinación de filtros ---

    def test_filter_customer_type_and_name_combined(self):
        response = self.client.get(self.base_url, {'customer_type': 'company', 'name': 'alpha'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.company_a.pk)
