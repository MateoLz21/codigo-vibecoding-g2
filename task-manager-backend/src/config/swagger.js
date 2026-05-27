export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '1.0.0',
      description: 'API para gestión de tareas',
      contact: {
        name: 'API Support',
        email: 'support@taskmanager.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    tags: [
      {
        name: 'Tasks',
        description: 'Operaciones relacionadas con tareas'
      },
      {
        name: 'Users',
        description: 'Operaciones relacionadas con usuarios y autenticación'
      }
    ],
    paths: {
      '/tasks': {
        get: {
          tags: ['Tasks'],
          summary: 'Obtener todas las tareas',
          description: 'Retorna una lista de todas las tareas',
          responses: {
            '200': {
              description: 'Lista de tareas',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Task'
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Tasks'],
          summary: 'Crear una nueva tarea',
          description: 'Crea una nueva tarea con título y descripción',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Título de la tarea'
                    },
                    description: {
                      type: 'string',
                      description: 'Descripción de la tarea'
                    },
                    estado: {
                      type: 'string',
                      enum: ['pendiente', 'cerrado'],
                      description: 'Estado de la tarea'
                    }
                  },
                  example: {
                    title: 'Nueva tarea',
                    description: 'Descripción de la tarea',
                    estado: 'pendiente'
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Tarea creada exitosamente',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Task'
                  }
                }
              }
            },
            '400': {
              description: 'Error de validación'
            }
          }
        }
      },
      '/tasks/{id}': {
        get: {
          tags: ['Tasks'],
          summary: 'Obtener tarea por ID',
          description: 'Retorna una tarea específica por su UUID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'UUID de la tarea',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Tarea encontrada',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Task'
                  }
                }
              }
            },
            '404': {
              description: 'Tarea no encontrada'
            }
          }
        },
        put: {
          tags: ['Tasks'],
          summary: 'Actualizar tarea',
          description: 'Actualiza los datos de una tarea existente',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'UUID de la tarea',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Título de la tarea'
                    },
                    description: {
                      type: 'string',
                      description: 'Descripción de la tarea'
                    },
                    estado: {
                      type: 'string',
                      enum: ['pendiente', 'cerrado'],
                      description: 'Estado de la tarea'
                    }
                  },
                  example: {
                    title: 'Tarea actualizada',
                    description: 'Nueva descripción',
                    estado: 'cerrado'
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Tarea actualizada',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Task'
                  }
                }
              }
            },
            '404': {
              description: 'Tarea no encontrada'
            }
          }
        },
        delete: {
          tags: ['Tasks'],
          summary: 'Eliminar tarea',
          description: 'Elimina una tarea por su UUID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'UUID de la tarea',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          responses: {
            '204': {
              description: 'Tarea eliminada exitosamente'
            },
            '404': {
              description: 'Tarea no encontrada'
            }
          }
        }
      },
      '/users/register': {
        post: {
          tags: ['Users'],
          summary: 'Registrar nuevo usuario',
          description: 'Crea un nuevo usuario con nombre, apellido, email y contraseña',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'lastname', 'email', 'password'],
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Nombre del usuario'
                    },
                    lastname: {
                      type: 'string',
                      description: 'Apellido del usuario'
                    },
                    email: {
                      type: 'string',
                      format: 'email',
                      description: 'Email del usuario'
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      description: 'Contraseña del usuario'
                    }
                  },
                  example: {
                    name: 'Juan',
                    lastname: 'Pérez',
                    email: 'juan@example.com',
                    password: '123456'
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Usuario registrado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      user: {
                        $ref: '#/components/schemas/User'
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Error de validación'
            },
            '409': {
              description: 'El email ya está registrado'
            }
          }
        }
      },
      '/users/login': {
        post: {
          tags: ['Users'],
          summary: 'Iniciar sesión',
          description: 'Autentica un usuario y retorna un token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      description: 'Email del usuario'
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      description: 'Contraseña del usuario'
                    }
                  },
                  example: {
                    email: 'juan@example.com',
                    password: '123456'
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login exitoso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      token: { type: 'string' },
                      user: {
                        $ref: '#/components/schemas/User'
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Email y contraseña son requeridos'
            },
            '401': {
              description: 'Credenciales inválidas'
            }
          }
        }
      },
      '/users/me': {
        get: {
          tags: ['Users'],
          summary: 'Obtener usuario actual',
          description: 'Retorna los datos del usuario autenticado',
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'Usuario encontrado',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            },
            '401': {
              description: 'Token no proporcionado o inválido'
            }
          }
        }
      },
      '/users/logout': {
        post: {
          tags: ['Users'],
          summary: 'Cerrar sesión',
          description: 'Invalida el token del usuario',
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'Logout exitoso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Token no proporcionado'
            },
            '401': {
              description: 'Token inválido'
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identificador único de la tarea'
            },
            title: {
              type: 'string',
              description: 'Título de la tarea'
            },
            description: {
              type: 'string',
              description: 'Descripción de la tarea'
            },
            estado: {
              type: 'string',
              enum: ['pendiente', 'cerrado'],
              description: 'Estado de la tarea',
              default: 'pendiente'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            }
          },
          required: ['id', 'title', 'estado', 'createdAt']
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identificador único del usuario'
            },
            name: {
              type: 'string',
              description: 'Nombre del usuario'
            },
            lastname: {
              type: 'string',
              description: 'Apellido del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            }
          },
          required: ['id', 'name', 'lastname', 'email', 'createdAt']
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'UUID'
        }
      }
    }
  },
  apis: ['./src/index.js']
};