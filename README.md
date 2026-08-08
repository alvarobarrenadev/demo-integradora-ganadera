# Valdeón Gestión

![Valdeón Gestión](public/favicon/og-image.png)

Demo funcional de un sistema de gestión centralizado para **Agroganadera Valdeón SL**, una integradora porcina ficticia. Centraliza facturación, tesorería, pienso, cebas, logística y contabilidad con datos simulados y reglas de negocio reales.

La interfaz es responsive, comienza en modo claro, incluye modo oscuro y puede instalarse como PWA. El estado se conserva en `localStorage` y puede restablecerse desde la propia aplicación.

> Consulta [`CLAUDE.md`](CLAUDE.md) para la especificación funcional y técnica completa.

## Funcionalidades principales

- Recepción simulada, revisión y validación de facturas.
- Actualización atómica de tesorería, consumo, ceba, contabilidad y archivo.
- Tarifas por proveedor, tipo de pienso y mes, con detección de discrepancias.
- Seguimiento y cierre de cebas con cálculo de conversión.
- Liquidaciones, retenciones, facturas emitidas y generación de PDF.
- Previsión semanal de cobros y pagos.
- Gestión de logística, integrados, proveedores, transportistas y alertas DVR.
- Persistencia local, reinicio reproducible de la demo y funcionamiento offline.

## Instalación y arranque

Necesitas Node.js y `pnpm`. Desde un clon limpio:

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:5173`. El estado se persiste en `localStorage`; usa **Restablecer demo** en la barra lateral para volver siempre a los mismos datos de partida.

## Decisiones técnicas (resumen)

1. **Fecha de referencia fija** (`DEMO_REFERENCE_DATE = 2026-07-15`, en `utils/dates.ts`) en vez de `new Date()`, para que avisos DVR, vencimientos y previsión de tesorería sean siempre deterministas.
2. **Sass 7-1 existente** (`src/sass/`) en lugar de SCSS Modules — una única hoja de estilos global, sin duplicar sistemas.
3. `validateInvoice` es **atómica**: si la factura necesita una ceba activa y no existe, no se valida nada (ni pago, ni contabilidad); todo o nada, con aviso visible.
4. **Facturas emitidas** (`generateEmittedInvoice`) están desacopladas de `generateSettlement`: liquidar una ceba y emitir su factura son dos acciones y numeraciones independientes (`FE-AAAA-NNN`).
5. Redondeo monetario centralizado en `utils/numbers.ts` (`roundTo`), robusto frente a errores de coma flotante — nunca `Math.round(v*100)/100` a pelo.

## Flujo de demo (8 clics, 0 tecleo)

1. **Facturas** → **Simular factura entrante** (procesa y navega automáticamente al detalle).
2. **Validar factura**.
3. **Tesorería** → ver el nuevo pago.
4. Clic en el aviso **"Ceba V-118 lista para cierre"** (panel o toast) → detalle de V-118.
5. **Cerrar ceba**.
6. **Generar liquidación**.
7. **Ver en previsión semanal** → el pago de la liquidación ya aparece.

Casos a verificar en la misma pasada:

- Factura **7090**: discrepancia de precio, `+196,80 €`.
- Factura **5211**: conserva numeración de mayo aunque se vea en julio.
- Ceba **V-112** ≈ 2,33 de conversión, **V-115** ≈ 2,45.
- DVR: avisos para El Encinar (#5) y Casa Milán (#22).
- VetSalud/P5 (Medicado M-2) se mantiene en 0,512 €/kg en todo el histórico y tras aplicar tarifas de agosto.
- Reintentar una acción ya completada (validar, cerrar, liquidar, aplicar agosto) no debe duplicar ni corromper nada.

## Comandos

```bash
pnpm dev      # servidor de desarrollo
pnpm test     # tests de dominio con Vitest
pnpm lint     # análisis estático con ESLint
pnpm build    # TypeScript + build de producción
pnpm preview  # previsualiza el build localmente
pnpm deploy   # publica dist/ en la rama gh-pages
```

## PWA

El service worker se registra únicamente en producción. Precarga la aplicación y sus recursos esenciales, guarda los recursos visitados y permite abrir la interfaz sin conexión después de una primera carga correcta.

Para probar la instalación localmente:

```bash
pnpm build
pnpm preview
```

Abre la URL indicada por Vite en un navegador compatible y usa la opción **Instalar aplicación**. Los iconos, el manifiesto, la imagen social y el logotipo están en `public/`.

## GitHub Pages

El proyecto está configurado para publicarse en:

```text
https://alvarobarrenadev.github.io/demo-integradora-ganadera/
```

El despliegue usa el `base` del repositorio y rutas hash para que los recursos, la navegación y las recargas funcionen correctamente en GitHub Pages.
