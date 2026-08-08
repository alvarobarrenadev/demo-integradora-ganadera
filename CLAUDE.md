## 1. Objetivo del proyecto

Construir una demo funcional de un sistema de gestión centralizado para la empresa ficticia **Agroganadera Valdeón SL**, una integradora porcina que actualmente trabaja con múltiples Excel, correo, PDFs, papel y procesos manuales duplicados.

El objetivo principal del sistema es que:

> Cada dato se introduzca una sola vez y se propague automáticamente a todos los módulos afectados.

La aplicación debe sentirse como un producto real:

- navegable;
- con datos precargados;
- con acciones funcionales;
- con cálculos reales sobre los datos mock;
- con buen UX/UI;
- sin integraciones externas reales.

Este proyecto es una **demo técnica con plazo de 7 días**, no un ERP de producción.

---

# 2. Criterio principal de éxito

El siguiente flujo debe funcionar de principio a fin:

1. Pulsar `Simular factura entrante`.
2. Revisar los datos extraídos.
3. Validar la factura.
4. Verla automáticamente en Tesorería.
5. Ver el consumo añadido automáticamente a la ceba `V-118`.
6. Cerrar la ceba `V-118`.
7. Generar la liquidación del integrado `#14`.
8. Ver el pago de la liquidación en la previsión semanal.

Objetivo:

```text
8 clics
0 tecleo
```

Este flujo tiene prioridad absoluta sobre funcionalidades secundarias.

---

# 3. Stack tecnológico

Usar:

```text
React
Vite
TypeScript
React Router
Zustand
Zustand persist
Sass (arquitectura 7-1 existente en src/sass/ — no SCSS Modules, ver nota abajo)
Recharts
Vitest
localStorage
pnpm
Vercel
```

> Nota de implementación aprobada: el repositorio ya incluye un scaffold Sass 7-1 en `src/sass/` (abstracts/base/components/layout/pages/themes/vendors). Esa estructura sustituye a "SCSS Modules" para este proyecto — no se usan ambos sistemas a la vez.

## No usar

No añadir salvo que el usuario cambie explícitamente el alcance:

```text
Next.js
Express
NestJS
PostgreSQL
Supabase
Firebase
Redux
Prisma
autenticación real
OCR real
correo real
WhatsApp real
integraciones bancarias
multi-tenant
microservicios
```

No existe necesidad de backend para esta prueba.

Todos los comportamientos externos deben simularse.

---

# 4. Principios de arquitectura

## 4.1 Separar negocio de interfaz

Las reglas de negocio nunca deben implementarse directamente dentro de componentes React.

Incorrecto:

```tsx
<button
  onClick={() => {
    const conversion = feedKg / (exitKg - entryKg)
    // más lógica...
  }}
>
  Cerrar
</button>
```

Correcto:

```ts
const conversion = calculateConversion(ceba)
```

Toda regla importante debe vivir en:

```text
src/domain/
```

---

## 4.2 Una única fuente de verdad

Usar Zustand como estado global mutable.

No mantener copias independientes de:

- facturas;
- pagos;
- cebas;
- tarifas;
- integrados;
- liquidaciones.

Cuando un dato pueda calcularse a partir del estado, preferir un selector.

---

## 4.3 Relaciones mediante IDs

Evitar duplicar objetos completos.

Preferir:

```ts
interface Invoice {
  providerId: string
  integratedId?: number
}
```

en lugar de:

```ts
interface Invoice {
  provider: Provider
  integrated: Integrated
}
```

---

