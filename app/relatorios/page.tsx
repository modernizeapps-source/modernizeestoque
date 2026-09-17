'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { buscarRelatorio, inicioFimPeriodo, Relatorio, LimitesPeriodo, LIMITES_PADRAO } from '@/lib/supabase/relatorios'
import CalendarioPeriodo from './CalendarioPeriodo'
import EvolucaoDiaSemana from './EvolucaoDiaSemana'
import FechamentoMensal from './FechamentoMensal'
import ConfigPeriodosDia, { lerLimitesPeriodo } from './ConfigPeriodosDia'

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  dinheiro: 'Dinheiro',
}

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

function formatarDataCurta(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

export default function RelatoriosPage() {
  const [periodoLabel, setPeriodoLabel] = useState('Este mês')
  const [range, setRange] = useState(() => inicioFimPeriodo('mes'))
  const [seletorAberto, setSeletorAberto] = useState(false)
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [limitesPeriodo, setLimitesPeriodo] = useState<LimitesPeriodo>(LIMITES_PADRAO)
  const [mostrarTodasCategorias, setMostrarTodasCategorias] = useState(false)

  useEffect(() => {
    setLimitesPeriodo(lerLimitesPeriodo())
  }, [])

  useEffect(() => {
    setCarregando(true)
    buscarRelatorio(range.inicio, range.fim, limitesPeriodo).then(setRelatorio).catch(() => setErro('Não foi possível carregar o relatório.')).finally(() => setCarregando(false))
  }, [range, limitesPeriodo])

  function handleSelecionarPeriodo(inicioDia: Date, fimDia: Date) {
    const fmt = (d: Date, horaFim: boolean) => {
      const base = new Date(d)
      if (horaFim) base.setUTCDate(base.getUTCDate() + 1)
      const y = base.getUTCFullYear()
      const m = String(base.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(base.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${dd}T00:00:00-03:00`
    }
    setRange({ inicio: fmt(inicioDia, false), fim: fmt(fimDia, true) })

    const hoje = new Date().toISOString().slice(0, 10)
    const mesmodia = inicioDia.getTime() === fimDia.getTime()
    if (mesmodia && inicioDia.toISOString().slice(0, 10) === hoje) setPeriodoLabel('Hoje')
    else if (mesmodia) setPeriodoLabel(formatarDataCurta(inicioDia))
    else setPeriodoLabel(`${formatarDataCurta(inicioDia)} – ${formatarDataCurta(fimDia)}`)

    setSeletorAberto(false)
  }

  const maiorDiaSemana = relatorio ? Math.max(...relatorio.porDiaSemana.map((d) => d.total), 1) : 1

  return (
    <div className="container">
      <Link href="/" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Relatórios</h1>

      <button onClick={() => setSeletorAberto(true)} className="btn-primary" style={{ marginBottom: 20 }}>
        📅 {periodoLabel} ▾
      </button>

      {seletorAberto && <CalendarioPeriodo onSelecionar={handleSelecionarPeriodo} onFechar={() => setSeletorAberto(false)} />}

      {carregando && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando...</p>}
      {erro && <p className="error-text">{erro}</p>}

      {relatorio && !carregando && (
        <>
          <p className="section-title">Visão geral</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total vendido</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 500, marginTop: 6, color: 'var(--cyan)' }}>{reais(relatorio.totalVendido)}</div>
            </div>
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Lucro</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 500, marginTop: 6, color: 'var(--green)' }}>{reais(relatorio.lucro)}</div>
            </div>
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Vendas</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{relatorio.numVendas}</div>
            </div>
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)',
