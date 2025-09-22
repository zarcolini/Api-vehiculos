# 📚 Documentación API - Sistema de Inventario y Ventas

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [Configuración Inicial](#configuración-inicial)
- [Autenticación](#autenticación)
- [Endpoints Disponibles](#endpoints-disponibles)
- [Modelos de Datos](#modelos-de-datos)
- [Códigos de Estado](#códigos-de-estado)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Manejo de Errores](#manejo-de-errores)

---

## 🎯 Introducción

API RESTful desarrollada con Node.js y Express para la gestión de inventario de vehículos y registro de ventas. Utiliza MariaDB/MySQL como base de datos y implementa autenticación mediante Bearer Token.

### Características Principales

- ✅ Búsqueda dinámica con múltiples filtros
- ✅ Selección de campos específicos en respuestas
- ✅ Paginación de resultados
- ✅ Gestión de imágenes asociadas a ventas
- ✅ Validación automática de datos
- ✅ Manejo robusto de errores
- ✅ Logging detallado de operaciones

### Stack Tecnológico

- **Runtime:** Node.js
- **Framework:** Express.js
- **Base de Datos:** MariaDB/MySQL
- **Autenticación:** Bearer Token
- **ORM:** mysql2/promise

---

## ⚙️ Configuración Inicial

### Variables de Entorno Requeridas

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de Datos
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_DATABASE=nombre_base_datos
DB_PORT=3306

# Seguridad
MASTER_API_KEY=tu_clave_secreta_aqui

# Servidor
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# CORS (opcional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Instalación

```bash
# Clonar repositorio
git clone [url-repositorio]

# Instalar dependencias
npm install

# Iniciar servidor
npm start

# Modo desarrollo
npm run dev
```

---

## 🔐 Autenticación

La API utiliza autenticación mediante **Bearer Token**. Todas las rutas protegidas requieren el token en el header de autorización.

### Formato del Header

```http
Authorization: Bearer [MASTER_API_KEY]
```

### Ejemplo con cURL

```bash
curl -X POST http://localhost:3000/api/productos/search \
  -H "Authorization: Bearer tu_master_api_key" \
  -H "Content-Type: application/json" \
  -d '{"marca": "Toyota"}'
```

### Respuesta sin Autenticación

```json
{
  "status": "error",
  "message": "Token de autorización inválido"
}
```

---

## 🚀 Endpoints Disponibles

### Resumen de Endpoints

| Método | Endpoint                      | Descripción         | Autenticación |
| ------ | ----------------------------- | ------------------- | ------------- |
| GET    | `/api/health`                 | Estado del servidor | No            |
| GET    | `/api/system/tables`          | Listar tablas BD    | No            |
| POST   | `/api/system/table-structure` | Estructura de tabla | No            |
| POST   | `/api/productos/search`       | Buscar productos    | Sí            |
| POST   | `/api/ventas/search`          | Buscar ventas       | Sí            |

---

## 📦 1. Health Check

### `GET /api/health`

Verifica el estado del servidor.

**Autenticación:** No requerida

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## 🗄️ 2. Endpoints del Sistema

### `GET /api/system/tables`

Lista todas las tablas disponibles en la base de datos.

**Autenticación:** No requerida

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "count": 5,
  "data": {
    "tables": ["producto", "ventas", "ventas_fotos", "estados", "usuarios"],
    "details": [...]
  }
}
```

### `POST /api/system/table-structure`

Obtiene la estructura de una tabla específica.

**Autenticación:** No requerida

**Body:**

```json
{
  "tableName": "producto"
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "tableName": "producto",
  "fieldsCount": 30,
  "data": {
    "structure": [
      {
        "field": "id",
        "type": "int(11)",
        "null": "NO",
        "key": "PRI",
        "default": null,
        "extra": "auto_increment"
      },
      {
        "field": "nombre",
        "type": "varchar(255)",
        "null": "YES",
        "key": "",
        "default": null,
        "extra": ""
      }
    ]
  }
}
```

---

## 🚗 3. Endpoints de Productos

### `POST /api/productos/search`

Búsqueda avanzada de productos con múltiples filtros opcionales.

**Autenticación:** Requerida (Bearer Token)

**Parámetros del Body:**

| Parámetro             | Tipo    | Descripción                            | Ejemplo                            |
| --------------------- | ------- | -------------------------------------- | ---------------------------------- |
| `id`                  | number  | ID específico del producto             | `123`                              |
| `ids`                 | array   | Lista de IDs de productos              | `[1, 2, 3]`                        |
| `codigo_alterno`      | string  | Código alterno (búsqueda parcial)      | `"ALT-001"`                        |
| `nombre`              | string  | Nombre del producto (búsqueda parcial) | `"Moto"`                           |
| `marca`               | string  | Marca del vehículo                     | `"Honda"`                          |
| `modelo`              | string  | Modelo del vehículo                    | `"Civic"`                          |
| `anio`                | number  | Año exacto                             | `2020`                             |
| `anio_desde`          | number  | Año mínimo                             | `2018`                             |
| `anio_hasta`          | number  | Año máximo                             | `2022`                             |
| `color`               | string  | Color del vehículo                     | `"Rojo"`                           |
| `placa`               | string  | Número de placa                        | `"ABC-123"`                        |
| `precio_venta_minimo` | number  | Precio mínimo de venta                 | `10000`                            |
| `precio_venta_maximo` | number  | Precio máximo de venta                 | `25000`                            |
| `km_minimo`           | number  | Kilometraje mínimo                     | `0`                                |
| `km_maximo`           | number  | Kilometraje máximo                     | `50000`                            |
| `habilitado`          | boolean | Estado habilitado                      | `true`                             |
| `item_venta`          | boolean | Disponible para venta                  | `true`                             |
| `max_results`         | number  | Límite de resultados                   | `10`                               |
| `fields`              | array   | Campos específicos a retornar          | `["id", "nombre", "precio_venta"]` |

**Ejemplo de Solicitud:**

```json
{
  "marca": "Honda",
  "anio_desde": 2020,
  "precio_venta_maximo": 30000,
  "habilitado": true,
  "max_results": 5,
  "fields": ["id", "nombre", "marca", "modelo", "anio", "precio_venta", "km"]
}
```

**Respuesta Exitosa (200):**

```json
{
  "status": "success",
  "count": 3,
  "data": [
    {
      "id": 101,
      "nombre": "Honda CR-V EX",
      "marca": "Honda",
      "modelo": "CR-V",
      "anio": 2021,
      "precio_venta": 28500,
      "km": 15000
    },
    {
      "id": 102,
      "nombre": "Honda Civic Sport",
      "marca": "Honda",
      "modelo": "Civic",
      "anio": 2020,
      "precio_venta": 22000,
      "km": 25000
    }
  ],
  "limited": true,
  "max_results_applied": 5,
  "fields_selected": [
    "id",
    "nombre",
    "marca",
    "modelo",
    "anio",
    "precio_venta",
    "km"
  ]
}
```

### Campos Disponibles para Productos

```javascript
[
  "id",
  "codigo_alterno",
  "nombre",
  "codigo_grupo",
  "habilitado",
  "congelado",
  "item_compra",
  "item_venta",
  "item_inventario",
  "codigo_hertz",
  "tipo",
  "tipo_sap",
  "marca",
  "anio",
  "modelo",
  "color",
  "cilindrada",
  "serie",
  "motor",
  "placa",
  "tipo_vehiculo",
  "chasis",
  "precio_costo",
  "precio_venta",
  "km",
  "k5",
  "k10",
  "k20",
  "k40",
  "k100",
  "sincronizado",
  "horas",
  "tipo_mant",
  "clase",
];
```

---

## 💰 4. Endpoints de Ventas

### `POST /api/ventas/search`

Búsqueda de ventas con opción de incluir información de fotos asociadas.

**Autenticación:** Requerida (Bearer Token)

**Parámetros del Body:**

| Parámetro        | Tipo    | Descripción                  | Ejemplo                            |
| ---------------- | ------- | ---------------------------- | ---------------------------------- |
| `id`             | number  | ID de la venta               | `456`                              |
| `ids`            | array   | Lista de IDs de ventas       | `[4, 5, 6]`                        |
| `producto_id`    | number  | ID del producto vendido      | `101`                              |
| `productos_ids`  | array   | Lista de IDs de productos    | `[101, 102]`                       |
| `numero`         | string  | Número de venta              | `"V-2024-001"`                     |
| `id_vendedor`    | number  | ID del vendedor              | `10`                               |
| `precio_minimo`  | number  | Precio mínimo de venta       | `15000`                            |
| `precio_maximo`  | number  | Precio máximo de venta       | `30000`                            |
| `fecha`          | string  | Fecha específica             | `"2024-01-15"`                     |
| `fecha_desde`    | string  | Fecha inicial                | `"2024-01-01"`                     |
| `fecha_hasta`    | string  | Fecha final                  | `"2024-01-31"`                     |
| `include_photos` | boolean | Incluir información de fotos | `true`                             |
| `max_results`    | number  | Límite de resultados         | `20`                               |
| `fields`         | array   | Campos a retornar            | `["id", "numero", "precio_venta"]` |

**Ejemplo de Solicitud con Fotos:**

```json
{
  "fecha_desde": "2024-01-01",
  "fecha_hasta": "2024-01-31",
  "include_photos": true,
  "max_results": 10,
  "fields": [
    "id",
    "numero",
    "id_producto",
    "precio_venta",
    "fecha",
    "id_vendedor"
  ]
}
```

**Respuesta con Fotos (200):**

```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": 456,
      "numero": "V-2024-001",
      "id_producto": 101,
      "precio_venta": 28500,
      "fecha": "2024-01-15",
      "id_vendedor": 10,
      "imagenes": {
        "total": 3,
        "foto_principal": "venta_456_principal.jpg",
        "fotos_adicionales": "venta_456_interior.jpg, venta_456_motor.jpg"
      }
    },
    {
      "id": 457,
      "numero": "V-2024-002",
      "id_producto": 102,
      "precio_venta": 22000,
      "fecha": "2024-01-20",
      "id_vendedor": 11,
      "imagenes": {
        "total": 0,
        "foto_principal": null,
        "fotos_adicionales": ""
      }
    }
  ],
  "limited": true,
  "max_results_applied": 10,
  "fields_selected": [
    "id",
    "numero",
    "id_producto",
    "precio_venta",
    "fecha",
    "id_vendedor"
  ],
  "photos_included": true,
  "photos_note": "Imágenes incluidas con estructura simple"
}
```

### Campos Disponibles para Ventas

```javascript
[
  "id",
  "numero",
  "id_usuario",
  "id_tienda",
  "id_estado",
  "id_producto",
  "kilometraje",
  "cilindraje",
  "trasmision",
  "precio_minimo",
  "precio_maximo",
  "precio_venta",
  "fecha",
  "hora",
  "fecha_vendido",
  "fecha_negociacion",
  "fecha_asignacion",
  "fecha_reparacion_completada",
  "fecha_promesa",
  "id_vendedor",
  "id_televentas",
  "id_impuesto",
  "id_factura",
  "foto",
  "id_inspeccion",
  "id_estado_pintura",
  "id_estado_interior",
  "id_estado_mecanica",
  "tipo_ventas_reparacion",
  "reproceso",
  "observaciones",
  "observaciones_reparacion",
  "fecha_creacion",
  "usuario_creacion",
  "fecha_modificacion",
  "usuario_modificacion",
];
```

---

## 📊 Modelos de Datos

### Estructura de Producto

```typescript
interface Producto {
  id: number;
  codigo_alterno?: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  color?: string;
  cilindrada?: string;
  serie?: string;
  motor?: string;
  placa?: string;
  tipo_vehiculo?: string;
  chasis?: string;
  precio_costo?: number;
  precio_venta?: number;
  km?: number;
  habilitado: boolean;
  item_venta: boolean;
  // ... más campos
}
```

### Estructura de Venta

```typescript
interface Venta {
  id: number;
  numero: string;
  id_producto: number;
  id_vendedor?: number;
  precio_venta: number;
  fecha: string;
  fecha_vendido?: string;
  observaciones?: string;
  imagenes?: {
    total: number;
    foto_principal: string | null;
    fotos_adicionales: string;
  };
  // ... más campos
}
```

---

## 🔴 Códigos de Estado HTTP

| Código  | Descripción            | Uso en la API                              |
| ------- | ---------------------- | ------------------------------------------ |
| **200** | OK                     | Solicitud exitosa                          |
| **400** | Bad Request            | JSON malformado o parámetros inválidos     |
| **401** | Unauthorized           | Token de autenticación inválido o faltante |
| **404** | Not Found              | Recurso no encontrado                      |
| **415** | Unsupported Media Type | Content-Type no soportado                  |
| **500** | Internal Server Error  | Error del servidor                         |

---

## 💡 Ejemplos de Uso

### JavaScript/Node.js

```javascript
const axios = require("axios");

const API_URL = "http://localhost:3000/api";
const API_KEY = "tu_master_api_key";

// Buscar productos Honda del 2020 en adelante
async function buscarProductosHonda() {
  try {
    const response = await axios.post(
      `${API_URL}/productos/search`,
      {
        marca: "Honda",
        anio_desde: 2020,
        habilitado: true,
        max_results: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Encontrados: ${response.data.count} productos`);
    return response.data.data;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

// Buscar ventas del mes con fotos
async function buscarVentasDelMes() {
  const fechaInicio = new Date();
  fechaInicio.setDate(1);

  const fechaFin = new Date();
  fechaFin.setMonth(fechaFin.getMonth() + 1);
  fechaFin.setDate(0);

  try {
    const response = await axios.post(
      `${API_URL}/ventas/search`,
      {
        fecha_desde: fechaInicio.toISOString().split("T")[0],
        fecha_hasta: fechaFin.toISOString().split("T")[0],
        include_photos: true,
        fields: ["id", "numero", "precio_venta", "fecha", "id_vendedor"],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}
```

### Python

```python
import requests
from datetime import datetime

API_URL = "http://localhost:3000/api"
API_KEY = "tu_master_api_key"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def buscar_productos_por_precio(precio_min, precio_max):
    """Busca productos en un rango de precio"""

    payload = {
        "precio_venta_minimo": precio_min,
        "precio_venta_maximo": precio_max,
        "habilitado": True,
        "item_venta": True,
        "fields": ["id", "nombre", "marca", "modelo", "precio_venta"],
        "max_results": 20
    }

    response = requests.post(
        f"{API_URL}/productos/search",
        json=payload,
        headers=headers
    )

    if response.status_code == 200:
        data = response.json()
        print(f"Productos encontrados: {data['count']}")
        return data['data']
    else:
        print(f"Error: {response.json()}")
        return None

# Ejemplo de uso
productos = buscar_productos_por_precio(15000, 30000)
for producto in productos:
    print(f"{producto['nombre']} - ${producto['precio_venta']}")
```

### cURL

```bash
# Buscar todos los productos Toyota
curl -X POST http://localhost:3000/api/productos/search \
  -H "Authorization: Bearer tu_master_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Toyota",
    "habilitado": true
  }'

# Buscar ventas recientes con fotos
curl -X POST http://localhost:3000/api/ventas/search \
  -H "Authorization: Bearer tu_master_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_desde": "2024-01-01",
    "include_photos": true,
    "max_results": 5
  }'

# Obtener estructura de la tabla producto
curl -X POST http://localhost:3000/api/system/table-structure \
  -H "Content-Type: application/json" \
  -d '{"tableName": "producto"}'
```

---

## ⚠️ Manejo de Errores

### Estructura de Error Estándar

```json
{
  "status": "error",
  "message": "Descripción del error",
  "error_details": "Detalles adicionales (solo en desarrollo)",
  "code": "ERROR_CODE"
}
```

### Errores Comunes

#### JSON Malformado

```json
{
  "status": "error",
  "message": "JSON malformado. Verifique la sintaxis.",
  "error_details": "Unexpected token } in JSON at position 45",
  "received_data": "{\"marca\": \"Honda\",}"
}
```

#### Autenticación Fallida

```json
{
  "status": "error",
  "message": "Token de autorización inválido"
}
```

#### Sin Resultados

```json
{
  "status": "fail",
  "message": "No se encontraron productos con los criterios especificados."
}
```

#### Error de Base de Datos

```json
{
  "status": "error",
  "message": "Error de base de datos",
  "code": "ER_ACCESS_DENIED"
}
```

---

## 🚀 Mejores Prácticas

### 1. Optimización de Consultas

- Usa `fields` para solicitar solo los campos necesarios
- Aplica `max_results` para limitar la cantidad de datos
- Utiliza filtros específicos para reducir el dataset

### 2. Manejo de Errores

```javascript
try {
  const response = await fetch(url, options);
  const data = await response.json();

  if (response.ok) {
    // Procesar datos exitosos
  } else {
    // Manejar error según el código de estado
    switch (response.status) {
      case 401:
        console.error("Token inválido");
        break;
      case 404:
        console.error("No se encontraron resultados");
        break;
      default:
        console.error("Error:", data.message);
    }
  }
} catch (error) {
  console.error("Error de red:", error);
}
```

### 3. Cacheo de Respuestas

Considera implementar caché del lado del cliente para consultas frecuentes:

```javascript
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function buscarConCache(endpoint, payload) {
  const cacheKey = `${endpoint}_${JSON.stringify(payload)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFromAPI(endpoint, payload);
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  return data;Markdown All in One
}
```