# 5. Estructura recomendada

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
│
├── components/
│   ├── layout/
│   ├── common/
│   ├── dashboard/
│   ├── invoices/
│   ├── treasury/
│   ├── feed/
│   ├── cebas/
│   ├── logistics/
│   └── masters/
│
├── pages/
│   ├── DashboardPage.tsx
│   ├── InvoicesPage.tsx
│   ├── InvoiceDetailPage.tsx
│   ├── TreasuryPage.tsx
│   ├── FeedPage.tsx
│   ├── TariffsPage.tsx
│   ├── CebasPage.tsx
│   ├── CebaDetailPage.tsx
│   ├── LogisticsPage.tsx
│   ├── IntegratedsPage.tsx
│   ├── IntegratedDetailPage.tsx
│   ├── ProvidersPage.tsx
│   └── AccountingPage.tsx
│
├── domain/
│   ├── invoices.ts
│   ├── tariffs.ts
│   ├── feed.ts
│   ├── cebas.ts
│   ├── settlements.ts
│   ├── treasury.ts
│   ├── logistics.ts
│   └── dvr.ts
│
├── store/
│   ├── useAppStore.ts
│   ├── selectors.ts
│   └── initialState.ts
│
├── data/
│   └── seeds/
│       ├── providers.ts
│       ├── tariffs.ts
│       ├── integrateds.ts
│       ├── invoices.ts
│       ├── clients.ts
│       ├── cebas.ts
│       ├── logistics.ts
│       └── index.ts
│
├── types/
│   ├── provider.ts
│   ├── tariff.ts
│   ├── integrated.ts
│   ├── invoice.ts
│   ├── treasury.ts
│   ├── ceba.ts
│   ├── settlement.ts
│   ├── logistics.ts
│   └── common.ts
│
├── utils/
│   ├── dates.ts
│   ├── currency.ts
│   ├── numbers.ts
│   └── ids.ts
│
└── sass/                     # existing 7-1 architecture — see note under §3
    ├── abstracts/ (variables, mixins, functions, placeholders)
    ├── base/ (reset, typography, animations)
    ├── components/
    ├── layout/
    ├── pages/
    ├── themes/
    ├── vendors/
    └── main.scss
```

---

# 6. Rutas principales

Implementar como mínimo:

```text
/
/facturas
/facturas/:id
/tesoreria
/pienso
/pienso/tarifas
/cebas
/cebas/:id
/logistica
/integrados
/integrados/:id
/proveedores
/contabilidad
```

---

# 7. Tipos principales

## Provider

```ts
export interface Provider {
  id: string
  name: string
  category: "feed" | "medication"
  freightRatePerKg: number
}
```

---

## FeedTariff

```ts
export interface FeedTariff {
  id: string
  providerId: string
  feedType: string
  month: string
  pricePerKg: number
}
```

`month` debe almacenarse como:

```text
YYYY-MM
```

---

## Integrated

```ts
export interface Integrated {
  id: number
  name: string
  location: string
  cea: string
  capacity: number

  feedProviderId: string

  dvrRenewalDate: string
  welfareCertified: boolean

  controller: string
  veterinaryUnit: string

  dni: string
  email: string
  phone: string

  pricePerPig: number
  billingDay: number

  activeCebaId?: string
}
```

---

## Invoice

```ts
export type InvoiceStatus =
  | "pending"
  | "validated"
  | "discrepancy"

export interface Invoice {
  id: string

  internalNumber: string
  supplierInvoiceNumber: string

  providerId: string
  integratedId?: number

  date: string
  receivedAt: string

  feedType?: string
  kg?: number

  invoicedPricePerKg?: number
  expectedPricePerKg?: number

  freight: number
  total: number

  dueDate: string

  paymentMethod: string
  bankId?: string

  status: InvoiceStatus

  sentToAccounting: boolean
  archived: boolean
}
```

---

## Ceba

```ts
export type CebaStatus =
  | "active"
  | "ready_to_close"
  | "closed"

export interface Ceba {
  id: string
  integratedId: number

  origin: string

  entryDate: string

  animalsEntered: number
  entryKg: number

  animalsExited: number
  exitKg: number

  feedKg: number
  feedCost: number

  medicationCost: number

  deaths: number

  status: CebaStatus

  closeDate?: string
}
```

---

## Payment

```ts
export type PaymentStatus =
  | "pending"
  | "paid"
  | "overdue"

export interface Payment {
  id: string

  sourceType: "invoice" | "settlement"
  sourceId: string

  beneficiary: string

  amount: number
  dueDate: string

  paymentMethod: string
  bankId?: string

  status: PaymentStatus
}
```

---

## Settlement

```ts
export interface Settlement {
  id: string

