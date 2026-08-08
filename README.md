# Valdeón Gestión

Demo funcional de un sistema de gestión centralizado para **Agroganadera Valdeón SL**, una integradora porcina ficticia. Ver `CLAUDE.md` para la especificación completa del proyecto.

## Arranque

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
pnpm test    # vitest
pnpm lint    # eslint
pnpm build   # tsc -b && vite build
```
