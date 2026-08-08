import { describe, expect, it } from 'vitest'
import { canAccessRoute, canExport, canOperate, getDefaultRoute } from './roles'

describe('roles', () => {
  it('gives Mario full operation and export permissions', () => {
    expect(canOperate('admin')).toBe(true)
    expect(canExport('admin')).toBe(true)
    expect(canAccessRoute('admin', '/cebas/V-118')).toBe(true)
  })

  it('keeps Dirección in read-only mode across the application', () => {
    expect(canOperate('direction')).toBe(false)
    expect(canExport('direction')).toBe(false)
    expect(canAccessRoute('direction', '/facturas')).toBe(true)
  })

  it('limits Contable to export areas', () => {
    expect(canOperate('accounting')).toBe(false)
    expect(canExport('accounting')).toBe(true)
    expect(canAccessRoute('accounting', '/contabilidad')).toBe(true)
    expect(canAccessRoute('accounting', '/facturas-emitidas')).toBe(true)
    expect(canAccessRoute('accounting', '/tesoreria')).toBe(false)
    expect(getDefaultRoute('accounting')).toBe('/contabilidad')
  })
})
