'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  buscarTaxas, salvarTaxas, TaxasPagamento, TAXAS_PADRAO, TAXA_LABEL,
  Maquininha, listarMaquininhas, criarMaquininha, atualizarMaquininha, removerMaquininha,
} from '@/lib/supabase/configuracoes'

export default function ConfiguracoesPage() {
  const [taxas, setTaxas] = useState<TaxasPagamento>(TAXAS_PADRAO)
  const [maquininhas, setMaquininhas] = useState<Maquininha[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  // nova maquininha
  const [mostrarNova, setMostrarNova] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoCredito, setNovoCredito] = useState('')
  const [novoDebito, setNovoDebito] = useState('')
  const [novoPix, setNovoPix] = useState('')

  // edição de maquininha
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editCredito, setEditCredito] = useState('')
  const [editDebito, setEditDebito] = useState('')
  const [editPix, setEditPix] = useState('')

  async function carregar() {
    try {
      const [t, m] = await Promise.all([buscarTaxas(), listarMaquininhas(true)])
      setTaxas(t)
      setMaquininhas(m)
    } catch (e) {
      setErro('Não foi possível carregar as configurações.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function avisar(msg: string) {
    setSucesso(msg)
    setTimeout(() => setSucesso(null), 2500)
  }

  function num(v: string) {
    const n = parseFloat(v.replace(',', '.'))
    return isNaN(n) ? 0 : n
  }

  async function handleSalvarTaxas(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      await salvarTaxas(taxas)
      avisar('Taxas salvas!')
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleCriarMaquininha(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!novoNome.trim()) return setErro('Dê um nome pra maquininha.')
    try {
      await criarMaquininha(novoNome.trim(), num(novoCredito), num(novoDebito), num(novoPix))
      setNovoNome(''); setNovoCredito(''); setNovoDebito(''); setNovoPix(''); setMostrarNova(false)
      await carregar()
      avisar('Maquininha adicionada!')
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível adicionar.')
    }
  }

  function comecarEdicao(m: Maquininha) {
    setEditandoId(m.id)
    setEditNome(m.nome)
    setEditCredito(String(m.taxa_credito))
    setEditDebito(String(m.taxa_debito))
    setEditPix(String(m.taxa_pix))
  }

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    if (!editandoId) return
    setErro(null)
    try {
      await atualizarMaquininha(editandoId, {
        nome: editNome.trim(),
        taxa_credito: num(editCredito),
        taxa_debito: num(editDebito),
        taxa_pix: num(editPix),
      })
      setEditandoId(null)
      await carregar()
      avisar('Maquininha atualizada!')
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.')
    }
  }

  async function handleRemover(m: Maquininha) {
    if (!confirm(`Remover "${m.nome}"? As vendas antigas continuam registradas normalmente.`)) return
    try {
      await removerMaquininha(m.id)
      await carregar()
      avisar('Maquininha removida.')
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível remover.')
    }
  }

  if (carregando) {
    return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>
  }

  return (
    <div className="container" style={{ maxWidth: 460, paddingBottom: 60 }}>
      <Link href="/" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 6 }}>Configurações</h1>

      {erro && <p className="error-text" style={{ marginTop: 12 }}>{erro}</p>}
      {sucesso && <div className="success-box" style={{ marginTop: 12 }}>✓ {sucesso}</div>}

      {/* Maquininhas */}
      <p className="section-title" style={{ marginTop: 22 }}>Maquininhas de cartão</p>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
        Cadastre as maquininhas que você usa, cada uma com as taxas que ela cobra. Na hora da venda
        você escolhe onde foi passado tocando num botão, e o lucro já desconta a taxa certa.
        Se a maquininha não recebe Pix, deixe esse campo em 0.
      </p>

      {maquininhas.length === 0 && !mostrarNova && (
        <div className="card" style={{ marginBottom: 12, textAlign: 'center', padding: 18 }}>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Nenhuma maquininha cadastrada ainda.</p>
        </div>
      )}

      {maquininhas.map((m) => (
        <div key={m.id} className="card" style={{ marginBottom: 8 }}>
          {editandoId === m.id ? (
            <form onSubmit={handleSalvarEdicao}>
              <label className="label">Nome</label>
              <input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="input" style={{ marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="label">Crédito %</label>
                  <input type="number" step="0.01" value={editCredito} onChange={(e) => setEditCredito(e.target.value)} className="input" style={{ padding: '10px 8px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="label">Débito %</label>
                  <input type="number" step="0.01" value={editDebito} onChange={(e) => setEditDebito(e.target.value)} className="input" style={{ padding: '10px 8px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="label">Pix %</label>
                  <input type="number" step="0.01" value={editPix} onChange={(e) => setEditPix(e.target.value)} className="input" style={{ padding: '10px 8px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setEditandoId(null)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: 10 }}>Salvar</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{m.nome}</div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 3 }}>
                  crédito {Number(m.taxa_credito).toFixed(2).replace('.', ',')}% · débito {Number(m.taxa_debito).toFixed(2).replace('.', ',')}% · pix {Number(m.taxa_pix).toFixed(2).replace('.', ',')}%
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => comecarEdicao(m)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Editar</button>
                <button onClick={() => handleRemover(m)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}>×</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {mostrarNova ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <form onSubmit={handleCriarMaquininha}>
            <label className="label">Nome da maquininha</label>
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: InfinitePay, Cielo, Stone" className="input" style={{ marginBottom: 12 }} autoFocus />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="label">Crédito %</label>
                <input type="number" step="0.01" value={novoCredito} onChange={(e) => setNovoCredito(e.target.value)} placeholder="0" className="input" style={{ padding: '10px 8px' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="label">Débito %</label>
                <input type="number" step="0.01" value={novoDebito} onChange={(e) => setNovoDebito(e.target.value)} placeholder="0" className="input" style={{ padding: '10px 8px' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="label">Pix %</label>
                <input type="number" step="0.01" value={novoPix} onChange={(e) => setNovoPix(e.target.value)} placeholder="0" className="input" style={{ padding: '10px 8px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setMostrarNova(false)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: 10 }}>Adicionar</button>
            </div>
          </form>
        </div>
      ) : (
        <button onClick={() => setMostrarNova(true)} className="btn-secondary" style={{ width: '100%', padding: 11, marginBottom: 24 }}>
          + Adicionar maquininha
        </button>
      )}

      {/* Outras formas */}
      <p className="section-title">Pix na sua chave e dinheiro</p>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
        Taxas do Pix recebido direto na sua chave (fora da maquininha) e do dinheiro.
        Normalmente as duas são 0%.
      </p>

      <form onSubmit={handleSalvarTaxas}>
        <div className="card" style={{ marginBottom: 14 }}>
          {(Object.keys(TAXA_LABEL) as (keyof TaxasPagamento)[]).map((chave, i, todas) => (
            <div key={chave} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: i < todas.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <label style={{ fontSize: 13 }}>{TAXA_LABEL[chave]}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number" step="0.01" min="0"
                  value={taxas[chave] === 0 ? '' : taxas[chave]}
                  onChange={(e) => setTaxas((p) => ({ ...p, [chave]: num(e.target.value) }))}
                  placeholder="0" className="input"
                  style={{ width: 82, textAlign: 'right', padding: '8px 10px' }}
                />
                <span className="mono" style={{ fontSize: 13, color: 'var(--text-dim)' }}>%</span>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={salvando} className="btn-primary" style={{ width: '100%', padding: 13 }}>
          {salvando ? 'Salvando...' : 'Salvar taxas'}
        </button>
      </form>
    </div>
  )
}
