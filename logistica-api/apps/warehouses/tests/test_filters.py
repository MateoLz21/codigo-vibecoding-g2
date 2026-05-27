from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.warehouses.models import Warehouse


class WarehouseFilterTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='filteruser',
            password='filterpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/warehouses/'

        self.wh_lima_small = Warehouse.objects.create(
            name='Lima Pequeno',
            address='Av. Lima 1',
            city='Lima',
            country='Peru',
            capacity_m3=100.00,
        )
        self.wh_lima_large = Warehouse.objects.create(
            name='Lima Grande',
            address='Av. Lima 2',
            city='Lima',
            country='Peru',
            capacity_m3=500.00,
        )
        self.wh_trujillo = Warehouse.objects.create(
            name='Trujillo Central',
            address='Av. Trujillo 1',
            city='Trujillo',
            country='Peru',
            capacity_m3=300.00,
        )
        self.wh_chile = Warehouse.objects.create(
            name='Santiago Bodega',
            address='Calle Santiago 10',
            city='Santiago',
            country='Chile',
            capacity_m3=200.00,
        )

    # -------------------------------------------------------------------------
    # Filtro por city
    # -------------------------------------------------------------------------

    def test_filter_by_city_returns_only_matching(self):
        response = self.client.get(self.base_url, {'city': 'Lima'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cities = [item['city'] for item in response.data['results']]
        self.assertTrue(all(c == 'Lima' for c in cities))
        self.assertEqual(len(cities), 2)

    def test_filter_by_city_nonexistent_returns_empty(self):
        response = self.client.get(self.base_url, {'city': 'Bogota'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    # -------------------------------------------------------------------------
    # Filtro por country
    # -------------------------------------------------------------------------

    def test_filter_by_country_returns_only_matching(self):
        response = self.client.get(self.base_url, {'country': 'Chile'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        countries = [item['country'] for item in response.data['results']]
        self.assertTrue(all(c == 'Chile' for c in countries))
        self.assertEqual(len(countries), 1)

    def test_filter_by_country_peru_returns_all_peru(self):
        response = self.client.get(self.base_url, {'country': 'Peru'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        countries = [item['country'] for item in response.data['results']]
        self.assertTrue(all(c == 'Peru' for c in countries))
        self.assertEqual(len(countries), 3)

    # -------------------------------------------------------------------------
    # Filtro por capacity_m3__gte
    # -------------------------------------------------------------------------

    def test_filter_capacity_gte_returns_warehouses_above_threshold(self):
        response = self.client.get(self.base_url, {'capacity_m3__gte': 300})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [float(item['capacity_m3']) for item in response.data['results']]
        self.assertTrue(all(c >= 300 for c in capacities))
        # Lima Grande (500) y Trujillo (300)
        self.assertEqual(len(capacities), 2)

    def test_filter_capacity_gte_exact_boundary(self):
        response = self.client.get(self.base_url, {'capacity_m3__gte': 500})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [float(item['capacity_m3']) for item in response.data['results']]
        self.assertEqual(len(capacities), 1)
        self.assertEqual(capacities[0], 500.0)

    # -------------------------------------------------------------------------
    # Filtro por capacity_m3__lte
    # -------------------------------------------------------------------------

    def test_filter_capacity_lte_returns_warehouses_below_threshold(self):
        response = self.client.get(self.base_url, {'capacity_m3__lte': 200})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [float(item['capacity_m3']) for item in response.data['results']]
        self.assertTrue(all(c <= 200 for c in capacities))
        # Lima Pequeno (100) y Santiago (200)
        self.assertEqual(len(capacities), 2)

    def test_filter_capacity_lte_exact_boundary(self):
        response = self.client.get(self.base_url, {'capacity_m3__lte': 100})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [float(item['capacity_m3']) for item in response.data['results']]
        self.assertEqual(len(capacities), 1)
        self.assertEqual(capacities[0], 100.0)

    # -------------------------------------------------------------------------
    # Filtros combinados
    # -------------------------------------------------------------------------

    def test_filter_combined_city_and_capacity_gte(self):
        response = self.client.get(
            self.base_url,
            {'city': 'Lima', 'capacity_m3__gte': 300},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        # Solo Lima Grande (500) cumple ambas condiciones
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Lima Grande')

    def test_filter_capacity_range(self):
        response = self.client.get(
            self.base_url,
            {'capacity_m3__gte': 200, 'capacity_m3__lte': 400},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [float(item['capacity_m3']) for item in response.data['results']]
        # Santiago (200) y Trujillo (300)
        self.assertEqual(len(capacities), 2)
        self.assertTrue(all(200 <= c <= 400 for c in capacities))

    # -------------------------------------------------------------------------
    # Filtro por is_active (incluido en FilterSet.Meta.fields)
    # -------------------------------------------------------------------------

    def test_filter_is_active_false_not_in_default_queryset(self):
        # El queryset base filtra is_active=True, el filtro is_active=False
        # puede usarse pero el queryset subyacente solo tiene activos
        self.wh_chile.is_active = False
        self.wh_chile.save()
        response = self.client.get(self.base_url)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.wh_chile.id, ids)

    # -------------------------------------------------------------------------
    # Search filter
    # -------------------------------------------------------------------------

    def test_search_by_name(self):
        response = self.client.get(self.base_url, {'search': 'Lima'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Debe encontrar warehouses con 'Lima' en name, city, country o address
        self.assertGreater(response.data['count'], 0)

    def test_search_no_matches_returns_empty(self):
        response = self.client.get(self.base_url, {'search': 'XYZnonexistent'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])
