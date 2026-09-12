import { BEP_SKID, VISTAS_FV } from '../catalog/usinaFvPontos'
import type { Vec3 } from '../catalog/types'

/** Mantém a posição da maleta original e reaproveita a câmera calibrada do skid. */
export const INBRAT_FV_POS: Vec3 = [BEP_SKID[0] + .9, 0, BEP_SKID[2] - 1]
export const VISTA_INBRAT_FV = { pos: VISTAS_FV.skid.pos, target: INBRAT_FV_POS }

/** Sobe fora da laje e alcança o BEP horizontalmente pela face frontal. */
export const DIRECAO_GARRA_BEP_FV: Vec3 = [0, 0, -1]
export const ROTA_CABO_BEP_FV: Vec3[] = [
  [INBRAT_FV_POS[0] + .9, .06, INBRAT_FV_POS[2]],
  [BEP_SKID[0], .06, BEP_SKID[2] - .7],
  [BEP_SKID[0], BEP_SKID[1], BEP_SKID[2] - .7],
]
