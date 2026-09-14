import { describe, it, expect } from 'vitest'
import { acessoPowerDimVigente, fimDoAcessoPowerDim, motivoDaLinha, type AcessoPowerDimRow } from './contaPowerDim'

const AGORA = new Date('2026-09-14T15:00:00Z')
const ONTEM = '2026-09-13T15:00:00Z'
const AMANHA = '2026-09-15T15:00:00Z'

function linha(p: Partial<AcessoPowerDimRow>): AcessoPowerDimRow {
  return { status: 'active', trial_ends_at: null, access_ends_at: null, simupower: true, ...p }
}

describe('regra de vigência copiada do PowerDim (hasValidAccess)', () => {
  it('active sem data é vitalício', () => {
    expect(acessoPowerDimVigente(linha({}), AGORA)).toBe(true)
    expect(fimDoAcessoPowerDim(linha({}))).toBeNull()
  })
  it('active com access_ends_at futuro vale; passado não', () => {
    expect(acessoPowerDimVigente(linha({ access_ends_at: AMANHA }), AGORA)).toBe(true)
    expect(acessoPowerDimVigente(linha({ access_ends_at: ONTEM }), AGORA)).toBe(false)
  })
  it('trial exige trial_ends_at futuro (sem data = bloqueado)', () => {
    expect(acessoPowerDimVigente(linha({ status: 'trial', trial_ends_at: AMANHA }), AGORA)).toBe(true)
    expect(acessoPowerDimVigente(linha({ status: 'trial', trial_ends_at: ONTEM }), AGORA)).toBe(false)
    expect(acessoPowerDimVigente(linha({ status: 'trial' }), AGORA)).toBe(false)
  })
  it('suspended / expired nunca valem', () => {
    expect(acessoPowerDimVigente(linha({ status: 'suspended' }), AGORA)).toBe(false)
    expect(acessoPowerDimVigente(linha({ status: 'expired', access_ends_at: AMANHA }), AGORA)).toBe(false)
  })
})

describe('motivo final: vigência + flag simupower', () => {
  it('sem linha → sem-conta', () => {
    expect(motivoDaLinha(null, AGORA)).toBe('sem-conta')
  })
  it('conta vigente com flag → ok', () => {
    expect(motivoDaLinha(linha({}), AGORA)).toBe('ok')
  })
  it('conta vigente SEM flag → sem-simupower (quem já tinha PowerDim não recebe)', () => {
    expect(motivoDaLinha(linha({ simupower: false }), AGORA)).toBe('sem-simupower')
    expect(motivoDaLinha(linha({ simupower: null }), AGORA)).toBe('sem-simupower')
  })
  it('conta encerrada perde mesmo com flag', () => {
    expect(motivoDaLinha(linha({ status: 'trial', trial_ends_at: ONTEM }), AGORA)).toBe('encerrado')
    expect(motivoDaLinha(linha({ status: 'suspended' }), AGORA)).toBe('encerrado')
  })
})
