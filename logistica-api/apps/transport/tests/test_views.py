from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.transport.models import Transport


class TransportViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/transport/'
        self.transport = Transport.objects.create(
            plate_number='TST-001',
            vehicle_type=Transport.TRUCK,
            max_capacity_kg=1000.00,
        )

    def _detail_url(self, pk):
        return f'{self.base_url}{pk}/'

    # ===== HAPPY PATH =====

    def test_list_returns_200(self):
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_paginated_results(self):
        response = self.client.get(self.base_url)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_list_contains_created_transport(self):
        response = self.client.get(self.base_url)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('TST-001', plates)

    def test_create_valid_transport_returns_201(self):
        data = {
            'plate_number': 'NEW-001',
            'vehicle_type': 'van',
            'max_capacity_kg': '500.00',
        }
        response = self.client.post(self.base_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['plate_number'], 'NEW-001')

    def test_create_sets_is_active_true(self):
        data = {
            'plate_number': 'NEW-002',
            'vehicle_type': 'motorcycle',
            'max_capacity_kg': '150.00',
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_active'])

    def test_retrieve_returns_200(self):
        response = self.client.get(self._detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['plate_number'], 'TST-001')

    def test_put_update_returns_200(self):
        data = {
            'plate_number': 'TST-001',
            'vehicle_type': 'van',
            'max_capacity_kg': '800.00',
        }
        response = self.client.put(self._detail_url(self.transport.pk), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['vehicle_type'], 'van')

    def test_patch_update_returns_200(self):
        response = self.client.patch(
            self._detail_url(self.transport.pk),
            {'brand': 'Toyota'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['brand'], 'Toyota')

    def test_delete_returns_204(self):
        response = self.client.delete(self._detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_deleted_transport_returns_404_on_retrieve(self):
        self.client.delete(self._detail_url(self.transport.pk))
        response = self.client.get(self._detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ===== UNHAPPY PATH =====

    def test_list_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid.token.here')
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(self._detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_without_plate_number_returns_400(self):
        data = {
            'vehicle_type': 'truck',
            'max_capacity_kg': '1000.00',
        }
        response = self.client.post(self.base_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_max_capacity_returns_400(self):
        data = {
            'plate_number': 'NOCA-001',
            'vehicle_type': 'truck',
        }
        response = self.client.post(self.base_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_duplicate_plate_number_returns_400(self):
        data = {
            'plate_number': 'TST-001',
            'vehicle_type': 'van',
            'max_capacity_kg': '500.00',
        }
        response = self.client.post(self.base_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_invalid_vehicle_type_returns_400(self):
        data = {
            'plate_number': 'INVT-001',
            'vehicle_type': 'bicycle',
            'max_capacity_kg': '100.00',
        }
        response = self.client.post(self.base_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_vehicle_type_returns_400(self):
        data = {
            'plate_number': 'NOVT-001',
            'max_capacity_kg': '500.00',
        }
        response = self.client.post(self.base_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ===== EDGE CASES =====

    def test_list_empty_when_no_active_transports(self):
        Transport.objects.all().update(is_active=False)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_inactive_transport_not_in_list(self):
        Transport.objects.create(
            plate_number='INACTIVE-001',
            vehicle_type=Transport.VAN,
            max_capacity_kg=400.00,
            is_active=False,
        )
        response = self.client.get(self.base_url)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertNotIn('INACTIVE-001', plates)

    def test_soft_delete_does_not_physically_remove_record(self):
        pk = self.transport.pk
        self.client.delete(self._detail_url(pk))
        self.transport.refresh_from_db()
        self.assertFalse(self.transport.is_active)
        self.assertTrue(Transport.objects.filter(pk=pk).exists())

    def test_list_with_21_transports_returns_pagination(self):
        # El setUp ya crea 1, creamos 20 más para llegar a 21 activos
        for i in range(2, 22):
            Transport.objects.create(
                plate_number=f'PAG-{i:03d}',
                vehicle_type=Transport.TRUCK,
                max_capacity_kg=1000.00,
            )
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data.get('next'))
        self.assertEqual(len(response.data['results']), 20)

    def test_read_only_fields_id_created_at_updated_at(self):
        data = {
            'plate_number': 'RO-001',
            'vehicle_type': 'truck',
            'max_capacity_kg': '1200.00',
            'id': 9999,
        }
        response = self.client.post(self.base_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)

    def test_create_with_optional_fields(self):
        data = {
            'plate_number': 'OPT-001',
            'vehicle_type': 'van',
            'max_capacity_kg': '600.00',
            'brand': 'Ford',
            'model': 'Transit',
            'year': 2022,
        }
        response = self.client.post(self.base_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['brand'], 'Ford')
        self.assertEqual(response.data['model'], 'Transit')
        self.assertEqual(response.data['year'], 2022)
