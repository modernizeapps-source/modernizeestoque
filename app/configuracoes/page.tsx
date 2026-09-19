'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { buscarTaxas, salvarTaxas, TaxasPagamento, TAXAS_PADRAO, TAXA_LABEL } from '@/lib/supabase/configuracoes'

export default function ConfiguracoesPage() {
  const [taxas, setTaxas] = useState<TaxasPagamento>(TAXAS_PADRAO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    buscarTaxas()
      .then(setTaxas)
      .catch(() => setErro('Não foi possível carregar as configurações.'))
      .finally(() => setCarregando(false))
  }, [])

  function alterarTaxa(chave: keyof TaxasPagamento, valor: string) {
    const numero = valor === '' ? 0 : parseFloat(valor.replace(',', '.'))
    setTaxas((prev) => ({ ...prev, [chave]: isNaN(numero) ? 0 : numero }))
    setSucesso(false)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      await salvarTaxas(taxas)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 2500)
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <Link href="/" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 6 }}>Configurações</h1>

      <p className="section-title" style={{ marginTop: 20 }}>Taxas por forma de pagamento</p>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.5 }}>
        Preencha a taxa que a maquininha ou o banco cobra de você em cada forma de pagamento.
        O lucro nos relatórios passa a descontar esses valores automaticamente, mostrando quanto
        realmente sobra. Se não souber alguma, deixe em 0 por enquanto.
      </p>

      <form onSubmit={handleSalvar}>
        <div className="card" style={{ marginBottom: 16 }}>
          {(Object.keys(TAXA_LABEL) as (keyof TaxasPagamento)[]).map((chave, i, todas) => (
            <div
              key={chave}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < todas.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <label style={{ fontSize: 13 }}>{TAXA_LABEL[chave]}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxas[chave] === 0 ? '' : taxas[chave]}
                  onChange={(e) => alterarTaxa(chave, e.target.value)}
                  placeholder="0"
                  className="input"
                  style={{ width: 82, textAlign: 'right', padding: '8px 10px' }}
                />
                <span className="mono" style={{ fontSize: 13, color: 'var(--text-dim)' }}>%</span>
              </div>
            </div>
          ))}
        </div>

        {erro && <p className="error-text" style={{ marginBottom: 10 }}>{erro}</p>}
        {sucesso && <div className="success-box" style={{ marginBottom: 10 }}>✓ Configurações salvas!</div>}

        <button type="submit" disabled={salvando} className="btn-primary" style={{ width: '100%', padding: 13 }}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </form>

      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 16, lineHeight: 1.5 }}>
        Exemplo: se a maquininha cobra R$ 3,50 a cada R$ 100 vendidos no crédito, a taxa é 3,5%.
      </p>
    </div>
  )
}