  cebaId: string
  integratedId: number

  pigs: number
  conversion: number

  baseAmount: number

  bonusPerPig: number
  bonusAmount: number

  grossAmount: number

  retentionRate: number
  retentionAmount: number

  netAmount: number

  generatedAt: string
}
```

---

# 8. Reglas de negocio obligatorias

Estas reglas deben implementarse exactamente.

---

## 8.1 Numeración interna de facturas

Formato:

```text
{mes}{correlativo:03d}
```

Ejemplos:

```text
7090
8001
5211
```

Reglas:

- usar el mes de la fecha de factura;
- NO usar el mes en que llega;
- el correlativo es el último número usado de ese mes + 1;
- una factura de mayo recibida en julio sigue siendo `5xxx`;
- si no existe ninguna factura de agosto, la primera será `8001`.

Función canónica:

```ts
generateInternalInvoiceNumber(
  invoiceDate,
  invoices
)
```

No duplicar esta lógica.

---

# 8.2 Integrado → proveedor → pienso → tarifa

Cada integrado tiene asignado un proveedor de pienso.

Flujo:

```text
integrado
    ↓
proveedor asignado
    ↓
tipos de pienso del proveedor
    ↓
tarifa correspondiente al mes de la factura
```

Función:

```ts
getApplicableTariff(
  providerId,
  feedType,
  invoiceDate,
  tariffs
)
```

---

# 8.3 Porte

Solo cobran porte:

```text
P1
P2
P3
```

No cobran porte:

```text
P4
P5
```

Fórmula:

```text
porte = kg × tarifa_porte_proveedor
```

El porte no cambia cada mes.

Función:

```ts
calculateFreight(provider, kg)
```

---

# 8.4 Discrepancia de precio

Si:

```text
precio_facturado != tarifa_vigente
```

mostrar alerta.

Fórmula:

```text
diferencia_total =
kg × (precio_facturado - tarifa_vigente)
```

Caso obligatorio:

```text
Factura: 7090

kg = 24.600
precio facturado = 0,342
tarifa julio = 0,334

diferencia = +196,80 €
```

Debe mostrarse claramente como discrepancia.

---

# 8.5 Conversión de una ceba

Fórmula:

```text
conversión =
kg pienso / (kg salida - kg entrada)
```

Mostrar 2 decimales.

Función:

```ts
calculateConversion(ceba)
```

Controlar:

- ausencia de kg de salida;
- división por cero;
- engorde <= 0.

---

# 8.6 Liquidación de integrado

Base:

```text
cerdos salidos × 13,50 €
```

Prima:

```text
conversión <= 2,35
→ 1,20 €/cerdo

conversión <= 2,45
→ 0,90 €/cerdo

conversión > 2,45
→ 0 €/cerdo
```

Después:

```text
bruto = base + prima

retención = bruto × 0,02

neto = bruto - retención
```

Función:

```ts
calculateSettlement(ceba)
```

---

# 8.7 DVR

Mostrar aviso cuando queden menos de:

```text
30 días
```

para la renovación.

Función:

```ts
isDvrExpiringSoon(
  renewalDate,
  referenceDate
)
```

---

# 8.8 Propagación de una factura

Esta es una de las reglas más importantes del proyecto.

Al validar una factura de pienso:

```text
Factura
   ↓
estado = validada
   ↓
Tesorería
   ↓
nuevo pago
   ↓
Pienso
   ↓
nuevo consumo
   ↓
Ceba activa
   ↓
suma kg
suma coste
   ↓
Contabilidad
   ↓
enviada
   ↓
Archivo digital
```

Todo ocurre con una única acción:

```ts
validateInvoice(invoiceId)
```

No exigir al usuario que vuelva a introducir el dato en otro módulo.

---

## Factura de medicación

Al validar:

```text
Factura
   ↓
Tesorería
   ↓
Ceba activa
   ↓
suma coste de medicación
   ↓
Contabilidad
   ↓
Archivo
```

---

# 9. Estado global

Zustand debe almacenar como mínimo:

```ts
interface AppState {
  providers: Provider[]
  tariffs: FeedTariff[]

