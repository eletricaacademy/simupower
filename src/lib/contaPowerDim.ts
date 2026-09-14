/* =============================================================================
   Conta PowerDim — acesso ao SimuPower pelo MESMO e-mail e senha (14/09/2026)
   -----------------------------------------------------------------------------
   Espelho de contaGroundPro.ts, apontando para o backend do PowerDim (projeto
   Supabase hjgcykabpvligkupjjhx). A regra de acesso é a do próprio PowerDim
   (src/lib/access.js de lá, `hasValidAccess`) MAIS o flag `user_access.simupower`:

     status 'trial'  → vale até trial_ends_at
     status 'active' → vale até access_ends_at (nula = vitalícia)
     outro status    → sem acesso
     simupower=false → sem acesso ("sua conta não inclui o SimuPower")

   O flag existe porque o Pablo decidiu (14/09/2026) que só contas NOVAS do
   PowerDim (e liberações manuais, caso a caso) entram aqui; quem já tinha o
   PowerDim antes não recebe automaticamente.

   A chave "publishable" do PowerDim é pública por design (está no fonte do
   próprio PowerDim e em todo navegador que o abre); o RLS garante que o usuário
   só lê a própria linha de user_access e não consegue se auto-liberar (não há
   política de UPDATE para o usuário). Fail-closed: erro de leitura NÃO libera.
   ============================================================================= */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL_POWERDIM: string =
  import.meta.env.VITE_POWERDIM_URL || 'https://hjgcykabpvligkupjjhx.supabase.co'
const KEY_POWERDIM: string =
  import.meta.env.VITE_POWERDIM_KEY || 'sb_publishable_Tq73y7kW9FZ6bi0P10Deaw_eM0Pp7pz'

let cliente: SupabaseClient | null = null

function supabase(): SupabaseClient {
  if (!cliente) {
    cliente = createClient(URL_POWERDIM, KEY_POWERDIM, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        // storageKey próprio: não colide com a sessão do PowerDim nem do GroundPRO.
        storageKey: 'simupower-powerdim-auth',
      },
    })
  }
  return cliente
}

export type MotivoPowerDim = 'ok' | 'sem-sessao' | 'sem-conta' | 'sem-simupower' | 'encerrado' | 'erro'

export type AcessoPowerDim = {
  liberado: boolean
  motivo: MotivoPowerDim
  /** Até quando vale (ISO), quando houver data. */
  fim?: string | null
  /** 'trial' | 'active' | outro status de user_access. */
  status?: string | null
  email?: string | null
}

export interface AcessoPowerDimRow {
  status: string
  trial_ends_at: string | null
  access_ends_at: string | null
  simupower: boolean | null
}

/** Data de fim do acesso PowerDim (null = sem data / vitalício), como em access.js de lá. */
export function fimDoAcessoPowerDim(a: AcessoPowerDimRow): Date | null {
  const bruto = a.status === 'trial' ? a.trial_ends_at : a.status === 'active' ? a.access_ends_at : null
  if (!bruto) return null
  const d = new Date(bruto)
  return Number.isFinite(d.getTime()) ? d : null
}

/** Regra `hasValidAccess` do PowerDim, copiada: trial exige data futura; active vale sem data. */
export function acessoPowerDimVigente(a: AcessoPowerDimRow, agora: Date = new Date()): boolean {
  const t = agora.getTime()
  if (a.status === 'trial') {
    const fim = fimDoAcessoPowerDim(a)
    return fim !== null && fim.getTime() > t
  }
  if (a.status === 'active') {
    const fim = fimDoAcessoPowerDim(a)
    return fim === null || fim.getTime() > t
  }
  return false
}

/** Motivo final para uma linha lida: aplica vigência + flag simupower. */
export function motivoDaLinha(a: AcessoPowerDimRow | null, agora: Date = new Date()): MotivoPowerDim {
  if (!a) return 'sem-conta'
  if (!acessoPowerDimVigente(a, agora)) return 'encerrado'
  if (a.simupower !== true) return 'sem-simupower'
  return 'ok'
}

export async function entrarNoPowerDim(email: string, senha: string): Promise<{ error: Error | null }> {
  const { error } = await supabase().auth.signInWithPassword({ email: (email || '').trim(), password: senha || '' })
  return { error: error ? new Error(error.message) : null }
}

export async function sairDoPowerDim(): Promise<void> {
  try {
    await supabase().auth.signOut()
  } catch {
    /* ignore */
  }
}

/**
 * Verifica se a conta PowerDim logada pode usar o SimuPower.
 * Lê a própria linha de user_access (RLS) e aplica vigência + flag.
 */
export async function verificarAcessoPowerDim(agora: Date = new Date()): Promise<AcessoPowerDim> {
  const sb = supabase()
  try {
    const { data: s } = await sb.auth.getSession()
    const user = s?.session?.user
    if (!user) return { liberado: false, motivo: 'sem-sessao' }

    const { data, error } = await sb
      .from('user_access')
      .select('status, trial_ends_at, access_ends_at, simupower')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) return { liberado: false, motivo: 'erro', email: user.email }

    const linha = (data as AcessoPowerDimRow | null) ?? null
    const motivo = motivoDaLinha(linha, agora)
    const fim = linha ? fimDoAcessoPowerDim(linha) : null
    return {
      liberado: motivo === 'ok',
      motivo,
      fim: fim ? fim.toISOString() : null,
      status: linha?.status ?? null,
      email: user.email,
    }
  } catch {
    return { liberado: false, motivo: 'erro' }
  }
}
