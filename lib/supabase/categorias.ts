import { createClient } from './client'

export type Categoria = {
  id: string
  nome: string
}

export async function listarCategorias(): Promise<Categoria[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome')
    .order('nome', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function criarCategoria(nome: string): Promise<Categoria> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categorias')
    .insert({ nome })
    .select('id, nome')
    .single()

  if (error) throw error
  return data
}
