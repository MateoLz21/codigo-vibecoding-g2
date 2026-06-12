from datetime import timedelta
from pathlib import Path

from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
]

LOCAL_APPS = [
    # Core — concerns transversales (auth, tests de infraestructura)
    'apps.core',
    # Fase 1 — Sin dependencias entre apps propias
    'apps.warehouses',
    'apps.suppliers',
    'apps.customers',
    'apps.transport',
    # Fase 2 — Dependen de Fase 1
    'apps.products',
    'apps.routes',
    # Fase 2/3
    'apps.drivers',
    # Fase 4 — Depende de todo
    'apps.shipments',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-pe'
TIME_ZONE = 'America/Lima'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Logística API',
    'DESCRIPTION': (
        'API REST para gestión de envíos de productos tecnológicos. '
        'Cubre el ciclo completo desde recepción en almacén hasta entrega al cliente final.\n\n'
        '## Autenticación\n'
        'Todos los endpoints requieren JWT. '
        'Obtén el token en `/api/v1/auth/token/` y envíalo como `Authorization: Bearer <token>`.\n\n'
        '## Soft delete\n'
        'Los recursos con `is_active` no se eliminan físicamente — '
        'el `DELETE` marca `is_active=False` y retorna `204 No Content`.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api/v1/',
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'auth', 'description': 'Obtención y renovación de tokens JWT'},
        {'name': 'warehouses', 'description': 'Almacenes — puntos de origen y almacenamiento de productos'},
        {'name': 'suppliers', 'description': 'Proveedores de productos tecnológicos'},
        {'name': 'customers', 'description': 'Clientes que generan envíos'},
        {'name': 'transport', 'description': 'Vehículos de entrega (truck, van, motorcycle)'},
        {'name': 'drivers', 'description': 'Conductores asignados al transporte'},
        {'name': 'products', 'description': 'Productos tecnológicos en almacén'},
        {'name': 'routes', 'description': 'Rutas de entrega — secuencia de paradas'},
        {'name': 'route-stops', 'description': 'Paradas individuales de una ruta (borrado físico)'},
        {'name': 'shipments', 'description': 'Envíos — unidad central de negocio'},
        {'name': 'shipment-items', 'description': 'Ítems de un envío con precio congelado y cálculo automático de totales'},
    ],
}
