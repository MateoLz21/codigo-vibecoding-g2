import datetime

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.drivers.models import Driver

User = get_user_model()

BASE_URL = '/api/v1/drivers/'


def make_driver_user(username, first_name='', last_name=''):
    """Helper: crea un User de Django para usar como driver."""
    return User.objects.create_user(
        username=username,
        password='driverpass123',
        first_name=first_name,
        last_name=last_name,
    )


class DriverViewSetHappyPathTest(APITestCase):
    """Happy path: flujo exitoso de todos los endpoints."""

    def setUp(self):
        # Usuario autenticado para hacer requests (distinto al usuario del driver)
        self.auth_user = User.objects.create_user(
            username='apiuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.auth_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Usuario Django para el driver de prueba
        self.driver_user = make_driver_user('driver1', 'Carlos', 'Lopez')
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-100',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+51987654321',
        )

    def test_list_drivers_returns_200(self):
        """GET /api/v1/drivers/ retorna 200 con lista paginada."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_drivers_contains_created_driver(self):
        """El driver creado en setUp aparece en el listado."""
        response = self.client.get(BASE_URL)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver.id, ids)

    def test_create_driver_returns_201(self):
        """POST /api/v1/drivers/ con datos validos retorna 201."""
        new_user = make_driver_user('driver_new')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-200',
            'license_expiry': '2028-06-15',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['license_number'], 'LIC-200')

    def test_retrieve_driver_returns_200(self):
        """GET /api/v1/drivers/{id}/ retorna 200 con los datos del driver."""
        url = f'{BASE_URL}{self.driver.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.driver.id)
        self.assertEqual(response.data['license_number'], 'LIC-100')

    def test_update_driver_put_returns_200(self):
        """PUT /api/v1/drivers/{id}/ retorna 200 con datos actualizados."""
        url = f'{BASE_URL}{self.driver.id}/'
        payload = {
            'user': self.driver_user.id,
            'license_number': 'LIC-100-UPDATED',
            'license_expiry': '2029-01-01',
            'is_available': False,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['license_number'], 'LIC-100-UPDATED')

    def test_update_driver_patch_returns_200(self):
        """PATCH /api/v1/drivers/{id}/ retorna 200 actualizando solo el campo enviado."""
        url = f'{BASE_URL}{self.driver.id}/'
        payload = {'is_available': False}
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_available'])

    def test_soft_delete_returns_204(self):
        """DELETE /api/v1/drivers/{id}/ retorna 204."""
        url = f'{BASE_URL}{self.driver.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_soft_delete_driver_not_found_after_delete(self):
        """GET /api/v1/drivers/{id}/ tras DELETE retorna 404."""
        url = f'{BASE_URL}{self.driver.id}/'
        self.client.delete(url)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_soft_delete_marks_user_as_inactive(self):
        """Tras DELETE, el objeto sigue en BD con user.is_active=False."""
        url = f'{BASE_URL}{self.driver.id}/'
        self.client.delete(url)
        # El driver sigue en BD
        driver_in_db = Driver.objects.get(id=self.driver.id)
        self.assertFalse(driver_in_db.user.is_active)

    def test_create_driver_without_phone_returns_201(self):
        """POST sin phone (campo nullable) retorna 201."""
        new_user = make_driver_user('driver_nophone')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-300',
            'license_expiry': '2027-03-01',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['phone'])

    def test_read_only_fields_not_overwritten_on_create(self):
        """id, created_at y updated_at son read_only y el server los setea."""
        new_user = make_driver_user('driver_ro')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-400',
            'license_expiry': '2027-03-01',
            'id': 9999,
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)


class DriverViewSetUnhappyPathTest(APITestCase):
    """Unhappy path: errores esperados."""

    def setUp(self):
        self.auth_user = User.objects.create_user(
            username='apiuser2',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.auth_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.driver_user = make_driver_user('driver_existing')
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-EXIST',
            license_expiry=datetime.date(2027, 12, 31),
        )

    def test_list_without_token_returns_401(self):
        """GET sin token JWT retorna 401."""
        self.client.credentials()
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_without_token_returns_401(self):
        """GET detalle sin token JWT retorna 401."""
        self.client.credentials()
        url = f'{BASE_URL}{self.driver.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_token_returns_401(self):
        """POST sin token JWT retorna 401."""
        self.client.credentials()
        payload = {
            'user': self.driver_user.id,
            'license_number': 'LIC-999',
            'license_expiry': '2027-01-01',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        """Token malformado retorna 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer tokeninvalido.abc.xyz')
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_nonexistent_driver_returns_404(self):
        """GET /api/v1/drivers/99999/ retorna 404."""
        response = self.client.get(f'{BASE_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_missing_required_field_license_number_returns_400(self):
        """POST sin license_number (campo requerido) retorna 400."""
        new_user = make_driver_user('driver_nolic')
        payload = {
            'user': new_user.id,
            'license_expiry': '2027-01-01',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_number', response.data)

    def test_create_missing_required_field_license_expiry_returns_400(self):
        """POST sin license_expiry (campo requerido) retorna 400."""
        new_user = make_driver_user('driver_noexpiry')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-NOEXP',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_expiry', response.data)

    def test_create_missing_user_returns_400(self):
        """POST sin user retorna 400."""
        payload = {
            'license_number': 'LIC-NOUSER',
            'license_expiry': '2027-01-01',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('user', response.data)

    def test_create_duplicate_user_returns_400(self):
        """POST con user ya asignado a otro driver retorna 400 (unicidad OneToOne)."""
        payload = {
            'user': self.driver_user.id,  # ya tiene driver
            'license_number': 'LIC-DUPUSER',
            'license_expiry': '2027-01-01',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_license_number_returns_400(self):
        """POST con license_number duplicado retorna 400."""
        new_user = make_driver_user('driver_duplic')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-EXIST',  # ya existe
            'license_expiry': '2027-01-01',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_number', response.data)

    def test_create_invalid_date_format_returns_400(self):
        """POST con fecha en formato incorrecto retorna 400."""
        new_user = make_driver_user('driver_baddate')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-BADDATE',
            'license_expiry': 'not-a-date',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_expiry', response.data)


class DriverViewSetEdgeCasesTest(APITestCase):
    """Edge cases: casos borde y comportamientos especiales."""

    def setUp(self):
        self.auth_user = User.objects.create_user(
            username='apiuser3',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.auth_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_empty_returns_results_empty(self):
        """GET cuando no hay drivers activos retorna results: []."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_inactive_user_driver_not_in_list(self):
        """Driver con user.is_active=False NO aparece en el listado."""
        inactive_user = User.objects.create_user(
            username='inactive_driver',
            password='pass',
            is_active=False,
        )
        inactive_driver = Driver.objects.create(
            user=inactive_user,
            license_number='LIC-INACTIVE',
            license_expiry=datetime.date(2027, 12, 31),
        )
        response = self.client.get(BASE_URL)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(inactive_driver.id, ids)

    def test_soft_delete_driver_not_physically_deleted(self):
        """Tras DELETE, el driver sigue en la BD."""
        driver_user = make_driver_user('driver_persist')
        driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-PERSIST',
            license_expiry=datetime.date(2027, 12, 31),
        )
        url = f'{BASE_URL}{driver.id}/'
        self.client.delete(url)
        # Sigue en BD
        self.assertTrue(Driver.objects.filter(id=driver.id).exists())

    def test_pagination_returns_next_when_more_than_page_size(self):
        """Lista con 21+ drivers retorna paginacion con 'next'."""
        for i in range(21):
            u = User.objects.create_user(username=f'paginationdriver{i}', password='pass')
            Driver.objects.create(
                user=u,
                license_number=f'LIC-PAG-{i:03d}',
                license_expiry=datetime.date(2027, 12, 31),
            )
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('next', response.data)
        self.assertIsNotNone(response.data['next'])
        self.assertEqual(len(response.data['results']), 20)

    def test_filter_by_is_available_true(self):
        """Filtro is_available=true retorna solo drivers disponibles."""
        available_user = make_driver_user('avail_driver')
        unavailable_user = make_driver_user('unavail_driver')
        Driver.objects.create(
            user=available_user,
            license_number='LIC-AVAIL',
            license_expiry=datetime.date(2027, 12, 31),
            is_available=True,
        )
        Driver.objects.create(
            user=unavailable_user,
            license_number='LIC-UNAVAIL',
            license_expiry=datetime.date(2027, 12, 31),
            is_available=False,
        )
        response = self.client.get(BASE_URL, {'is_available': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        licenses = [item['license_number'] for item in response.data['results']]
        self.assertIn('LIC-AVAIL', licenses)
        self.assertNotIn('LIC-UNAVAIL', licenses)

    def test_filter_by_is_available_false(self):
        """Filtro is_available=false retorna solo drivers no disponibles."""
        u1 = make_driver_user('avail2')
        u2 = make_driver_user('unavail2')
        Driver.objects.create(
            user=u1,
            license_number='LIC-AVAIL2',
            license_expiry=datetime.date(2027, 12, 31),
            is_available=True,
        )
        Driver.objects.create(
            user=u2,
            license_number='LIC-UNAVAIL2',
            license_expiry=datetime.date(2027, 12, 31),
            is_available=False,
        )
        response = self.client.get(BASE_URL, {'is_available': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        licenses = [item['license_number'] for item in response.data['results']]
        self.assertNotIn('LIC-AVAIL2', licenses)
        self.assertIn('LIC-UNAVAIL2', licenses)

    def test_filter_license_expiry_gte(self):
        """Filtro license_expiry_gte retorna drivers con licencia que vence en o despues de la fecha."""
        u1 = make_driver_user('expiry_future')
        u2 = make_driver_user('expiry_past')
        Driver.objects.create(
            user=u1,
            license_number='LIC-FUTURE',
            license_expiry=datetime.date(2030, 1, 1),
        )
        Driver.objects.create(
            user=u2,
            license_number='LIC-PAST',
            license_expiry=datetime.date(2020, 1, 1),
        )
        response = self.client.get(BASE_URL, {'license_expiry_gte': '2025-01-01'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        licenses = [item['license_number'] for item in response.data['results']]
        self.assertIn('LIC-FUTURE', licenses)
        self.assertNotIn('LIC-PAST', licenses)

    def test_filter_license_expiry_lte(self):
        """Filtro license_expiry_lte retorna drivers con licencia que vence en o antes de la fecha."""
        u1 = make_driver_user('expiry_future2')
        u2 = make_driver_user('expiry_past2')
        Driver.objects.create(
            user=u1,
            license_number='LIC-FUTURE2',
            license_expiry=datetime.date(2030, 1, 1),
        )
        Driver.objects.create(
            user=u2,
            license_number='LIC-PAST2',
            license_expiry=datetime.date(2020, 1, 1),
        )
        response = self.client.get(BASE_URL, {'license_expiry_lte': '2025-01-01'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        licenses = [item['license_number'] for item in response.data['results']]
        self.assertNotIn('LIC-FUTURE2', licenses)
        self.assertIn('LIC-PAST2', licenses)
