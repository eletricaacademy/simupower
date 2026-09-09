import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SPDA_DIAGNOSTICOS } from '../catalog/spdaDiagnostico'

describe('Contrato do tour fotográfico do SPDA', () => {
  it('mantém quatro paradas únicas, sendo três falhas e uma verificação', () => {
    expect(SPDA_DIAGNOSTICOS).toHaveLength(4)
    expect(new Set(SPDA_DIAGNOSTICOS.map((item) => item.id)).size).toBe(4)
    expect(SPDA_DIAGNOSTICOS.filter((item) => item.tipo === 'nao-conformidade')).toHaveLength(3)
    expect(SPDA_DIAGNOSTICOS.filter((item) => item.tipo === 'verificacao')).toHaveLength(1)
    expect(SPDA_DIAGNOSTICOS.at(-1)?.id).toBe('continuidade-cobertura')
  })

  it('aponta para imagens locais existentes', () => {
    for (const item of SPDA_DIAGNOSTICOS) {
      const caminho = join(process.cwd(), 'public', item.imagem.replace(/^\//, ''))
      expect(existsSync(caminho), item.imagem).toBe(true)
    }
  })

  it('possui âncoras e vistas 3D finitas', () => {
    for (const item of SPDA_DIAGNOSTICOS) {
      expect([...item.ancora, ...item.vista.pos, ...item.vista.target].every(Number.isFinite), item.id).toBe(true)
    }
  })
})
