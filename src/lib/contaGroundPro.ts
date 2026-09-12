/* =============================================================================
   Conta GroundPRO — acesso ao SimuPower pelo MESMO e-mail e senha (12/09/2026)
   -----------------------------------------------------------------------------
   Quem tem conta no GroundPRO (trial ou paga, dentro da data de fim) entra aqui
   com o mesmo login. Quem perdeu o acesso lá, perde aqui. A regra é a do próprio
   GroundPRO (src/lib/fim-do-acesso.ts de lá):

     conta em TRIAL  → vale até tenants.trial_ends_at
     conta ATIVA     → vale até tenants.subscription_ends_at (nula = vitalícia)
     outro status    → sem acesso

   Backend: o Supabase self-hosted do GroundPRO (api.ground.eletricaacademy.com.br).
   A chave "anon" é pública por design (vai em todo navegador que abre o GroundPRO);
   o que protege os dados é o RLS: o usuário só lê o próprio tenant_members e o
   próprio tenant. Ela NÃO fica no fonte: entra por variável de ambiente Vite na
   hora do build (`.env.local`, gitignored):

     VITE_GROUNDPRO_URL=https://api.ground.eletricaacademy.com.br
     VITE_GROUNDPRO_ANON_KEY=<anon key do GroundPRO>

   Sem a chave, este caminho fica desativado (o app avisa no console) e as senhas
   de sempre continuam valendo. Fail-closed: erro de leitura NÃO libera.
   ============================================================================= */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL_GROUNDPRO: string =
  import.meta.env.VITE_GROUNDPRO_URL || 'https://api.ground.eletricaacademy.com.br'
const ANON_KEY_GROUNDPRO: string = import.meta.env.VITE_GROUNDPRO_ANON_KEY || ''

/** Link para adquirir o acesso completo (mesmo WhatsApp do trial do GroundPRO). */
export const URL_COMPRA_GROUNDPRO: string =
  import.meta.env.VITE_GROUNDPRO_UPGRADE_URL ||
  'https://wa.me/559294110023?text=' +
    encodeURIComponent('Eu vim do trial da GroundPRO. Quero ter mais informações.')

let cliente: SupabaseClient | null = null

/** O caminho GroundPRO está configurado neste build? */
export function groundProDisponivel(): boolean {
  return ANON_KEY_GROUNDPRO.length > 0
}

function supabase(): SupabaseClient | null {
  if (!groundProDisponivel()) {
    if (!cliente) console.warn('[SimuPower] VITE_GROUNDPRO_ANON_KEY ausente: login pela conta GroundPRO desativado.')
    return null
  }
  if (!cliente) {
    cliente = createClient(URL_GROUNDPRO, ANON_KEY_GROUNDPRO, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        // storageKey próprio: não colide com a sessão do PowerDim nem do GroundPRO.
        storageKey: 'simupower-groundpro-auth',
      },
    })
  }
  return cliente
}

export type MotivoGroundPro = 'ok' | 'sem-sessao' | 'sem-conta' | 'encerrado' | 'desativado' | 'erro'

export type AcessoGroundPro = {
  liberado: boolean
  motivo: MotivoGroundPro
  /** Até quando vale (ISO), quando houver data. */
  fim?: string | null
  /** 'trial' | 'active' | outro status do tenant. */
  status?: string | null
  email?: string | null
}

interface DatasDaConta {
  status: string
  trial_ends_at: string | null
  subscription_ends_at: string | null
}

/** Regra única de fim de acesso, copiada do GroundPRO (fim-do-acesso.ts). */
export function fimDoAcesso(c: DatasDaConta): Date | null {
  const bruto = c.status === 'trial' ? c.trial_ends_at : c.status === 'active' ? c.subscription_ends_at : null
  if (!bruto) return null
  const d = new Date(bruto)
  return Number.isFinite(d.getTime()) ? d : null
}

export function acessoVigente(c: DatasDaConta, agora: Date = new Date()): boolean {
  if (c.status !== 'trial' && c.status !== 'active') return false
  const fim = fimDoAcesso(c)
  return fim === null || agora.getTime() <= fim.getTime()
}

export async function entrarNoGroundPro(email: string, senha: string): Promise<{ error: Error | null }> {
  const sb = supabase()
  if (!sb) return { error: new Error('Login pela conta GroundPRO não está configurado neste build.') }
  const { error } = await sb.auth.signInWithPassword({ email: (email || '').trim(), password: senha || '' })
  return { error: error ? new Error(error.message) : null }
}

export async function sairDoGroundPro(): Promise<void> {
  const sb = supabase()
  if (!sb) return
  try {
    await sb.auth.signOut()
  } catch {
    /* ignore */
  }
}

/**
 * Verifica se a conta GroundPRO logada pode usar o SimuPower.
 * Lê tenant_members (o próprio) → tenants (o próprio) e aplica a data de fim.
 */
export async function verificarAcessoGroundPro(agora: Date = new Date()): Promise<AcessoGroundPro> {
  const sb = supabase()
  if (!sb) return { liberado: false, motivo: 'desativado' }
  try {
    const { data: s } = await sb.auth.getSession()
    const user = s?.session?.user
    if (!user) return { liberado: false, motivo: 'sem-sessao' }

    const { data: member, error: e1 } = await sb
      .from('tenant_members')
      .select('tenant_id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    if (e1) return { liberado: false, motivo: 'erro', email: user.email }
    if (!member) return { liberado: false, motivo: 'sem-conta', email: user.email }

    const { data: tenant, error: e2 } = await sb
      .from('tenants')
      .select('status, trial_ends_at, subscription_ends_at')
      .eq('id', member.tenant_id)
      .maybeSingle()
    if (e2) return { liberado: false, motivo: 'erro', email: user.email }
    if (!tenant) return { liberado: false, motivo: 'sem-conta', email: user.email }

    const fim = fimDoAcesso(tenant as DatasDaConta)
    const ok = acessoVigente(tenant as DatasDaConta, agora)
    return {
      liberado: ok,
      motivo: ok ? 'ok' : 'encerrado',
      fim: fim ? fim.toISOString() : null,
      status: (tenant as DatasDaConta).status,
      email: user.email,
    }
  } catch {
    return { liberado: false, motivo: 'erro' }
  }
}
