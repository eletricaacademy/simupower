import { describe, expect, it } from 'vitest'
import { GALPAO, contatoEstrutural } from '../catalog/estruturalPontos'

describe('posicionamento dos contatos do SPDA estrutural', () => {
  it('mantém os Aterrinserts do galpão pronto nas faces externas', () => {
    const metadeLargura = GALPAO.largura / 2

    expect(contatoEstrutural('P1', false, 'pronto')[0]).toBeLessThan(-metadeLargura)
    expect(contatoEstrutural('P2', false, 'pronto')[0]).toBeGreaterThan(metadeLargura)
  })

  it('mantém o contato da obra junto à ferragem exposta interna', () => {
    const metadeLargura = GALPAO.largura / 2

    expect(contatoEstrutural('P1', false, 'obra')[0]).toBeGreaterThan(-metadeLargura)
    expect(contatoEstrutural('P2', false, 'obra')[0]).toBeLessThan(metadeLargura)
  })
})
