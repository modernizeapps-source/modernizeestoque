import { createClient } from './client'

export type Papel = 'admin' | 'owner' | 'funcionario'

export type Perfil = {
  user_id: string
  nome: string | null
  role: Papel
  empresa_id: string | null
  ativo: boolean
  idioma: 'pt' | 'es'
}

export type Empresa = {
  id: string
  nome: string
}

// Quais telas cada papel pode abrir.
// O funcionário só precisa do que usa no balcão: vender, consultar produto e
// operar o próprio caixa. Configurações, relatórios e equipe ficam com o dono.
export const TELAS_POR_PAPEL: Record<Papel, string[]> = {
  admin: ['/', '/venda', '/produtos', '/caixa', '/historico', '/relatorios', '/configuracoes', '/categorias', '/equipe', '/admin'],
  owner: ['/', '/venda', '/produtos', '/caixa', '/historico', '/relatorios', '/configuracoes', '/categorias', '/equipe'],
  funcionario: ['/', '/venda', '/produtos', '/caixa'],
}

export function podeAbrir(papel: Papel | null | undefined, caminho: string): boolean {
  if (!papel) return false
  const permitidas = TELAS_POR_PAPEL[papel] ?? []
  return permitidas.some((t) => (t === '/' ? caminho === '/' : caminho === t || caminho.startsWith(t + '/')))
}

// O funcionário consulta produtos, mas quem cadastra, edita e apaga é o dono
export function podeEditarProdutos(papel: Papel | null | undefined): boolean {
  return papel === 'owner' || papel === 'admin'
}

export function podeVerDinheiroDoNegocio(papel: Papel | null | undefined): boolean {
  return papel === 'owner' || papel === 'admin'
}

export function podeGerenciarEquipe(papel: Papel | null | undefined): boolean {
  return papel === 'owner' || papel === 'admin'
}

export async function buscarMeuPerfil(): Promise<Perfil | null> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data, error } = await supabase
    .from('perfis')
    .select('user_id, nome, role, empresa_id, ativo, idioma')
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

export async function salvarIdioma(idioma: 'pt' | 'es'): Promise<void> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return
  const { error } = await supabase.from('perfis').update({ idioma }).eq('user_id', auth.user.id)
  if (error) throw error
}

// ————— Equipe (o dono gerencia seus funcionários) —————

export type MembroEquipe = {
  user_id: string
  nome: string | null
  role: Papel
  ativo: boolean
  idioma: 'pt' | 'es'
}

export async function listarEquipe(empresaId: string): Promise<MembroEquipe[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('perfis')
    .select('user_id, nome, role, ativo, idioma')
    .eq('empresa_id', empresaId)
    .in('role', ['owner', 'funcionario'])
    .order('nome')
  if (error) throw error
  return (data as any) ?? []
}

export async function definirAtivo(userId: string, ativo: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('perfis').update({ ativo }).eq('user_id', userId)
  if (error) throw error
}

export async function renomearMembro(userId: string, nome: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('perfis').update({ nome }).eq('user_id', userId)
  if (error) throw error
}

// ————— Convites —————

export type Convite = {
  id: string
  codigo: string
  nome: string
  role: Papel
  usado_em: string | null
  expira_em: string
  criado_em: string
}

export async function criarConvite(nome: string, empresaId: string): Promise<{ id: string; codigo: string }> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data, error } = await supabase.rpc('criar_convite', {
    p_nome: nome,
    p_empresa_id: empresaId,
    p_role: 'funcionario',
    p_criado_por: auth.user?.id ?? null,
  })
  if (error) throw error
  const row = (data as any[])[0]
  return { id: row.id, codigo: row.codigo }
}

export async function listarConvitesPendentes(empresaId: string): Promise<Convite[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('convites')
    .select('id, codigo, nome, role, usado_em, expira_em, criado_em')
    .eq('empresa_id', empresaId)
    .is('usado_em', null)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data as any) ?? []
}

export async function cancelarConvite(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('convites').delete().eq('id', id)
  if (error) throw error
}

// Usado na tela de criar conta: liga o usuário novo ao convite
export async function usarConvite(codigo: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('usar_convite', {
    p_codigo: codigo.toUpperCase().trim(),
    p_user_id: userId,
  })
  if (error) throw error
}

// ————— Empresa ativa (só o admin troca) —————

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
  try { window.localStorage.setItem(CHAVE_EMPRESA_ATIVA, empresaId) } catch {}
}

export function limparEmpresaAtiva() {
  try { window.localStorage.removeItem(CHAVE_EMPRESA_ATIVA) } catch {}
}