  integrateds: Integrated[]

  invoices: Invoice[]

  cebas: Ceba[]

  payments: Payment[]
  receivables: Receivable[]

  clients: Client[]

  logisticsMovements: LogisticsMovement[]

  settlements: Settlement[]
}
```

Acciones:

```ts
interface AppActions {
  resetDemo(): void

  simulateIncomingInvoice(): void

  validateInvoice(
    invoiceId: string
  ): void

  applyAugustTariffs(): void

  addCebaEntry(...args: unknown[]): void

  addCebaExit(...args: unknown[]): void

  closeCeba(
    cebaId: string
  ): void

  generateSettlement(
    cebaId: string
  ): Settlement

  addLogisticsMovement(
    ...args: unknown[]
  ): void
}
```

Sustituir los `unknown[]` por tipos adecuados al implementarlo.

---

# 10. Selectores

Crear selectores para datos derivados.

Ejemplos:

```ts
selectInvoicesThisMonth
selectPendingInvoices
selectPaymentsNext7Days
selectActiveCebas
selectAverageConversion
selectWeeklyCashForecast
selectDvrAlerts
selectPriceDiscrepancies
selectFeedExpenseByMonth
```

Evitar almacenar resultados derivados si pueden calcularse.

---

# 11. Persistencia

Usar:

```text
Zustand persist
+
localStorage
```

La aplicación debe conservar cambios después de recargar.

---

# 12. Reset de demo

Implementar:

```text
Restablecer demo
```

Debe:

1. borrar estado persistido;
2. recuperar los seeds originales;
3. permitir repetir el flujo completo.

Es una funcionalidad crítica para una demo técnica.

---

# 13. Módulos

## 13.1 Dashboard

Mostrar:

- resumen del día;
- facturas del mes;
- pendientes de validar;
- pagos próximos 7 días;
- cebas activas;
- conversión media;
- avisos;
- gráfico de gasto de pienso mensual.

Ejemplo:

```text
Han entrado 12 facturas,
11 cuadradas solas,
1 necesita revisión.
```

Avisos:

```text
discrepancia de precio
tarifa nueva
ceba lista para cierre
DVR próximo a caducar
bajas elevadas
```

Los KPIs deben calcularse desde el estado.

No hardcodearlos.

---

# 13.2 Bandeja de facturas

Este es el corazón operativo.

Debe incluir:

```text
Simular factura entrante
```

La simulación puede mostrar:

```text
Recibiendo factura...
Procesando documento...
Extrayendo datos...
Factura lista para revisión
```

Después debe aparecer en la bandeja.

---

## Tabla de facturas

Mostrar:

```text
Nº interno
Proveedor
Nº factura proveedor
Fecha
Integrado
Pienso
Kg
€/kg
Total
Vencimiento
Estado
```

---

## Buscador

Permitir buscar por:

```text
nº interno
proveedor
integrado
fecha
```

---

## Detalle de factura

Mostrar:

```text
PDF simulado

