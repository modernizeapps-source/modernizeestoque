'use client'

import { useState } from 'react'
import { LimitesPeriodo, LIMITES_PADRAO, FaixaHorario } from '@/lib/supabase/relatorios'

const CHAVE_STORAGE = 'estoque-mercadinho:limites-periodo'

export function lerLimitesPeriodo(): LimitesPeriodo {
  if (typeof window === 'undefined') return LIMITES_PADRAO
  try {
    const salvo = window.localStorage.getItem(CHAVE_STORAGE)
    if (!salvo) return LIMITES_PADRAO
    const parsed = JSON.parse(salvo)
    if (parsed && parsed.madrugada && parsed.manha && parsed.tarde && parsed.noite) return parsed
    return LIMITES_PADRAO
  } catch {
    return LIMITES_PADRAO
  }
}

type Props = { limites: LimitesPeriodo; onSalvar: (novos: LimitesPeriodo) => void }

export default function ConfigPeriodosDia({ limites, onSalvar }: Props) {
  const [aberto, setAberto] = useState(false)
  const [madrugada, setMadrugada] = useState<FaixaHorario>(limites.madrugada)
  const [manha, setManha] = useState<FaixaHorario>(limites.manha)
  const [tarde, setTarde] = useState<FaixaHorario>(limites.tarde)
  const [noite, setNoite] = useState<FaixaHorario>(limites.noite)
  const [erro, setErro] = useState<string | null>(null)

  function handleSalvar() {
    const linhas = [madrugada, manha, tarde, noite]
    for (const l of linhas) {
      if (!(l.inicio >= 0 && l.fim <= 24 && l.inicio < l.fim)) {
        setErro('Cada período precisa ter início antes do fim, entre 0 e 24.')
        return
      }
    }
    const novos = { madrugada, manha, tarde, noite }
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(novos))
    onSalvar(novos)
    setAberto(false)
    setErro(null)
  }

  const inputStyle: React.CSSProperties = { width: 46, padding: '4px 6px', textAlign: 'center', fontSize: 12 }

  const linhas: { nome: string; valor: FaixaHorario; set: (f: FaixaHorario) => void }[] = [
    { nome: 'Madrugada', valor: madrugada, set: setMadrugada },
    { nome: 'Manhã', valor: manha, set: setManha },
    { nome: 'Tarde', valor: tarde, set: setTarde },
    { nome: 'Noite', valor: noite, set: setNoite },
  ]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setAberto(!aberto)}
        aria-label="Ajustar horários"
        style={{ border: 'none', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: 2, opacity: 0.7 }}
      >
        ⚙
      </button>

      {aberto && (
        <div style={{ position: 'absolute', top: '120%', right: 0, zIndex: 20, background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: 14, width: 260 }}>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>Início e fim de cada período</p>

          {linhas.map((l) => (
            <div key={l.nome} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <span style={{ fontSize: 12, width: 74 }}>{l.nome}</span>
              <input type="number" min={0} max={24} value={l.valor.inicio} onChange={(e) => l.set({ ...l.valor, inicio: Number(e.target.value) })} className="input mono" style={inputStyle} />
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>até</span>
              <input type="number" min={0} max={24} value={l.valor.fim} onChange={(e) => l.set({ ...l.valor, fim: Number(e.target.value) })} className="input mono" style={inputStyle} />
            </div>
          ))}

          {erro && <p className="error-text" style={{ fontSize: 11, marginBottom: 8 }}>{erro}</p>}

          <button onClick={handleSalvar} className="btn-primary" style={{ width: '100%', padding: 8, fontSize: 12 }}>
            Salvar
          </button>
        </div>
      )}
    </div>
  )
}
