'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  listarEquipe, criarConvite, listarConvitesPendentes, cancelarConvite,
  definirAtivo, renomearMembro, podeGerenciarEquipe,
  MembroEquipe, Convite,
} from '@/lib/supabase/auth'
import { primeiraMaiuscula } from '@/lib/supabase/produtos'
import { useSessao } from '../SessaoProvider'
import { useIsDesktop } from '@/lib/useIsDesktop'
import NavDesktop from '../NavDesktop'
import CheckConfirmacao from '../CheckConfirmacao'

export default function EquipePage() {
  const isDesktop = useIsDesktop()
  const { perfil, carregando: carregandoPerfil } = useSessao()

  const [equipe, setEquipe] = useState<MembroEquipe[]>([])
  const [convites, setConvites] = useState<Convite[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [nomeNovo, setNomeNovo] = useState('')
  const [criando, setCriando] = useState(false)
  const [conviteGerado, setConviteGerado] = useState<{ nome: string; codigo: string } | null>(null)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEdit, setNomeEdit] = useState('')

  async function carregar() {
    if (!perfil?.empresa_id) return
    try {
      const [e, c] = await Promise.all([
        listarEquipe(perfil.empresa_id),
        listarConvitesPendentes(perfil.empresa_id),
      ])
      setEquipe(e)
      setConvites(c)
    } catch {
      setErro('Não foi possível carregar a equipe.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (!carregandoPerfil) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoPerfil, perfil?.empresa_id])

  function mostrar(msg: string) {
    setAviso(msg)
    setTimeout(() => setAviso(null), 3500)
  }

  async function handleConvidar(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeNovo.trim() || !perfil?.empresa_id) return
    setCriando(true)
    setErro(null)
    try {
      const { codigo } = await criarConvite(nomeNovo.trim(), perfil.empresa_id)
      setConviteGerado({ nome: nomeNovo.trim(), codigo })
      setNomeNovo('')
      await carregar()
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível gerar o convite.')
    } finally {
      setCriando(false)
    }
  }

  async function handleDesativar(m: MembroEquipe) {
    const acao = m.ativo ? 'desativar' : 'reativar'
    if (!confirm(
      m.ativo
        ? `Desativar o acesso de ${m.nome}?\n\nEle não vai mais conseguir entrar no sistema, mas as vendas e caixas dele continuam no histórico.`
        : `Reativar o acesso de ${m.nome}?`
    )) return

    try {
      await definirAtivo(m.user_id, !m.ativo)
      await carregar()
      mostrar(m.ativo ? `${m.nome} não tem mais acesso.` : `${m.nome} voltou a ter acesso.`)
    } catch {
      setErro(`Não foi possível ${acao} o acesso.`)
    }
  }

  async function handleSalvarNome(userId: string) {
    if (!nomeEdit.trim()) return
    try {
      await renomearMembro(userId, nomeEdit.trim())
      setEditandoId(null)
      await carregar()
      mostrar('Nome atualizado.')
    } catch {
      setErro('Não foi possível salvar o nome.')
    }
  }

  async function handleCancelarConvite(c: Convite) {
    if (!confirm(`Cancelar o convite de ${c.nome}? O código ${c.codigo} deixa de funcionar.`)) return
    try {
      await cancelarConvite(c.id)
      await carregar()
      mostrar('Convite cancelado.')
    } catch {
      setErro('Não foi possível cancelar.')
    }
  }

  function copiar(texto: string) {
    try {
      navigator.clipboard.writeText(texto)
      mostrar('Código copiado!')
    } catch {}
  }

  if (carregandoPerfil || carregando) {
    return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>
  }

  if (!podeGerenciarEquipe(perfil?.role)) {
    return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Essa área é só do dono.</p>
  }

  const ativos = equipe.filter((m) => m.ativo).length

  return (
    <>
    {isDesktop && <NavDesktop />}
    <div className="container col-media" style={{ maxWidth: 560, paddingBottom: 60 }}>
      <Link href="/" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13, marginBottom: 14 }}>← Voltar</Link>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 className="titulo-pagina" style={{ fontSize: 20, fontWeight: 500 }}>Funcionários</h1>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
          {ativos} {ativos === 1 ? 'com acesso' : 'com acesso'}
        </span>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 20, lineHeight: 1.55 }}>
        Cada pessoa entra com a conta dela. Funcionários veem só Venda, Produtos e Caixa —
        relatórios, configurações e esta tela ficam com você.
      </p>

      {erro && <p className="error-text" style={{ marginBottom: 12 }}>{erro}</p>}
      {aviso && (
        <div className="success-box" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 9 }}>
          <CheckConfirmacao />
          <span>{aviso}</span>
        </div>
      )}

      {/* Código recém-gerado, em destaque pra passar pro funcionário */}
      {conviteGerado && (
        <div className="card card-accent" style={{ marginBottom: 20, textAlign: 'center', padding: 20 }}>
          <p style={{ fontSize: 13, marginBottom: 4 }}>Código para <strong>{conviteGerado.nome}</strong></p>
          <p className="mono" style={{ fontSize: 34, color: 'var(--cyan)', letterSpacing: '0.16em', margin: '10px 0' }}>
            {conviteGerado.codigo}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.55, marginBottom: 14 }}>
            Passe esse código para {conviteGerado.nome}. Ele entra no site, clica em
            "Criar conta", digita o código e escolhe a própria senha. Vale por 7 dias.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => copiar(conviteGerado.codigo)} className="btn-secondary" style={{ flex: 1, padding: 10, fontSize: 12.5 }}>
              Copiar código
            </button>
            <button onClick={() => setConviteGerado(null)} className="btn-primary" style={{ flex: 1, padding: 10, fontSize: 12.5 }}>
              Pronto
            </button>
          </div>
        </div>
      )}

      {/* Adicionar */}
      <form onSubmit={handleConvidar} style={{ display: 'flex', gap: 9, marginBottom: 24 }}>
        <input
          value={nomeNovo}
          onChange={(e) => setNomeNovo(primeiraMaiuscula(e.target.value))}
          placeholder="Nome do funcionário"
          className="input"
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={criando || !nomeNovo.trim()} className="btn-primary" style={{ padding: '0 18px', whiteSpace: 'nowrap' }}>
          {criando ? '...' : '+ Adicionar'}
        </button>
      </form>

      {/* Convites esperando */}
      {convites.length > 0 && (
        <>
          <p className="section-title">Esperando criar a conta</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {convites.map((c) => (
              <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nome}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--cyan)', marginTop: 3, letterSpacing: '0.1em' }}>
                    {c.codigo}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button onClick={() => copiar(c.codigo)} className="btn-secondary" style={{ padding: '6px 11px', fontSize: 12 }}>
                    Copiar
                  </button>
                  <button
                    onClick={() => handleCancelarConvite(c)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 17, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                    aria-label={`Cancelar convite de ${c.nome}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Equipe */}
      <p className="section-title">Na equipe</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {equipe.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
            Ninguém cadastrado ainda.
          </p>
        )}

        {equipe.map((m) => (
          <div key={m.user_id} className="card" style={{ opacity: m.ativo ? 1 : 0.55 }}>
            {editandoId === m.user_id ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={nomeEdit}
                  onChange={(e) => setNomeEdit(primeiraMaiuscula(e.target.value))}
                  className="input"
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button onClick={() => setEditandoId(null)} className="btn-secondary" style={{ padding: '0 13px', fontSize: 12.5 }}>Cancelar</button>
                <button onClick={() => handleSalvarNome(m.user_id)} className="btn-primary" style={{ padding: '0 13px', fontSize: 12.5 }}>Salvar</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {m.nome ?? 'Sem nome'}
                    {m.user_id === perfil?.user_id && (
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 7 }}>(você)</span>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 3 }}>
                    {m.role === 'owner' ? 'dono' : 'funcionário'}
                    {!m.ativo && ' · sem acesso'}
                    {m.idioma === 'es' && ' · español'}
                  </div>
                </div>

                {m.user_id !== perfil?.user_id && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setEditandoId(m.user_id); setNomeEdit(m.nome ?? '') }}
                      className="btn-secondary"
                      style={{ padding: '6px 11px', fontSize: 12 }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDesativar(m)}
                      className={m.ativo ? 'btn-secondary' : 'btn-primary'}
                      style={{ padding: '6px 11px', fontSize: 12 }}
                    >
                      {m.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 18, lineHeight: 1.55 }}>
        Ao desativar alguém, ele perde o acesso na hora, mas as vendas e os caixas dele
        continuam no histórico com o nome dele.
      </p>
    </div>
    </>
  )
}