Proveedor
Nº factura
Fecha
Integrado
Pienso
Kg
Precio facturado
Tarifa esperada
Porte
Total
Vencimiento
Forma de pago
```

Acción:

```text
Validar factura
```

---

# 13.3 Tesorería

## Pagos

Mostrar:

```text
vencimiento
estado
banco
forma de pago
importe
origen
```

---

## Cobros

Mostrar:

```text
cliente
fecha
importe
forma de pago
estado
```

---

## Clientes

Mini CRM:

```text
cliente
método de pago
banco
media de días de cobro
```

---

## Previsión

Calcular desde:

```text
pagos
+
cobros
+
liquidaciones
```

Mostrar:

```text
calendario diario
previsión semanal
neto semanal
```

---

# 13.4 Pienso y tarifas

Mostrar:

```text
consumos por integrado
tarifas mensuales
histórico de tarifas
evolución de precios
portes
resumen por proveedor
resumen por integrado
kg
€
€/kg
comparativa mensual
resumen anual
comparativa año anterior
```

Acción simulada:

```text
Aplicar tarifa de agosto
```

Debe pedir confirmación.

---

# 13.5 Cebas

Debe mostrar:

```text
cebas cerradas
ceba activa
integrado
origen
entrada
salidas
kg entrada
kg salida
engorde
kg pienso
coste pienso
medicación
bajas
conversión
estado
```

---

## Cierre de ceba

Acción:

```text
Cerrar ceba
```

Debe:

```text
calcular resumen
marcar cerrada
guardar fecha cierre
generar/preparar liquidación
crear pago en tesorería
```

---

## Resumen global

Mostrar:

```text
ranking por conversión
comparativa entre cebas
origen del lechón × pienso
```

El objetivo es permitir descubrir qué combinaciones convierten mejor.

---

# 13.6 Integrados / maestros

Deben existir 40 integrados.

Campos:

```text
número
nombre
ubicación
CEA
plazas
proveedor de pienso
DVR
bienestar
controlador
unidad veterinaria
DNI
email
teléfono
precio/cerdo
día facturación
```

---

# 13.7 Proveedores

Mostrar:

```text
proveedor
tipo
cobra porte
€/kg porte
volumen aproximado
```

---

# 13.8 Logística

## Salidas

Campos:

```text
fecha
integrado
matadero
nº cerdos
kg
bienestar
tipo transporte
chofer
albarán
estado archivo
```

---

## Entradas

Campos:

```text
fecha
origen
nº lechones
kg
integrado destino
albarán
```

Una salida o entrada registrada en logística debe propagarse automáticamente a la ceba correspondiente.

---

# 14. Extras opcionales

Solo hacer después de completar todo lo obligatorio.

---

## Parser de WhatsApp

Caja de texto:

```text
Vienen de Casa Ezequiel
750 lechones
para Ismael Cuesta
con 14.600 kg
```

El sistema propone:

```text
origen
animales
integrado
kg
```

para confirmar.

No usar WhatsApp real.

---

## Exportación contable

Mostrar:

```text
mes
nº facturas
importe total
```

Botón:

```text
Descargar paquete
```

Puede ser una simulación.

---

## Roles

Opcional:

```text
Mario
→ admin

Dirección
→ solo lectura

Contable
→ exportaciones
```

No implementar autenticación real.

---

# 15. Datos seed obligatorios

## 15.1 Proveedores

```ts
[
  {
    id: "P1",
    name: "Piensos Norteña SA",
    category: "feed",
    freightRatePerKg: 0.087
  },
  {
    id: "P2",
    name: "NutriCampo SL",
    category: "feed",
    freightRatePerKg: 0.080
  },
  {
    id: "P3",
    name: "Piensos del Valle SL",
    category: "feed",
    freightRatePerKg: 0.075
  },
  {
    id: "P4",
    name: "AgroFeed Ibérica SL",
    category: "feed",
    freightRatePerKg: 0
  },
  {
    id: "P5",
    name: "VetSalud Distribución SL",
    category: "medication",
    freightRatePerKg: 0
  }
]
```

---

# 15.2 Tarifas

## Piensos Norteña

```text
Valdeón 30 Extra
junio: 0,331
julio: 0,334

Precebo Plus
junio: 0,405
julio: 0,400

Cebo Final
junio: 0,318
julio: 0,320
```

## NutriCampo

```text
Starter N-1
junio: 0,412
julio: 0,408

Cebo N-80
junio: 0,336
julio: 0,334
```

## Piensos del Valle

```text
Engorde V-60
junio: 0,329
julio: 0,331
```

## AgroFeed

```text
Precebo AF
junio: 0,398
julio: 0,398

