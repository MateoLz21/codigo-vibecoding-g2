"""
Tests de autenticación JWT para los endpoints:
  - POST /api/v1/auth/token/
  - POST /api/v1/auth/token/refresh/

Cubre: happy path, unhappy path y edge cases.
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


class TokenObtainTest(APITestCase):
    """Tests para POST /api/v1/auth/token/ — obtener par de tokens."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.token_url = '/api/v1/auth/token/'
        self.refresh_url = '/api/v1/auth/token/refresh/'

    # --- Happy path ---

    def test_obtain_tokens_with_valid_credentials_returns_200(self):
        """Credenciales correctas → 200 con access y refresh en el body."""
        response = self.client.post(self.token_url, {
            'username': 'testuser',
            'password': 'testpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('is_superuser', response.data)
        self.assertIn('username', response.data)

    def test_obtain_tokens_is_superuser_false_for_regular_user(self):
        """Usuario normal → is_superuser False en response."""
        response = self.client.post(self.token_url, {
            'username': 'testuser',
            'password': 'testpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_superuser'])
        self.assertEqual(response.data['username'], 'testuser')

    def test_obtain_tokens_is_superuser_true_for_superuser(self):
        """Superusuario → is_superuser True en response."""
        superuser = User.objects.create_superuser(
            username='admin',
            password='adminpass123',
        )
        response = self.client.post(self.token_url, {
            'username': 'admin',
            'password': 'adminpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_superuser'])
        self.assertEqual(response.data['username'], 'admin')

    def test_obtain_tokens_access_token_is_non_empty_string(self):
        """El access token obtenido es una cadena no vacía."""
        response = self.client.post(self.token_url, {
            'username': 'testuser',
            'password': 'testpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    def test_obtain_tokens_refresh_token_is_non_empty_string(self):
        """El refresh token obtenido es una cadena no vacía."""
        response = self.client.post(self.token_url, {
            'username': 'testuser',
            'password': 'testpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data['refresh'], str)
        self.assertTrue(len(response.data['refresh']) > 0)

    # --- Unhappy path ---

    def test_obtain_tokens_with_wrong_password_returns_401(self):
        """Password incorrecta → 401."""
        response = self.client.post(self.token_url, {
            'username': 'testuser',
            'password': 'wrongpassword',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_tokens_with_nonexistent_user_returns_401(self):
        """Usuario inexistente → 401."""
        response = self.client.post(self.token_url, {
            'username': 'nobody',
            'password': 'doesnotmatter',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_tokens_with_empty_body_returns_400(self):
        """Body vacío (sin username ni password) → 400."""
        response = self.client.post(self.token_url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_tokens_with_missing_password_returns_400(self):
        """Solo username, sin password → 400."""
        response = self.client.post(self.token_url, {
            'username': 'testuser',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_tokens_with_missing_username_returns_400(self):
        """Solo password, sin username → 400."""
        response = self.client.post(self.token_url, {
            'password': 'testpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TokenRefreshTest(APITestCase):
    """Tests para POST /api/v1/auth/token/refresh/ — renovar access token."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.token_url = '/api/v1/auth/token/'
        self.refresh_url = '/api/v1/auth/token/refresh/'
        # Obtener refresh token usando simplejwt directamente
        refresh = RefreshToken.for_user(self.user)
        self.valid_refresh_token = str(refresh)

    # --- Happy path ---

    def test_refresh_with_valid_token_returns_200(self):
        """Refresh token válido → 200 con nuevo access token en el body."""
        response = self.client.post(self.refresh_url, {
            'refresh': self.valid_refresh_token,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_returns_new_access_token_as_string(self):
        """El nuevo access token retornado es una cadena no vacía."""
        response = self.client.post(self.refresh_url, {
            'refresh': self.valid_refresh_token,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    # --- Unhappy path ---

    def test_refresh_with_invalid_token_returns_401(self):
        """Refresh token inválido (malformado) → 401."""
        response = self.client.post(self.refresh_url, {
            'refresh': 'este.token.es.invalido',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_with_garbage_string_returns_401(self):
        """String aleatorio como refresh token → 401."""
        response = self.client.post(self.refresh_url, {
            'refresh': 'notavalidjwttokenatall',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_with_empty_body_returns_400(self):
        """Body vacío → 400."""
        response = self.client.post(self.refresh_url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_with_access_token_instead_of_refresh_returns_401(self):
        """Usar el access token en lugar del refresh → 401."""
        # Obtener un access token
        token_response = self.client.post(self.token_url, {
            'username': 'testuser',
            'password': 'testpass123',
        }, format='json')
        access_token = token_response.data['access']

        response = self.client.post(self.refresh_url, {
            'refresh': access_token,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenUsageTest(APITestCase):
    """Edge cases: el token obtenido es usable en endpoints protegidos."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.token_url = '/api/v1/auth/token/'
        self.protected_url = '/api/v1/warehouses/'

    def test_access_token_allows_request_to_protected_endpoint(self):
        """Token válido obtenido via /auth/token/ permite GET en endpoint protegido."""
        # Obtener tokens
        token_response = self.client.post(self.token_url, {
            'username': 'testuser',
            'password': 'testpass123',
        }, format='json')
        access_token = token_response.data['access']

        # Usar el token en endpoint protegido
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.protected_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_request_without_token_to_protected_endpoint_returns_401(self):
        """Sin token → 401 en endpoint protegido."""
        response = self.client.get(self.protected_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_request_with_invalid_token_to_protected_endpoint_returns_401(self):
        """Token malformado → 401 en endpoint protegido."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer tokeninvalido')
        response = self.client.get(self.protected_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refreshed_token_also_allows_access_to_protected_endpoint(self):
        """Token renovado via /auth/token/refresh/ también funciona en endpoints protegidos."""
        refresh = RefreshToken.for_user(self.user)
        refresh_response = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': str(refresh),
        }, format='json')
        new_access_token = refresh_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
        response = self.client.get(self.protected_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
