import { BEP_SKID, VISTAS_FV } from '../catalog/usinaFvPontos'
import type { Vec3 } from '../catalog/types'

/** Mantém a posição da maleta original e reaproveita a câmera calibrada do skid. */
export const INBRAT_FV_POS: Vec3 = [BEP_SKID[0] + .9, 0, BEP_SKID[2] - 1]
export const VISTA_INBRAT_FV = { pos: VISTAS_FV.skid.pos, target: INBRAT_FV_POS }