Cebo AF-Max
junio: 0,325
julio: 0,327
```

## VetSalud

```text
Medicado M-2
junio: 0,512
julio: 0,512
```

---

# 15.3 Integrados suministrados

Usar exactamente estos y generar coherentemente hasta llegar a 40.

| Nº | Nombre | Ubicación | CEA | Plazas | Proveedor | DVR | Welfare | Controlador | UV |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | Casa Robledo | Vega Alta | ES-24-0101 | 1150 | Piensos Norteña | 12/09/2026 | Sí | L. Vega | UV-3 |
| 5 | Granja El Encinar | Robles del Río | ES-24-0105 | 880 | AgroFeed | 03/08/2026 | Sí | L. Vega | UV-3 |
| 9 | Toral del Monte (F. Prado) | Toral del Monte | ES-24-0109 | 1000 | Piensos Norteña | 21/11/2026 | Sí | M. Robles | UV-2 |
| 12 | Casa Fontanar | Fontanar | ES-24-0112 | 960 | NutriCampo | 30/10/2026 | No | M. Robles | UV-2 |
| 14 | Granja Ismael Cuesta | La Llanada | ES-24-0114 | 1200 | NutriCampo | 15/12/2026 | Sí | L. Vega | UV-1 |
| 18 | El Requejo | Vallehondo | ES-24-0118 | 1050 | Piensos del Valle | 02/02/2027 | Sí | M. Robles | UV-1 |
| 22 | Casa Milán | Prado Verde | ES-24-0122 | 1050 | NutriCampo | 09/08/2026 | No | L. Vega | UV-2 |
| 26 | Granja Los Castaños | Castañeda | ES-24-0126 | 1150 | Piensos Norteña | 28/01/2027 | Sí | M. Robles | UV-3 |
| 29 | La Braña Vieja | Altomonte | ES-24-0129 | 760 | AgroFeed | 07/10/2026 | Sí | L. Vega | UV-1 |
| 32 | Finca Arroyo (J. Arcayo) | Arroyo de Abajo | ES-24-0132 | 900 | Piensos del Valle | 11/11/2026 | Sí | M. Robles | UV-2 |
| 33 | Casa Faustino | Peñalba | ES-24-0133 | 840 | AgroFeed | 25/09/2026 | No | L. Vega | UV-3 |
| 40 | Granja Valdecillo | Valdecillo | ES-24-0140 | 1100 | Piensos Norteña | 14/10/2026 | Sí | M. Robles | UV-1 |

Condiciones de liquidación:

```text
13,50 €/cerdo
prima según conversión
2% retención
```

Inventar datos de DNI/contacto coherentes.

---

# 15.4 Facturas seed

## 7088

```text
Piensos Norteña
2026-4411
10/07/2026
#9 Toral del Monte
Valdeón 30 Extra
11.800 kg
0,334 €/kg
porte: 1.026,60 €
total: 4.967,80 €
vence: 09/08
validada
```

---

## 7089

```text
NutriCampo
F-26/0904
11/07/2026
#14 Ismael Cuesta
Cebo N-80
17.940 kg
0,334 €/kg
porte: 1.435,20 €
total: 7.427,16 €
vence: 10/08
validada
```

---

## 7090

Caso obligatorio de discrepancia:

```text
Piensos Norteña
2026-4423
13/07/2026
#26 Los Castaños
Valdeón 30 Extra
24.600 kg
precio: 0,342
tarifa julio: 0,334
porte: 2.140,20 €
total: 10.553,40 €
vence: 12/08
diferencia: +196,80 €
```

---

## 7091

```text
AgroFeed
AF-2026-812
13/07/2026
#5 El Encinar
Cebo AF-Max
9.400 kg
0,327 €/kg
porte: 0
total: 3.073,80 €
vence: 12/08
pendiente
```

---

## 7092

```text
VetSalud
V-2026-233
13/07/2026
#22 Casa Milán
Medicado M-2
1.450 kg
0,512 €/kg
porte: 0
total: 742,40 €
vence: 28/07
pendiente
```

---

## 7093

```text
Piensos del Valle
PV-1187
14/07/2026
#18 El Requejo
Engorde V-60
13.250 kg
0,331 €/kg
porte: 993,75 €
total: 5.379,50 €
vence: 13/08
pendiente
```

---

## 5211

Caso obligatorio de factura atrasada:

```text
NutriCampo
F-26/0698
fecha factura: 28/05/2026
#12 Casa Fontanar
Starter N-1
6.200 kg
0,412 €/kg
porte: 496 €
total: 3.050,40 €
vence: 27/06
```

Debe conservar numeración de mayo aunque llegue posteriormente.

---

Generar adicionalmente:

```text
15-20 facturas
```

siguiendo los mismos patrones.

---

# 15.5 Cebas

## V-112

```text
Integrado: #26
Origen: Cría Segovia SL
Entrada: 04/11/2025
Animales: 1110
Kg entrada: 21.400
Kg salida: 127.900
Kg pienso: 248.100
Coste pienso: 82.900 €
Medicación: 1.850 €
Bajas: 14
Cerrada: 24/04
Conversión esperada: 2,33
```

---

## V-115

```text
Integrado: #9
Origen: importación NL
Entrada: 02/12/2025
Animales: 980
Kg entrada: 19.100
Kg salida: 112.400
Kg pienso: 228.700
Coste pienso: 76.400 €
Medicación: 2.310 €
Bajas: 17
Cerrada: 12/06
Conversión esperada: 2,45
```

---

## V-118

Ceba principal de la demo.

```text
Integrado: #14
Origen: Cría Segovia SL
Entrada: 02/03/2026
Animales: 1180
Kg entrada: 23.000

