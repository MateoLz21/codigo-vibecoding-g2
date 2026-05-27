# CLAUDE.md

Este archivo proporciona guía a Claude Code (claude.ai/code) al trabajar en este repositorio.

## Reglas del proyecto

- **Comunicación y documentación:** siempre en español (comentarios explicativos, respuestas, docs, este archivo)
- **Código:** siempre en inglés — nombres de variables, funciones, clases, carpetas, tablas, columnas, rutas, commits
- **Entorno virtual:** activar `.venv` antes de ejecutar cualquier comando dentro del proyecto (`C:\Users\mateo\dev\codigo-vibecoding-g2\logistica-api\.venv\Scripts\activate`)
- **Servidor de desarrollo:** `python manage.py runserver` nunca ejecutarlo — siempre lo corre el usuario manualmente
- **Django skills:** usar siempre el plugin `django-skills` (saaspegasus/django-skills) para tareas Django — modelos, vistas, serializers, migraciones, admin, tests, DRF

## Documentación de referencia — leer antes de cualquier tarea de desarrollo

| Documento | Contenido |
|---|---|
| [`docs/database-schema.md`](docs/database-schema.md) | Tablas, columnas, tipos, restricciones, relaciones, diagrama de dependencias |
| [`docs/architecture.md`](docs/architecture.md) | Stack, estructura de carpetas, capas, patrones de código, endpoints, orden de desarrollo, dependencias |

> Toda decisión sobre modelos, FKs, campos, estructura de apps, patrones o dependencias debe ser consistente con esos documentos. Si hay contradicción entre CLAUDE.md y los docs, los docs tienen precedencia.

## Contexto del proyecto

API REST de logística para gestión de envíos de productos tecnológicos. Cubre el ciclo completo: desde recepción de productos en almacén hasta entrega al cliente final.

## Módulos

| Módulo | App Django | Descripción |
|---|---|---|
| Cliente | `customers` | Empresa o persona que genera envíos |
| Envío | `shipments` | Unidad central de negocio — origen, destino, estado, costo calculado |
| Productos | `products` | Productos tecnológicos a enviar |
| Transporte | `transport` | Vehículo de entrega |
| Conductor | `drivers` | Persona asignada al transporte |
| Ruta | `routes` | Secuencia de paradas del transporte |
| Almacén | `warehouses` | Punto de partida y almacenamiento |
| Proveedores | `suppliers` | Empresas que venden los productos |

## Stack

| Componente | Tecnología |
|---|---|
| Runtime | Python 3.14 |
| Framework | Django 6.0.5 + DRF 3.17 |
| Autenticación | `djangorestframework-simplejwt` (JWT) |
| Filtrado | `django-filter` |
| Docs API | `drf-spectacular` (Swagger en `/api/v1/docs/`) |
| CORS | `django-cors-headers` |
| Config | `python-decouple` |
| BD desarrollo | SQLite |
| BD producción | PostgreSQL (`psycopg2-binary`) |

## Comandos

```bash
# Configuración inicial
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements/development.txt

# Servidor de desarrollo (MANUAL — nunca ejecutar, lo corre el usuario)
# python manage.py runserver

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Tests
python manage.py test                                                    # todos
python manage.py test apps.customers                                     # app específica
python manage.py test apps.customers.tests.test_views.CustomerViewTest   # test único
```

## Metodología de desarrollo — SDD (Spec Driven Development)

**Este proyecto usa SDD con 4 agentes especializados. Para toda tarea de desarrollo, invocar primero al Orquestador.**

| Agente | Archivo | Responsabilidad |
|---|---|---|
| **Orquestador** | `.claude/agents/orchestrator.md` | Coordina el equipo, define el orden, no escribe código |
| Spec | `.claude/agents/spec.md` | Crea `spec/{módulo}.md` con tareas exactas |
| Implement | `.claude/agents/implement.md` | Ejecuta las tareas en código Django |
| Validator | `.claude/agents/validator.md` | Revisa el código contra spec + docs, reporta errores |

Flujo obligatorio por módulo: **Spec → Implement → Validator → (corregir si hay errores) → completo**

Ver alcance completo del MVP en [`docs/scope.md`](docs/scope.md).

## Arquitectura resumida

Apps de dominio en `apps/`, código transversal en `core/`, settings divididos en `config/settings/`.

Capas por app: `models.py` → `serializers.py` → `views.py` → `urls.py`. Lógica de negocio compleja en `services.py` dentro de la app.

Todos los endpoints bajo `/api/v1/`. Autenticación JWT: `POST /api/v1/auth/token/`.

Ver detalle completo en [`docs/architecture.md`](docs/architecture.md).
