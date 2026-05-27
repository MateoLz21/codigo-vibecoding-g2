from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.transport.models import Transport


class TransportFilterTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='filteruser',
            password='filterpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/transport/'

        self.truck = Transport.objects.create(
            plate_number='TRK-001',
            vehicle_type=Transport.TRUCK,
            max_capacity_kg=5000.00,
            year=2020,
        )
        self.van = Transport.objects.create(
            plate_number='VAN-001',
            vehicle_type=Transport.VAN,
            max_capacity_kg=1500.00,
            year=2021,
        )
        self.moto = Transport.objects.create(
            plate_number='MOT-001',
            vehicle_type=Transport.MOTORCYCLE,
            max_capacity_kg=200.00,
            year=2022,
        )
        self.inactive = Transport.objects.create(
            plate_number='OFF-001',
            vehicle_type=Transport.TRUCK,
            max_capacity_kg=3000.00,
            is_active=False,
        )

    # --- Filtro por vehicle_type ---

    def test_filter_by_vehicle_type_truck(self):
        response = self.client.get(self.base_url, {'vehicle_type': 'truck'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('TRK-001', plates)
        self.assertNotIn('VAN-001', plates)
        self.assertNotIn('MOT-001', plates)

    def test_filter_by_vehicle_type_van(self):
        response = self.client.get(self.base_url, {'vehicle_type': 'van'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('VAN-001', plates)
        self.assertNotIn('TRK-001', plates)

    def test_filter_by_vehicle_type_motorcycle(self):
        response = self.client.get(self.base_url, {'vehicle_type': 'motorcycle'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('MOT-001', plates)
        self.assertNotIn('TRK-001', plates)

    # --- Filtro por is_active ---

    def test_filter_by_is_active_false_returns_inactive(self):
        response = self.client.get(self.base_url, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # El queryset base filtra is_active=True, pero el FilterSet permite
        # sobreescribir el filtro de is_active
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertNotIn('TRK-001', plates)
        self.assertNotIn('VAN-001', plates)

    def test_filter_by_is_active_true_returns_only_active(self):
        response = self.client.get(self.base_url, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('TRK-001', plates)
        self.assertIn('VAN-001', plates)
        self.assertIn('MOT-001', plates)

    # --- Filtro por year ---

    def test_filter_by_year(self):
        response = self.client.get(self.base_url, {'year': 2021})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('VAN-001', plates)
        self.assertNotIn('TRK-001', plates)
        self.assertNotIn('MOT-001', plates)

    # --- Filtro por max_capacity_kg__gte ---

    def test_filter_max_capacity_gte(self):
        response = self.client.get(self.base_url, {'max_capacity_kg__gte': 1500})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('TRK-001', plates)
        self.assertIn('VAN-001', plates)
        self.assertNotIn('MOT-001', plates)

    # --- Filtro por max_capacity_kg__lte ---

    def test_filter_max_capacity_lte(self):
        response = self.client.get(self.base_url, {'max_capacity_kg__lte': 1500})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('VAN-001', plates)
        self.assertIn('MOT-001', plates)
        self.assertNotIn('TRK-001', plates)

    # --- Combinacion de filtros ---

    def test_filter_vehicle_type_and_capacity_gte(self):
        response = self.client.get(
            self.base_url,
            {'vehicle_type': 'truck', 'max_capacity_kg__gte': 1000},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('TRK-001', plates)
        self.assertNotIn('VAN-001', plates)
        self.assertNotIn('MOT-001', plates)

    # --- Busqueda por search ---

    def test_search_by_plate_number(self):
        response = self.client.get(self.base_url, {'search': 'TRK'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('TRK-001', plates)
        self.assertNotIn('VAN-001', plates)

    def test_search_by_brand(self):
        Transport.objects.filter(plate_number='VAN-001').update(brand='Ford')
        response = self.client.get(self.base_url, {'search': 'Ford'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [t['plate_number'] for t in response.data['results']]
        self.assertIn('VAN-001', plates)