Primera salida:
330 animales
38.100 kg
08/07

Pienso: 201.450 kg
Coste pienso: 67.300 €
Medicación: 1.240 €
Bajas: 21

Estado:
activa
primera saca realizada
lista para cierre
```

---

## V-119

```text
#18 El Requejo
18/04/2026
importación NL
1020 animales
20.100 kg entrada
142.800 kg pienso
47.300 € pienso
890 € medicación
9 bajas
activa
```

---

## V-121

```text
#22 Casa Milán
02/06/2026
Cría Palentina
1020 animales
19.900 kg entrada
64.200 kg pienso
21.400 € pienso
1.980 € medicación
31 bajas
activa
```

Mostrar alerta por bajas elevadas.

---

## V-122

```text
#5 El Encinar
22/06/2026
importación NL
860 animales
16.800 kg entrada
31.100 kg pienso
10.200 € pienso
310 € medicación
6 bajas
activa
```

---

# 15.6 Clientes

Usar:

```text
Cárnicas del Norte SA
Matadero Río Frío SL
Embutidos La Vega SL
Ganados del Sur SL
```

---

## Bancos

```text
Banco Duero
Caja Rural del Páramo
BanNorte
Caja Vega
```

---

# 15.7 Logística seed

## 03/03

```text
Salida
#26
Cárnicas del Norte
180 cerdos
25.200 kg
Welfare: sí
Transporte interno
Chofer: A. Sierra
ALB-2603
archivado
```

---

## 12/06

```text
Salida
#9
Matadero Río Frío
310
36.890 kg
Welfare: sí
Transportes Cueto
ALB-2711
pendiente
```

---

## 22/06

```text
Entrada lechones
#5
importación NL
860
16.800 kg
externo
ALB-E-118
archivado
```

---

## 08/07

```text
Salida
#14
Cárnicas del Norte
330
38.100 kg
Welfare: sí
interno
R. Campos
ALB-2740
archivado
```

Choferes propios:

```text
A. Sierra
R. Campos
```

Transportista habitual:

```text
Transportes Cueto SL
```

Generar dos matrículas ficticias coherentes para camiones propios.

---

# 16. Testing obligatorio

Usar Vitest.

---

## Numeración

Comprobar:

```text
siguiente correlativo del mismo mes
factura atrasada de mayo
primera factura de agosto
```

---

## Porte

Comprobar:

```text
P1 → sí
P2 → sí
P3 → sí
P4 → 0
P5 → 0
```

---

## Discrepancia

Factura:

```text
7090
```

Resultado esperado:

```text
+196,80 €
```

---

## Conversión

```text
V-112 → ~2,33
V-115 → ~2,45
```

---

## Liquidación

Probar los límites:

```text
2,35
2,45
> 2,45
```

y retención:

```text
2%
```

---

## Propagación

Al validar una factura de pienso comprobar:

```text
invoice.status cambia
payment creado
feedKg de ceba aumenta
feedCost aumenta
sentToAccounting = true
archived = true
```

---

## DVR

Comprobar:

```text
< 30 días → alerta
>= 30 días → sin alerta
```

---

# 17. UX/UI

Debe parecer una aplicación B2B de gestión.

No una landing page.

Prioridades:

```text
claridad
densidad de información razonable
lectura rápida
acciones evidentes
estados visibles
consistencia
```

Usar:

```text
sidebar
header
tablas
badges
cards
gráficos
modales
toasts
tooltips cuando aporten valor
```

---

## Estados

Diferenciar visualmente:

```text
pendiente
validada
discrepancia
cerrada
activa
lista para cierre
vencida
pagada
```

---

## Discrepancias

Deben destacar inmediatamente.

Ejemplo:

```text
⚠ Discrepancia de precio

