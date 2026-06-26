import { useEffect, useState } from 'react'

/**
 * useIsPhone — true no layout mobile (celular). Casado com o tier "telefone" do
 * index.css (@media max-width: 767px) e com o breakpoint `md` do Tailwind (768px),
 * que é onde o app troca para o layout mobile (dock inferior). Abaixo de 768px o
 * HUD compacta tipografia/altura e simplifica a UI (ex.: controle de som vira só
 * o ícone de mudo; lista de detalhes recolhe).
 */
const QUERY = '(max-width: 767px)'

export function useIsPhone() {
  const [phone, setPhone] = useState(
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY).matches : false),
  )
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const on = () => setPhone(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}
