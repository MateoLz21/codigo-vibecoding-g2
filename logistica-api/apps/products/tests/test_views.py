from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/products/'

        self.supplier = Supplier.objects.create(name='Proveedor Test')
        self.warehouse = Warehouse.objects.create(
            name='Almacen Test',
            address='Av. Industrial 123',
            city='Lima',
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Laptop Pro',
            sku='LAP-001',
            weight_kg='1.500',
            unit_price='999.99',
            stock=10,
        )
        self.valid_payload = {
            'supplier': self.supplier.id,
            'warehouse': self.warehouse.id,
            'name': 'Mouse Inalambrico',
            'sku': 'MOU-001',
            'weight_kg': '0.200',
            'unit_price': '29.99',
            'stock': 50,
        }

    # ------------------------------------------------------------------
    # Happy path — lista
    # ------------------------------------------------------------------

    def test_list_products_returns_200(self):
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_products_returns_results_key(self):
        response = self.client.get(self.base_url)
        self.assertIn('results', response.data)

    def test_list_products_contains_created_product(self):
        response = self.client.get(self.base_url)
        skus = [item['sku'] for item in response.data['results']]
        self.assertIn('LAP-001', skus)

    # ------------------------------------------------------------------
    # Happy path — crear
    # ------------------------------------------------------------------

    def test_create_product_returns_201(self):
        response = self.client.post(self.base_url, data=self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_product_persists_in_db(self):
        self.client.post(self.base_url, data=self.valid_payload, format='json')
        self.assertTrue(Product.objects.filter(sku='MOU-001').exists())

    def test_create_product_returns_correct_sku(self):
        response = self.client.post(self.base_url, data=self.valid_payload, format='json')
        self.assertEqual(response.data['sku'], 'MOU-001')

    # ------------------------------------------------------------------
    # Happy path — detalle
    # ------------------------------------------------------------------

    def test_retrieve_product_returns_200(self):
        response = self.client.get(f'{self.base_url}{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_product_returns_correct_data(self):
        response = self.client.get(f'{self.base_url}{self.product.id}/')
        self.assertEqual(response.data['sku'], 'LAP-001')
        self.assertEqual(response.data['name'], 'Laptop Pro')

    # ------------------------------------------------------------------
    # Happy path — actualizar
    # ------------------------------------------------------------------

    def test_put_product_returns_200(self):
        payload = {
            'supplier': self.supplier.id,
            'warehouse': self.warehouse.id,
            'name': 'Laptop Pro Updated',
            'sku': 'LAP-001',
            'weight_kg': '1.600',
            'unit_price': '1099.99',
            'stock': 5,
        }
        response = self.client.put(
            f'{self.base_url}{self.product.id}/', data=payload, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_product_updates_data(self):
        payload = {
            'supplier': self.supplier.id,
            'warehouse': self.warehouse.id,
            'name': 'Laptop Pro Updated',
            'sku': 'LAP-001',
            'weight_kg': '1.600',
            'unit_price': '1099.99',
            'stock': 5,
        }
        self.client.put(f'{self.base_url}{self.product.id}/', data=payload, format='json')
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Laptop Pro Updated')

    def test_patch_product_returns_200(self):
        response = self.client.patch(
            f'{self.base_url}{self.product.id}/', data={'stock': 99}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_product_updates_stock(self):
        self.client.patch(
            f'{self.base_url}{self.product.id}/', data={'stock': 99}, format='json'
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 99)

    # ------------------------------------------------------------------
    # Happy path — soft delete
    # ------------------------------------------------------------------

    def test_delete_product_returns_204(self):
        response = self.client.delete(f'{self.base_url}{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_deleted_product_returns_404_on_retrieve(self):
        self.client.delete(f'{self.base_url}{self.product.id}/')
        response = self.client.get(f'{self.base_url}{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------
    # Unhappy path — autenticación
    # ------------------------------------------------------------------

    def test_list_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer tokeninvalido123')
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.post(self.base_url, data=self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{self.base_url}{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------
    # Unhappy path — recurso no encontrado
    # ------------------------------------------------------------------

    def test_retrieve_nonexistent_product_returns_404(self):
        response = self.client.get(f'{self.base_url}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_product_returns_404(self):
        response = self.client.patch(
            f'{self.base_url}99999/', data={'stock': 1}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------
    # Unhappy path — validaciones de negocio
    # ------------------------------------------------------------------

    def test_create_with_negative_stock_returns_400(self):
        payload = {**self.valid_payload, 'stock': -1, 'sku': 'BAD-001'}
        response = self.client.post(self.base_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_zero_unit_price_returns_400(self):
        payload = {**self.valid_payload, 'unit_price': '0.00', 'sku': 'BAD-002'}
        response = self.client.post(self.base_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_negative_unit_price_returns_400(self):
        payload = {**self.valid_payload, 'unit_price': '-5.00', 'sku': 'BAD-003'}
        response = self.client.post(self.base_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_required_name_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(self.base_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_sku_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'sku'}
        response = self.client.post(self.base_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------
    # Edge cases
    # ------------------------------------------------------------------

    def test_list_empty_returns_empty_results(self):
        # Desactivar el producto creado en setUp para tener lista vacía
        Product.objects.all().update(is_active=False)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_inactive_product_not_in_list(self):
        self.product.is_active = False
        self.product.save()
        response = self.client.get(self.base_url)
        skus = [item['sku'] for item in response.data['results']]
        self.assertNotIn('LAP-001', skus)

    def test_soft_delete_keeps_record_in_db(self):
        self.client.delete(f'{self.base_url}{self.product.id}/')
        # El objeto sigue existiendo en BD
        product_in_db = Product.objects.get(id=self.product.id)
        self.assertFalse(product_in_db.is_active)

    def test_pagination_with_more_than_20_products(self):
        # Crear 21 productos activos (1 ya existe en setUp)
        for i in range(20):
            Product.objects.create(
                supplier=self.supplier,
                warehouse=self.warehouse,
                name=f'Producto {i}',
                sku=f'PAG-{i:03d}',
                weight_kg='0.100',
                unit_price='9.99',
                stock=1,
            )
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('next', response.data)
        self.assertIsNotNone(response.data['next'])
        self.assertEqual(len(response.data['results']), 20)


class ProductFilterTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='filteruser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.base_url = '/api/v1/products/'

        self.supplier_a = Supplier.objects.create(name='Proveedor A')
        self.supplier_b = Supplier.objects.create(name='Proveedor B')
        self.warehouse = Warehouse.objects.create(
            name='Almacen Test',
            address='Av. Industrial 123',
            city='Lima',
        )
        self.product_a = Product.objects.create(
            supplier=self.supplier_a,
            warehouse=self.warehouse,
            name='Producto A',
            sku='FIL-001',
            weight_kg='1.000',
            unit_price='100.00',
            stock=5,
        )
        self.product_b = Product.objects.create(
            supplier=self.supplier_b,
            warehouse=self.warehouse,
            name='Producto B',
            sku='FIL-002',
            weight_kg='2.000',
            unit_price='500.00',
            stock=20,
        )
        self.product_c = Product.objects.create(
            supplier=self.supplier_a,
            warehouse=self.warehouse,
            name='Producto C',
            sku='FIL-003',
            weight_kg='0.500',
            unit_price='250.00',
            stock=0,
        )

    # ------------------------------------------------------------------
    # Filtro por supplier
    # ------------------------------------------------------------------

    def test_filter_by_supplier_returns_only_matching_products(self):
        response = self.client.get(self.base_url, {'supplier': self.supplier_a.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [item['sku'] for item in response.data['results']]
        self.assertIn('FIL-001', skus)
        self.assertIn('FIL-003', skus)
        self.assertNotIn('FIL-002', skus)

    def test_filter_by_supplier_b_returns_only_product_b(self):
        response = self.client.get(self.base_url, {'supplier': self.supplier_b.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [item['sku'] for item in response.data['results']]
        self.assertIn('FIL-002', skus)
        self.assertNotIn('FIL-001', skus)

    # ------------------------------------------------------------------
    # Filtro por rango de unit_price
    # ------------------------------------------------------------------

    def test_filter_unit_price_min(self):
        response = self.client.get(self.base_url, {'unit_price_min': '200.00'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [item['sku'] for item in response.data['results']]
        self.assertIn('FIL-002', skus)
        self.assertIn('FIL-003', skus)
        self.assertNotIn('FIL-001', skus)

    def test_filter_unit_price_max(self):
        response = self.client.get(self.base_url, {'unit_price_max': '200.00'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [item['sku'] for item in response.data['results']]
        self.assertIn('FIL-001', skus)
        self.assertNotIn('FIL-002', skus)

    def test_filter_unit_price_range(self):
        response = self.client.get(
            self.base_url, {'unit_price_min': '150.00', 'unit_price_max': '400.00'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [item['sku'] for item in response.data['results']]
        self.assertIn('FIL-003', skus)
        self.assertNotIn('FIL-001', skus)
        self.assertNotIn('FIL-002', skus)

    # ------------------------------------------------------------------
    # Filtro por rango de stock
    # ------------------------------------------------------------------

    def test_filter_stock_min(self):
        response = self.client.get(self.base_url, {'stock_min': 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [item['sku'] for item in response.data['results']]
        self.assertIn('FIL-002', skus)
        self.assertNotIn('FIL-001', skus)
        self.assertNotIn('FIL-003', skus)

    def test_filter_stock_max(self):
        response = self.client.get(self.base_url, {'stock_max': 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [item['sku'] for item in response.data['results']]
        self.assertIn('FIL-001', skus)
        self.assertIn('FIL-003', skus)
        self.assertNotIn('FIL-002', skus)

    # ------------------------------------------------------------------
    # Filtro por warehouse
    # ------------------------------------------------------------------

    def test_filter_by_warehouse(self):
        warehouse2 = Warehouse.objects.create(
            name='Almacen Secundario',
            address='Calle 2',
            city='Arequipa',
        )
        Product.objects.create(
            supplier=self.supplier_a,
            warehouse=warehouse2,
            name='Producto Otro Almacen',
            sku='FIL-004',
            weight_kg='1.000',
            unit_price='50.00',
            stock=3,
        )
        response = self.client.get(self.base_url, {'warehouse': self.warehouse.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [item['sku'] for item in response.data['results']]
        self.assertNotIn('FIL-004', skus)
        self.assertIn('FIL-001', skus)
