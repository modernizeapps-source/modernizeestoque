import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente com a chave "service role" — só pode ser usado no servidor (rotas de
// API dentro de app/api/...), NUNCA no navegador. Ele ignora as regras de
// segurança (RLS) do banco, por isso só é usado nos lugares em que a gente
// mesmo controla exatamente o que está sendo feito: o webhook da InfinitePay
// e a checagem de pagamento — que não têm um usuário logado por trás, já que
// quem chama é o servidor da InfinitePay, não o Misa.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
