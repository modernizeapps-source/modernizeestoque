import { createClient } from './client'

export type Categoria = {
  id: string
  nome: string
  unidades_por_fardo?: number | null
}

export async function listarCategorias(): Promise<Categoria[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, unidades_por_fardo')
    .order('nome', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function criarCategoria(nome: string): Promise<Categoria> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categorias')
    .insert({ nome })
    .select('id, nome, unidades_por_fardo')
    .single()

  if (error) throw error
  return data
}

export async function renomearCategoria(id: string, nome: string): Promise<void> {
  const supabase = createClient()
  // Como os produtos apontam pra categoria por id, renomear já reflete em
  // todos eles automaticamente — não precisa atualizar produto por produto.
  const { error } = await supabase.from('categorias').update({ nome }).eq('id', id)
  if (error) throw error
}

// Quantas unidades vêm num fardo dessa categoria (cerveja, refrigerante...).
// null significa que a categoria não é vendida em fardo.
export async function definirUnidadesPorFardo(id: string, unidades: number | null): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('categorias')
    .update({ unidades_por_fardo: unidades && unidades > 0 ? unidades : null })
    .eq('id', id)
  if (error) throw error
}

export async function contarProdutosDaCategoria(id: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('produtos')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id)
  if (error) throw error
  return count ?? 0
}

// Exclui a categoria. Os produtos dela não são apagados: vão para a categoria
// de destino informada, ou ficam sem categoria se não houver destino.
export async function excluirCategoria(id: string, destinoId: string | null): Promise<void> {
  const supabase = createClient()

  const { error: erroMover } = await supabase
    .from('produtos')
    .update({ categoria_id: destinoId })
    .eq('categoria_id', id)
  if (erroMover) throw erroMover

  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}
