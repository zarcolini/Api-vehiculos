# 📖 API de Vehículos - Documentación Completa

## Tabla de Contenidos
- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Filtros de Campos (NEW)](#filtros-de-campos-new)
- [Endpoints GET](#endpoints-get)
- [Endpoints POST](#endpoints-post)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Códigos de Respuesta](#códigos-de-respuesta)
- [Troubleshooting](#troubleshooting)

---

## Información General

**Base URL:** `https://tu-api.com/api`  
**Formato:** JSON  
**Codificación:** UTF-8  

### Características
- ✅ Filtros dinámicos de búsqueda
- ✅ Selección de campos específicos (`fields`)
- ✅ Límite de resultados (`max_results`)
- ✅ Búsquedas parciales con LIKE
- ✅ Filtros de rango (mínimo/máximo)
- ✅ Arrays de IDs múltiples

---

## Autenticación

Todos los endpoints requieren autenticación mediante **Bearer Token**:

```http
Authorization: Bearer TU_MASTER_API_KEY
Content-Type: application/json
```

**Ejemplo cURL:**
```bash
curl -X POST "https://tu-api.com/api/productos/search" \
  -H "Authorization: Bearer cc03a6ab-18c5-4ba9-ac33-8068d9d1df7b" \
  -H "Content-Type: application/json" \
  -d '{"marca": "Toyota"}'
```

---

## Filtros de Campos (NEW)

Todas las funciones de búsqueda soportan el parámetro `fields` para seleccionar columnas específicas:

### Sintaxis
```json
{
  "marca": "Toyota",
  "fields": ["id", "nombre", "precio_venta", "km"],
  "max_results": 10
}
```

### Campos Disponibles - Productos
```json
[
  "id", "codigo_alterno", "nombre", "marca", "modelo", "anio", 
  "color", "precio_venta", "precio_costo", "km", "tipo_vehiculo",
  "motor", "cilindrada", "serie", "chasis", "placa", "habilitado",
  "congelado", "item_venta", "item_compra", "item_inventario"
]
```

### Campos Disponibles - Ventas
```json
[
  "id", "id_producto", "precio_venta", "kilometraje", "trasmision",
  "id_estado", "id_tienda", "fecha_vendido", "fecha_creacion"
]
```

### Beneficios
- 🚀 **Respuestas más rápidas** - Solo transfiere datos necesarios
- 💾 **Menor ancho de banda** - Reduce el tamaño de respuesta
- 📱 **Optimizado para móviles** - Perfecto para apps móviles

---

## Endpoints GET

### 1. Salud del Servidor
```http
GET /api/health
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2024-12-14T10:30:00Z",
  "uptime": 3600
}
```

### 2. Listar Tablas
```http
GET /api/tables
```

**Respuesta:**
```json
{
  "status": "success",
  "count": 4,
  "data": {
    "tables": ["producto", "ventas", "estados", "usuarios"]
  }
}
```

### 3. Estadísticas de Ventas
```http
GET /api/productos/estadisticas-ventas
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "total_productos": 1250,
    "productos_vendidos": 856,
    "productos_disponibles": 394,
    "porcentaje_vendidos": "68.48%"
  }
}
```

---

## Endpoints POST

### 4. Estructura de Tabla
```http
POST /api/table-structure
```

**Body:**
```json
{ "tableName": "producto" }
```

**Respuesta:**
```json
{
  "status": "success",
  "tableName": "producto",
  "fieldsCount": 25,
  "data": {
    "structure": [
      {
        "field": "id",
        "type": "int",
        "null": "NO",
        "key": "PRI"
      }
    ]
  }
}
```

### 5. Buscar Productos
```http
POST /api/productos/search
```

#### Ejemplos de Búsqueda

**Todos los productos:**
```json
{}
```

**Por ID específico:**
```json
{ "id": 14034 }
```

**Por múltiples IDs:**
```json
{ "ids": [14034, 15672, 16890] }
```

**Búsqueda avanzada:**
```json
{
  "marca": "Toyota",
  "tipo_vehiculo": "Pick up",
  "anio_desde": "2020",
  "anio_hasta": "2024",
  "precio_venta_maximo": 500000,
  "km_maximo": 50000,
  "habilitado": 1,
  "fields": ["id", "nombre", "marca", "precio_venta", "km"],
  "max_results": 20
}
```

#### Campos de Búsqueda - Productos
| Campo | Operador | Ejemplo | Descripción |
|-------|----------|---------|-------------|
| `id` | `=` | `{"id": 14034}` | ID exacto |
| `ids` | `IN` | `{"ids": [1,2,3]}` | Múltiples IDs |
| `marca` | `LIKE` | `{"marca": "Toyota"}` | Búsqueda parcial |
| `anio` | `=` | `{"anio": "2024"}` | Año exacto |
| `anio_desde` | `>=` | `{"anio_desde": "2020"}` | Desde año |
| `anio_hasta` | `<=` | `{"anio_hasta": "2024"}` | Hasta año |
| `precio_venta_minimo` | `>=` | `{"precio_venta_minimo": 100000}` | Precio mínimo |
| `precio_venta_maximo` | `<=` | `{"precio_venta_maximo": 500000}` | Precio máximo |
| `km_maximo` | `<=` | `{"km_maximo": 50000}` | Kilometraje máximo |

### 6. Productos Disponibles
```http
POST /api/productos/disponibles
```

**Todos los disponibles:**
```json
{}
```

**Con filtros:**
```json
{
  "marca": "Toyota",
  "modelo": "Hilux",
  "anio": "2024",
  "precio_venta_maximo": 600000,
  "fields": ["id", "nombre", "precio_venta", "km", "estado_venta"],
  "max_results": 15
}
```

### 7. Productos Vendidos
```http
POST /api/productos/vendidos
```

**Con filtros de fecha:**
```json
{
  "marca": "Nissan",
  "fecha_venta_desde": "2024-01-01",
  "fecha_venta_hasta": "2024-12-31",
  "fields": ["id", "nombre", "precio_vendido", "fecha_venta"],
  "max_results": 25
}
```

### 8. Estado de Venta
```http
POST /api/productos/estado-venta
```

**Por ID:**
```json
{ "id": 14034 }
```

**Por estado:**
```json
{ "estado_venta": "Disponible" }
```

**Estados válidos:**
- `"Vendido"`
- `"Disponible"` 
- `"Congelado"`
- `"Deshabilitado"`
- `"No disponible para venta"`

### 9. Buscar Ventas
```http
POST /api/ventas/search
```

**Todas las ventas:**
```json
{}
```

**Por producto:**
```json
{
  "producto_id": 14034,
  "fields": ["id", "precio_venta", "fecha_vendido"],
  "max_results": 10
}
```

**Por rango de fechas:**
```json
{
  "fecha_desde": "2024-01-01",
  "fecha_hasta": "2024-12-31",
  "precio_minimo": 100000,
  "fields": ["id", "id_producto", "precio_venta", "fecha_vendido"]
}
```

---

## Ejemplos Prácticos

### Caso 1: Buscar Toyota Hilux 2024 para WhatsApp

```json
{
  "marca": "Toyota",
  "nombre": "Hilux",
  "anio": "2024",
  "habilitado": 1,
  "fields": [
    "id", "nombre", "marca", "modelo", "anio", 
    "color", "precio_venta", "km", "motor", "cilindrada"
  ],
  "max_results": 5
}
```

### Caso 2: Vehículos Disponibles de Bajo Kilometraje

```json
{
  "km_maximo": 10000,
  "item_venta": 1,
  "habilitado": 1,
  "congelado": 0,
  "fields": ["id", "nombre", "marca", "km", "precio_venta"],
  "max_results": 20
}
```

### Caso 3: Análisis de Ventas del Mes

```json
{
  "fecha_desde": "2024-12-01",
  "fecha_hasta": "2024-12-31",
  "fields": ["id", "id_producto", "precio_venta", "fecha_vendido", "id_estado"],
  "max_results": 100
}
```

### Caso 4: Verificar Disponibilidad por Serie

```json
{
  "serie": "LVAV2MBB2RC001224",
  "fields": ["id", "nombre", "habilitado", "congelado", "item_venta"]
}
```

---

## Códigos de Respuesta

### Respuestas Exitosas

**200 - Success:**
```json
{
  "status": "success",
  "count": 5,
  "data": [...],
  "limited": true,
  "max_results_applied": 10,
  "fields_selected": ["id", "nombre", "precio_venta"]
}
```

**404 - No encontrado:**
```json
{
  "status": "fail",
  "message": "No se encontraron productos con los criterios especificados."
}
```

### Respuestas de Error

**400 - Bad Request:**
```json
{
  "status": "error",
  "message": "JSON malformado. Verifique la sintaxis.",
  "received_data": "{ marca: Toyota, }"
}
```

**401 - Unauthorized:**
```json
{
  "status": "error",
  "message": "Token de autorización inválido"
}
```

**500 - Server Error:**
```json
{
  "status": "error",
  "message": "Error interno del servidor"
}
```

---

## Troubleshooting

### Problemas Comunes

#### 1. Error 415 - Content-Type
**Problema:** `Unsupported Media Type`  
**Solución:** Agregar header `Content-Type: application/json`

#### 2. Error 400 - JSON Malformado
**Problema:** 
```json
{ marca: "Toyota", precio_venta:, }
```

**Solución:**
```json
{ "marca": "Toyota", "precio_venta": null }
```

#### 3. Error 401 - Sin Autorización
**Problema:** Token faltante o inválido  
**Solución:** Verificar el Bearer Token en headers

#### 4. Error 404 - Sin Resultados
**Problema:** Filtros muy restrictivos  
**Solución:** Ampliar criterios de búsqueda o usar `{}`

### Tips de Optimización

1. **Use `fields`** para reducir el tamaño de respuesta
2. **Use `max_results`** para limitar resultados
3. **Combine filtros** para búsquedas específicas
4. **Use arrays de IDs** para consultas múltiples eficientes

### Formato de Fechas
- **Formato:** `YYYY-MM-DD`
- **Ejemplo:** `"2024-12-14"`
- **Zona horaria:** UTC

### Valores Booleanos
- **Verdadero:** `1` o `true`
- **Falso:** `0` o `false`

---

## Resumen de Endpoints

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Estado del servidor | ❌ |
| `GET` | `/api/tables` | Lista tablas | ❌ |
| `GET` | `/api/productos/estadisticas-ventas` | Estadísticas | ❌ |
| `POST` | `/api/table-structure` | Estructura tabla | `{"tableName": "..."}` |
| `POST` | `/api/productos/search` | Buscar productos | `{}` + filtros |
| `POST` | `/api/productos/disponibles` | Productos disponibles | `{}` + filtros |
| `POST` | `/api/productos/vendidos` | Productos vendidos | `{}` + filtros |
| `POST` | `/api/productos/estado-venta` | Estado productos | filtros requeridos |
| `POST` | `/api/ventas/search` | Buscar ventas | `{}` + filtros |

---

**Versión:** 2.0