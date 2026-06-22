import { useEffect, lazy, Suspense } from 'react'
import { Hud } from './ui/Hud'
import { ArcFlashHud } from './ui/ArcFlashHud'
import { InspectionHud } from './ui/InspectionHud'
import { DesenergizacaoHud } from './ui/DesenergizacaoHud'
import { AterramentoHud } from './ui/AterramentoHud'
import { MainMenu } from './ui/MainMenu'
import { LandscapeFrame } from './ui/LandscapeFrame'
import { Watermark } from './ui/Watermark'
import { useSim } from './sim/store'
import { useAudio } from './sim/audioStore'
import { asset } from './lib/asset'
import { color } from './design/tokens'

const IDLE_MS = 3 * 60 * 1000 // silencia o áudio após 3 min sem interação

// O palco 3D (three.js, R3F, postprocessing) é o código mais pesado — carrega
// em chunk separado, sob demanda, para a casca/HUD pintar primeiro em aparelhos
// fracos.
const Stage = lazy(() => import('./scene/Stage').then((m) => ({ default: m.Stage })))

export default function App() {
  const setReducedMotion = useSim((s) => s.setReducedMotion)
  const view = useSim((s) => s.view)
  const modo = useSim((s) => s.ensaio.modo)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [setReducedMotion])

  // auto-silêncio por inatividade: muta após 3 min sem interação; ao voltar a
  // interagir, reativa (somente se o mudo foi automático, não manual).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let autoMutado = false
    const { setMudo } = useAudio.getState()

    const aoInativo = () => {
      if (!useAudio.getState().mudo) {
        setMudo(true)
        autoMutado = true
      }
    }
    const reset = () => {
      if (autoMutado) {
        setMudo(false)
        autoMutado = false
      }
      clearTimeout(timer)
      timer = setTimeout(aoInativo, IDLE_MS)
    }

    const eventos: (keyof DocumentEventMap)[] = [
      'pointerdown',
      'pointermove',
      'keydown',
      'wheel',
      'touchstart',
    ]
    eventos.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(timer)
      eventos.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: color.viewport }}>
      {view === 'menu' ? (
        <MainMenu />
      ) : (
        <LandscapeFrame>
          <Suspense fallback={<Splash />}>
            <Stage />
          </Suspense>
          <Watermark />
          {modo === 'arcflash' ? (
            <ArcFlashHud />
          ) : modo === 'inspecao' ? (
            <InspectionHud />
          ) : modo === 'desenergizacao' ? (
            <DesenergizacaoHud />
          ) : modo === 'aterramento' ? (
            <AterramentoHud />
          ) : (
            <Hud />
          )}
        </LandscapeFrame>
      )}
    </div>
  )
}

/** Splash leve enquanto o chunk do 3D carrega. */
function Splash() {
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{ background: color.viewport }}
    >
      <div className="text-center">
        <img
          src={asset('brand/logo-horizontal.png')}
          alt="SimuPower"
          className="h-12 w-auto mx-auto mb-3"
          style={{ maxWidth: '70vw' }}
        />
        <div
          className="font-mono text-[11px] mt-1"
          style={{ color: color.textFaint }}
        >
          inicializando palco 3D…
        </div>
      </div>
    </div>
  )
}
