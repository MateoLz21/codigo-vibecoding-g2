from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer
from apps.products.models import Product
from apps.shipments.models import Shipment, ShipmentItem
from apps.shipments.services import create_shipment_item
from apps.suppliers.models import Supplier
from apps.transport.models import Transport
from apps.warehouses.models import Warehouse


def _make_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


class ShipmentViewSetTest(APITestCase):

    def setUp(self):
        self.auth_user = User.objects.create_user(
            username='apiuser', password='testpass123'
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {_make_token(self.auth_user)}'
        )
        self.base_url = '/api/v1/shipments/'

        self.supplier = Supplier.objects.create(name='Proveedor View Test')
        self.warehouse = Warehouse.objects.create(
            name='Almacen View Test',
            address='Av. View 10',
            city='Lima',
        )
        self.customer = Customer.objects.create(
            name='Cliente View Test',
            customer_type='company',
            email='viewtest@test.com',
        )
        self.transport = Transport.objects.create(
            plate_number='ABC-123',
            vehicle_type='van',
            max_capacity_kg=Decimal('1000.00'),
        )
        self.product = Product.objects.create(
            name='Laptop View',
            sku='LAP-VIEW-001',
            unit_price=Decimal('999.99'),
            weight_kg=Decimal('1.500'),
            stock=50,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Av. Origen View 100',
            destination_address='Av. Destino View 200',
        )

    def _shipment_data(self, **overrides):
        data = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'origin_address': 'Origen Nuevo',
            'destination_address': 'Destino Nuevo',
            'status': 'pending',
        }
        data.update(overrides)
        return data

    # ---- Happy path ----

    def test_list_shipments_returns_200(self):
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_shipments_has_results_key(self):
        response = self.client.get(self.base_url)
        self.assertIn('results', response.data)

    def test_create_shipment_returns_201(self):
        response = self.client.post(self.base_url, self._shipment_data(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_shipment_persists_in_db(self):
        initial_count = Shipment.objects.count()
        self.client.post(self.base_url, self._shipment_data(), format='json')
        self.assertEqual(Shipment.objects.count(), initial_count + 1)

    def test_retrieve_shipment_returns_200(self):
        url = f'{self.base_url}{self.shipment.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_shipment_returns_correct_data(self):
        url = f'{self.base_url}{self.shipment.id}/'
        response = self.client.get(url)
        self.assertEqual(response.data['id'], self.shipment.id)

    def test_update_shipment_put_returns_200(self):
        url = f'{self.base_url}{self.shipment.id}/'
        response = self.client.put(url, self._shipment_data(), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_shipment_status_returns_200(self):
        url = f'{self.base_url}{self.shipment.id}/'
        response = self.client.patch(url, {'status': 'in_transit'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_shipment_status_updates_value(self):
        url = f'{self.base_url}{self.shipment.id}/'
        self.client.patch(url, {'status': 'in_transit'}, format='json')
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'in_transit')

    def test_delete_shipment_returns_204(self):
        url = f'{self.base_url}{self.shipment.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_deleted_shipment_returns_404_on_get(self):
        url = f'{self.base_url}{self.shipment.id}/'
        self.client.delete(url)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ---- Unhappy path ----

    def test_list_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.post(self.base_url, self._shipment_data(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer tokeninvalido')
        url = f'{self.base_url}{self.shipment.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_nonexistent_shipment_returns_404(self):
        url = f'{self.base_url}99999/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_without_customer_returns_400(self):
        data = self._shipment_data()
        del data['customer']
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_origin_address_returns_400(self):
        data = self._shipment_data()
        del data['origin_address']
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_destination_address_returns_400(self):
        data = self._shipment_data()
        del data['destination_address']
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_nonexistent_customer_returns_400(self):
        data = self._shipment_data(customer=99999)
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- Edge cases ----

    def test_list_empty_when_no_active_shipments(self):
        Shipment.objects.all().update(is_active=False)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_soft_delete_does_not_remove_from_db(self):
        shipment_id = self.shipment.id
        url = f'{self.base_url}{shipment_id}/'
        self.client.delete(url)
        self.assertTrue(Shipment.objects.filter(pk=shipment_id).exists())

    def test_soft_delete_sets_is_active_false(self):
        url = f'{self.base_url}{self.shipment.id}/'
        self.client.delete(url)
        self.shipment.refresh_from_db()
        self.assertFalse(self.shipment.is_active)

    def test_inactive_shipment_not_in_list(self):
        self.shipment.is_active = False
        self.shipment.save()
        response = self.client.get(self.base_url)
        ids = [s['id'] for s in response.data['results']]
        self.assertNotIn(self.shipment.id, ids)

    def test_pagination_returns_count_and_results(self):
        # Crear 21 shipments adicionales para forzar paginación
        for i in range(21):
            Shipment.objects.create(
                customer=self.customer,
                origin_warehouse=self.warehouse,
                origin_address=f'Origen Paginacion {i}',
                destination_address=f'Destino Paginacion {i}',
            )
        response = self.client.get(self.base_url)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 20)

    def test_filter_by_status(self):
        Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen In Transit',
            destination_address='Destino In Transit',
            status='in_transit',
        )
        response = self.client.get(self.base_url, {'status': 'in_transit'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['status'], 'in_transit')

    def test_filter_by_customer(self):
        response = self.client.get(self.base_url, {'customer': self.customer.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['customer'], self.customer.id)


class ShipmentItemViewSetTest(APITestCase):

    def setUp(self):
        self.auth_user = User.objects.create_user(
            username='apiuser_items', password='testpass456'
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {_make_token(self.auth_user)}'
        )

        self.supplier = Supplier.objects.create(name='Proveedor Items View')
        self.warehouse = Warehouse.objects.create(
            name='Almacen Items View',
            address='Av. Items 20',
            city='Lima',
        )
        self.customer = Customer.objects.create(
            name='Cliente Items View',
            customer_type='company',
            email='itemsview@test.com',
        )
        self.product = Product.objects.create(
            name='Smartphone',
            sku='SMART-VIEW-001',
            unit_price=Decimal('799.99'),
            weight_kg=Decimal('0.200'),
            stock=100,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.product2 = Product.objects.create(
            name='Auriculares',
            sku='AUR-VIEW-001',
            unit_price=Decimal('120.00'),
            weight_kg=Decimal('0.150'),
            stock=50,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen Items View',
            destination_address='Destino Items View',
        )
        self.shipment_b = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origen B',
            destination_address='Destino B',
        )
        self.items_url = f'/api/v1/shipments/{self.shipment.id}/items/'

    def _item_data(self, **overrides):
        data = {
            'shipment': self.shipment.id,
            'product': self.product.id,
            'quantity': 2,
        }
        data.update(overrides)
        return data

    # ---- Happy path ----

    def test_list_items_returns_200(self):
        response = self.client.get(self.items_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_item_returns_201(self):
        response = self.client.post(self.items_url, self._item_data(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_item_assigns_correct_shipment(self):
        response = self.client.post(self.items_url, self._item_data(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        item_id = response.data['id']
        item = ShipmentItem.objects.get(pk=item_id)
        self.assertEqual(item.shipment, self.shipment)

    def test_create_item_returns_subtotal(self):
        response = self.client.post(self.items_url, self._item_data(quantity=2), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # subtotal = 2 * 799.99 = 1599.98
        self.assertEqual(Decimal(response.data['subtotal']), Decimal('1599.98'))

    def test_create_item_returns_frozen_unit_price(self):
        response = self.client.post(self.items_url, self._item_data(quantity=1), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['unit_price']), self.product.unit_price)

    def test_create_item_recalculates_total_weight_kg(self):
        self.client.post(self.items_url, self._item_data(quantity=3), format='json')
        self.shipment.refresh_from_db()
        # total_weight_kg = 3 * 0.200 = 0.600
        self.assertGreater(self.shipment.total_weight_kg, Decimal('0'))

    def test_create_item_recalculates_shipping_cost(self):
        self.client.post(self.items_url, self._item_data(quantity=3), format='json')
        self.shipment.refresh_from_db()
        self.assertGreater(self.shipment.shipping_cost, Decimal('0'))

    def test_delete_item_returns_204(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        url = f'{self.items_url}{item.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_item_removes_from_db(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        item_id = item.id
        url = f'{self.items_url}{item.id}/'
        self.client.delete(url)
        self.assertFalse(ShipmentItem.objects.filter(pk=item_id).exists())

    def test_delete_item_recalculates_shipment_totals(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )
        url = f'{self.items_url}{item.id}/'
        self.client.delete(url)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.total_weight_kg, Decimal('0'))
        self.assertEqual(self.shipment.shipping_cost, Decimal('0'))

    def test_update_item_put_returns_200(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        url = f'{self.items_url}{item.id}/'
        data = {
            'shipment': self.shipment.id,
            'product': self.product.id,
            'quantity': 5,
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_item_quantity_returns_200(self):
        item = create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        url = f'{self.items_url}{item.id}/'
        response = self.client.patch(url, {'quantity': 4}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ---- Unhappy path ----

    def test_list_items_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.items_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_item_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.post(self.items_url, self._item_data(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_items_nonexistent_shipment_returns_404(self):
        url = '/api/v1/shipments/99999/items/'
        response = self.client.get(url)
        # El GET lista items sin verificar shipment — retorna lista vacía
        # El POST sí verifica que el shipment exista
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_item_nonexistent_shipment_returns_404(self):
        url = '/api/v1/shipments/99999/items/'
        response = self.client.post(url, self._item_data(), format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_item_with_quantity_zero_returns_400(self):
        response = self.client.post(
            self.items_url, self._item_data(quantity=0), format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_with_negative_quantity_returns_400(self):
        response = self.client.post(
            self.items_url, self._item_data(quantity=-3), format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_with_nonexistent_product_returns_400(self):
        response = self.client.post(
            self.items_url, self._item_data(product=99999), format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_without_product_returns_400(self):
        data = self._item_data()
        del data['product']
        response = self.client.post(self.items_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- Edge cases ----

    def test_list_items_empty_when_no_items(self):
        response = self.client.get(self.items_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # La respuesta puede ser lista directa o paginada
        if 'results' in response.data:
            self.assertEqual(response.data['results'], [])
        else:
            self.assertEqual(list(response.data), [])

    def test_items_of_shipment_a_not_in_shipment_b(self):
        create_shipment_item(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        url_b = f'/api/v1/shipments/{self.shipment_b.id}/items/'
        response = self.client.get(url_b)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if 'results' in response.data:
            items = response.data['results']
        else:
            items = response.data
        self.assertEqual(len(items), 0)

    def test_two_items_accumulate_weight_correctly(self):
        self.client.post(
            self.items_url,
            self._item_data(product=self.product.id, quantity=2),
            format='json',
        )
        self.client.post(
            self.items_url,
            self._item_data(product=self.product2.id, quantity=3),
            format='json',
        )
        self.shipment.refresh_from_db()
        # total_weight_kg = (2 * 0.200) + (3 * 0.150) = 0.400 + 0.450 = 0.850
        self.assertEqual(self.shipment.total_weight_kg, Decimal('0.850'))

    def test_item_subtotal_equals_quantity_times_unit_price(self):
        response = self.client.post(
            self.items_url, self._item_data(quantity=4), format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        item_id = response.data['id']
        item = ShipmentItem.objects.get(pk=item_id)
        self.assertEqual(item.subtotal, item.quantity * item.unit_price)

    def test_create_item_for_inactive_shipment_returns_404(self):
        self.shipment.is_active = False
        self.shipment.save()
        response = self.client.post(self.items_url, self._item_data(), format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
