"""
Tests para endpoints de gestión de usuarios y grupos (solo superadmin):
  - GET/POST /api/v1/auth/users/
  - GET/PATCH/DELETE /api/v1/auth/users/{id}/
  - POST /api/v1/auth/users/{id}/assign-groups/
  - GET/POST /api/v1/auth/groups/

Cubre: happy path, unhappy path y edge cases.
"""

from django.contrib.auth.models import Group, Permission, User
from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


def auth_header(user):
    refresh = RefreshToken.for_user(user)
    return {'HTTP_AUTHORIZATION': f'Bearer {str(refresh.access_token)}'}


class UserManagementPermissionTest(APITestCase):
    """Usuario normal no puede acceder a endpoints de gestión."""

    def setUp(self):
        self.regular_user = User.objects.create_user(username='regular', password='pass123')
        self.users_url = '/api/v1/auth/users/'
        self.groups_url = '/api/v1/auth/groups/'

    def test_regular_user_cannot_list_users(self):
        response = self.client.get(self.users_url, **auth_header(self.regular_user))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_list_users(self):
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_cannot_list_groups(self):
        response = self.client.get(self.groups_url, **auth_header(self.regular_user))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class UserListCreateTest(APITestCase):
    """Tests para GET y POST /api/v1/auth/users/"""

    def setUp(self):
        self.superuser = User.objects.create_superuser(username='admin', password='adminpass')
        self.users_url = '/api/v1/auth/users/'

    def test_list_users_returns_200(self):
        response = self.client.get(self.users_url, **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_users_includes_superuser_in_results(self):
        response = self.client.get(self.users_url, **auth_header(self.superuser))
        usernames = [u['username'] for u in response.data['results']]
        self.assertIn('admin', usernames)

    def test_create_user_returns_201(self):
        response = self.client.post(self.users_url, {
            'username': 'newuser',
            'password': 'newpass123',
            'email': 'new@example.com',
        }, format='json', **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_user_persists_in_db(self):
        self.client.post(self.users_url, {
            'username': 'persisted',
            'password': 'pass123',
        }, format='json', **auth_header(self.superuser))
        self.assertTrue(User.objects.filter(username='persisted').exists())

    def test_create_user_password_is_hashed(self):
        self.client.post(self.users_url, {
            'username': 'hashtest',
            'password': 'plaintext',
        }, format='json', **auth_header(self.superuser))
        user = User.objects.get(username='hashtest')
        self.assertNotEqual(user.password, 'plaintext')
        self.assertTrue(user.check_password('plaintext'))

    def test_create_user_with_groups(self):
        group = Group.objects.create(name='Operadores')
        response = self.client.post(self.users_url, {
            'username': 'grouped',
            'password': 'pass123',
            'group_ids': [group.id],
        }, format='json', **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='grouped')
        self.assertIn(group, user.groups.all())

    def test_create_user_missing_username_returns_400(self):
        response = self.client.post(self.users_url, {
            'password': 'pass123',
        }, format='json', **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserRetrieveUpdateDeleteTest(APITestCase):
    """Tests para GET/PATCH/DELETE /api/v1/auth/users/{id}/"""

    def setUp(self):
        self.superuser = User.objects.create_superuser(username='admin', password='adminpass')
        self.target_user = User.objects.create_user(username='target', password='pass123', email='t@t.com')
        self.url = f'/api/v1/auth/users/{self.target_user.id}/'

    def test_retrieve_user_returns_200(self):
        response = self.client.get(self.url, **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'target')

    def test_retrieve_nonexistent_user_returns_404(self):
        response = self.client.get('/api/v1/auth/users/99999/', **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_user_email_returns_200(self):
        response = self.client.patch(self.url, {
            'email': 'updated@example.com',
        }, format='json', **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.target_user.refresh_from_db()
        self.assertEqual(self.target_user.email, 'updated@example.com')

    def test_patch_user_password_updates_hash(self):
        self.client.patch(self.url, {
            'password': 'newpass456',
        }, format='json', **auth_header(self.superuser))
        self.target_user.refresh_from_db()
        self.assertTrue(self.target_user.check_password('newpass456'))

    def test_delete_user_soft_deletes(self):
        response = self.client.delete(self.url, **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.target_user.refresh_from_db()
        self.assertFalse(self.target_user.is_active)

    def test_delete_user_keeps_record_in_db(self):
        self.client.delete(self.url, **auth_header(self.superuser))
        self.assertTrue(User.objects.filter(id=self.target_user.id).exists())


class AssignGroupsTest(APITestCase):
    """Tests para POST /api/v1/auth/users/{id}/assign-groups/"""

    def setUp(self):
        self.superuser = User.objects.create_superuser(username='admin', password='adminpass')
        self.target_user = User.objects.create_user(username='target', password='pass123')
        self.group1 = Group.objects.create(name='Conductores')
        self.group2 = Group.objects.create(name='Operadores')
        self.url = f'/api/v1/auth/users/{self.target_user.id}/assign-groups/'

    def test_assign_groups_returns_200(self):
        response = self.client.post(self.url, {
            'group_ids': [self.group1.id],
        }, format='json', **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_assign_groups_updates_user_groups(self):
        self.client.post(self.url, {
            'group_ids': [self.group1.id, self.group2.id],
        }, format='json', **auth_header(self.superuser))
        self.target_user.refresh_from_db()
        self.assertIn(self.group1, self.target_user.groups.all())
        self.assertIn(self.group2, self.target_user.groups.all())

    def test_assign_empty_groups_clears_groups(self):
        self.target_user.groups.set([self.group1])
        self.client.post(self.url, {
            'group_ids': [],
        }, format='json', **auth_header(self.superuser))
        self.target_user.refresh_from_db()
        self.assertEqual(self.target_user.groups.count(), 0)

    def test_assign_invalid_group_id_returns_400(self):
        response = self.client.post(self.url, {
            'group_ids': [99999],
        }, format='json', **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GroupListCreateTest(APITestCase):
    """Tests para GET y POST /api/v1/auth/groups/"""

    def setUp(self):
        self.superuser = User.objects.create_superuser(username='admin', password='adminpass')
        self.groups_url = '/api/v1/auth/groups/'

    def test_list_groups_returns_200(self):
        response = self.client.get(self.groups_url, **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_group_returns_201(self):
        response = self.client.post(self.groups_url, {
            'name': 'Nuevos Operadores',
        }, format='json', **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_group_persists_in_db(self):
        self.client.post(self.groups_url, {
            'name': 'Persistido',
        }, format='json', **auth_header(self.superuser))
        self.assertTrue(Group.objects.filter(name='Persistido').exists())

    def test_create_group_duplicate_name_returns_400(self):
        Group.objects.create(name='Duplicado')
        response = self.client.post(self.groups_url, {
            'name': 'Duplicado',
        }, format='json', **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_group_name_returns_200(self):
        group = Group.objects.create(name='Modificable')
        response = self.client.patch(
            f'/api/v1/auth/groups/{group.id}/',
            {'name': 'Modificado'},
            format='json',
            **auth_header(self.superuser),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group.refresh_from_db()
        self.assertEqual(group.name, 'Modificado')


class MeEndpointTest(APITestCase):
    """Tests para GET /api/v1/auth/users/me/"""

    def setUp(self):
        self.regular_user = User.objects.create_user(
            username='regular', password='pass123', email='r@r.com'
        )
        self.superuser = User.objects.create_superuser(username='admin', password='adminpass')
        self.me_url = '/api/v1/auth/users/me/'

    def test_authenticated_user_gets_own_profile(self):
        response = self.client.get(self.me_url, **auth_header(self.regular_user))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'regular')
        self.assertEqual(response.data['email'], 'r@r.com')

    def test_me_returns_is_superuser_false_for_regular(self):
        response = self.client.get(self.me_url, **auth_header(self.regular_user))
        self.assertFalse(response.data['is_superuser'])

    def test_me_returns_is_superuser_true_for_superuser(self):
        response = self.client.get(self.me_url, **auth_header(self.superuser))
        self.assertTrue(response.data['is_superuser'])

    def test_unauthenticated_returns_401(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class GroupPermissionsTest(APITestCase):
    """Tests para asignar permisos a grupos."""

    def setUp(self):
        self.superuser = User.objects.create_superuser(username='admin', password='adminpass')
        self.group = Group.objects.create(name='Operadores')
        # Crear permiso de prueba sobre un content type de dominio
        from apps.customers.models import Customer
        self.ct = ContentType.objects.get_for_model(Customer)
        self.perm = Permission.objects.get(content_type=self.ct, codename='view_customer')
        self.group_url = f'/api/v1/auth/groups/{self.group.id}/'

    def test_patch_group_assigns_permissions(self):
        response = self.client.patch(
            self.group_url,
            {'permission_ids': [self.perm.id]},
            format='json',
            **auth_header(self.superuser),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.group.refresh_from_db()
        self.assertIn(self.perm, self.group.permissions.all())

    def test_patch_group_permissions_shows_in_response(self):
        response = self.client.patch(
            self.group_url,
            {'permission_ids': [self.perm.id]},
            format='json',
            **auth_header(self.superuser),
        )
        permission_ids = [p['id'] for p in response.data['permissions']]
        self.assertIn(self.perm.id, permission_ids)

    def test_patch_empty_permission_ids_clears_permissions(self):
        self.group.permissions.set([self.perm])
        self.client.patch(
            self.group_url,
            {'permission_ids': []},
            format='json',
            **auth_header(self.superuser),
        )
        self.group.refresh_from_db()
        self.assertEqual(self.group.permissions.count(), 0)


class PermissionListTest(APITestCase):
    """Tests para GET /api/v1/auth/permissions/"""

    def setUp(self):
        self.superuser = User.objects.create_superuser(username='admin', password='adminpass')
        self.regular_user = User.objects.create_user(username='regular', password='pass123')
        self.perms_url = '/api/v1/auth/permissions/'

    def test_superadmin_can_list_permissions(self):
        response = self.client.get(self.perms_url, **auth_header(self.superuser))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_permissions_list_contains_domain_perms(self):
        response = self.client.get(self.perms_url, **auth_header(self.superuser))
        app_labels = {p['app_label'] for p in response.data}
        self.assertTrue(app_labels.issubset({
            'customers', 'drivers', 'products', 'routes',
            'shipments', 'suppliers', 'transport', 'warehouses',
        }))

    def test_regular_user_cannot_list_permissions(self):
        response = self.client.get(self.perms_url, **auth_header(self.regular_user))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
