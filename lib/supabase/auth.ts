import { createClient } from './client'

export type Perfil = {
  user_id: string
  nome: string | null
  role: 'admin' | 'owner'
  empresa_id: string | null
}

export type Empresa = {
  id: string
  nome: string
}

// Busca o perfil do usuário logado (papel + empresa). Se não houver ninguém
// logado, ou o usuário ainda não tiver perfil, retorna null.
export async function buscarMeuPerfil(): Promise<Perfil | null> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data, error } = await supabase
    .from('perfis')
    .select('user_id, nome, role, empresa_id')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (error) return null
  return (data as any) ?? null
}

export async function listarEmpresas(): Promise<Empresa[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('empresas').select('id, nome').order('nome')
  if (error) throw error
  return (data as any) ?? []
}

// Qual empresa o admin escolheu visualizar. Fica guardado só no navegador —
// não é uma "sessão falsa": quem está autenticado continua sendo o admin, isto
// aqui é apenas o contexto de qual empresa ele está olhando.
const CHAVE_EMPRESA_ATIVA = 'modernize_empresa_ativa'

export function lerEmpresaAtiva(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(CHAVE_EMPRESA_ATIVA)
  } catch {
    return null
  }
}

export function definirEmpresaAtiva(empresaId: string) {
  try {
    window.localStorage.setItem(CHAVE_EMPRESA_ATIVA, empresaId)
  } catch {}
}

export function limparEmpresaAtiva() {
  try {
    window.localStorage.removeItem(CHAVE_EMPRESA_ATIVA)
  } catch {}
}