Facturado:
0,342 €/kg

Tarifa:
0,334 €/kg

Diferencia:
+196,80 €
```

---

# 18. Formato de datos

UI en español.

Fechas:

```text
dd/mm/yyyy
```

Moneda:

```ts
new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR"
})
```

Mostrar:

```text
€
kg
€/kg
```

Mantener números como números internamente.

---

# 19. Orden de implementación

## Fase 1

```text
Vite
React
TypeScript
routing
types
seeds
domain
Zustand
```

---

## Fase 2

Implementar vertical slice:

```text
simular factura
↓
revisar
↓
validar
↓
tesorería
↓
ceba V-118
```

---

## Fase 3

```text
cerrar V-118
↓
liquidación
↓
pago en tesorería
↓
previsión semanal
```

Al terminar esta fase debe funcionar el recorrido principal completo.

---

## Fase 4

```text
Pienso
Tarifas
Logística
Integrados
Proveedores
```

---

## Fase 5

```text
Dashboard
gráficos
responsive
accesibilidad
QA
deploy
```

---

## Fase 6

Solo si sobra tiempo:

```text
WhatsApp parser
roles
exportación contable avanzada
```

---

# 20. Definition of Done

El proyecto estará terminado cuando:

- arranque con un comando;
- compile correctamente;
- no haya errores críticos en consola;
- las rutas principales funcionen;
- los seeds carguen;
- el estado persista;
- exista reset de demo;
- todos los botones visibles respondan;
- las reglas de negocio sean correctas;
- la factura 7090 detecte +196,80 €;
- la numeración atrasada funcione;
- las conversiones sean correctas;
- validar una factura propague los datos;
- cerrar V-118 genere liquidación;
- la liquidación cree un pago;
- ese pago aparezca en previsión;
- los tests pasen;
- `pnpm build` funcione;
- la app esté desplegable en Vercel.

---

# 21. Reglas para Claude

Antes de modificar código:

1. inspeccionar los tipos relacionados;
2. inspeccionar las funciones de dominio;
3. inspeccionar Zustand;
4. inspeccionar tests;
5. entender cómo fluye el dato.

No empezar a modificar archivos a ciegas.

---

## Al programar

Claude debe:

- reutilizar código existente;
- hacer cambios pequeños y coherentes;
- mantener TypeScript estricto;
- añadir tipos correctos;
- añadir tests cuando cambie negocio;
- respetar la estructura existente;
- evitar dependencias innecesarias;
- separar UI y dominio.

---

## No hacer

No:

```text
usar any para silenciar errores
duplicar fórmulas
hardcodear KPIs
crear botones falsos
crear estados duplicados
introducir backend innecesario
reescribir módulos sin necesidad
añadir librerías por comodidad mínima
```

---

## Después de modificar

Ejecutar:

```bash
pnpm test
pnpm build
```

Cuando corresponda también:

```bash
pnpm lint
```

Resolver errores antes de considerar terminada una tarea.

---

# 22. Principio final

La prioridad no es construir el sistema más sofisticado.

La prioridad es construir una demo:

```text
coherente
fiable
visualmente convincente
fácil de entender
con reglas reales
con un flujo completo funcionando
```

Si hay conflicto entre:

```text
más arquitectura
```

y:

```text
tener el flujo principal terminado
```

gana siempre el flujo principal.