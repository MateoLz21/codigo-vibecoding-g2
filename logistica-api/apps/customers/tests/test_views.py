from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer


class CustomerViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/customers/'
        self.customer = Customer.objects.create(
            name='Acme Corp',
            customer_type=Customer.COMPANY,
            email='acme@example.com',
        )

    def _detail_url(self, pk):
        return f'{self.base_url}{pk}/'

    # -------------------------------------------------------
    # Happy path
    # -------------------------------------------------------

    def test_list_returns_200(self):
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_is_paginated(self):
        response = self.client.get(self.base_url)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_create_valid_customer_returns_201(self):
        payload = {
            'name': 'TechPerú',
            'customer_type': 'company',
            'email': 'techperu@example.com',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'TechPerú')

    def test_retrieve_customer_returns_200(self):
        response = self.client.get(self._detail_url(self.customer.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.customer.pk)

    def test_full_update_customer_returns_200(self):
        payload = {
            'name': 'Acme Corp Actualizado',
            'customer_type': 'company',
            'email': 'acme@example.com',
        }
        response = self.client.put(self._detail_url(self.customer.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Acme Corp Actualizado')

    def test_partial_update_customer_returns_200(self):
        payload = {'phone': '+51999888777'}
        response = self.client.patch(self._detail_url(self.customer.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '+51999888777')

    def test_soft_delete_returns_204(self):
        response = self.client.delete(self._detail_url(self.customer.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_deleted_customer_not_found_on_retrieve(self):
        self.client.delete(self._detail_url(self.customer.pk))
        response = self.client.get(self._detail_url(self.customer.pk))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------------------------------------
    # Unhappy path
    # -------------------------------------------------------

    def test_list_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer tokeninvalido.abc.xyz')
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_nonexistent_customer_returns_404(self):
        response = self.client.get(self._detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_without_required_fields_returns_400(self):
        payload = {'customer_type': 'company'}
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_duplicate_email_returns_400(self):
        payload = {
            'name': 'Otro Cliente',
            'customer_type': 'individual',
            'email': 'acme@example.com',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_invalid_customer_type_returns_400(self):
        payload = {
            'name': 'Tipo Raro',
            'customer_type': 'invalid_type',
            'email': 'raro@example.com',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_email_returns_400(self):
        payload = {
            'name': 'Sin Email',
            'customer_type': 'company',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------
    # Edge cases
    # -------------------------------------------------------

    def test_list_empty_when_no_active_customers(self):
        Customer.objects.all().update(is_active=False)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_inactive_customer_not_in_list(self):
        inactive = Customer.objects.create(
            name='Inactivo SA',
            customer_type=Customer.COMPANY,
            email='inactive@example.com',
            is_active=False,
        )
        response = self.client.get(self.base_url)
        ids = [c['id'] for c in response.data['results']]
        self.assertNotIn(inactive.pk, ids)

    def test_soft_delete_keeps_object_in_database(self):
        pk = self.customer.pk
        self.client.delete(self._detail_url(pk))
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)
        self.assertTrue(Customer.objects.filter(pk=pk).exists())

    def test_list_with_21_customers_returns_paginated_response(self):
        for i in range(21):
            Customer.objects.create(
                name=f'Customer {i:03d}',
                customer_type=Customer.INDIVIDUAL,
                email=f'customer{i:03d}@example.com',
            )
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('next', response.data)
        self.assertIsNotNone(response.data.get('next'))

    def test_filter_by_customer_type_company_returns_only_companies(self):
        Customer.objects.create(
            name='Individual Persona',
            customer_type=Customer.INDIVIDUAL,
            email='individual@example.com',
        )
        response = self.client.get(self.base_url, {'customer_type': 'company'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        types = [c['customer_type'] for c in response.data['results']]
        self.assertTrue(all(t == 'company' for t in types))

    def test_filter_by_customer_type_individual_returns_only_individuals(self):
        Customer.objects.create(
            name='Solo Persona',
            customer_type=Customer.INDIVIDUAL,
            email='persona@example.com',
        )
        response = self.client.get(self.base_url, {'customer_type': 'individual'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        types = [c['customer_type'] for c in response.data['results']]
        self.assertTrue(all(t == 'individual' for t in types))

    def test_active_customer_appears_in_list(self):
        response = self.client.get(self.base_url)
        ids = [c['id'] for c in response.data['results']]
        self.assertIn(self.customer.pk, ids)
