'use client'

import { useState } from 'react'
import { LimitesPeriodo, LIMITES_PADRAO } from '@/lib/supabase/relatorios'

const CHAVE_STORAGE = 'estoque-mercadinho:limites-periodo'

export function lerLimitesPeriodo(): LimitesPeriodo {
  if (typeof window === 'undefined') return LIMITES_PADRAO
  try {
    const salvo = window.localStorage.getItem(CHAVE_STORAGE)
    if (!salvo) return LIMITES_PADRAO
    const parsed = JSON.parse(salvo)
    if (typeof parsed.manha === 'number' && typeof parsed.tarde === 'number' && typeof parsed.noite === 'number') return parsed
    return LIMITES_PADRAO
  } catch {
    return LIMITES_PADRAO
  }
}

type Props = { limites: LimitesPeriodo; onSalvar: (novos: LimitesPeriodo) => void }

function h(n: number) {
  return `${String(n).padStart(2, '0')}h`
}

export default function ConfigPeriodosDia({ limites, onSalvar }: Props) {
  const [aberto, setAberto] = useState(false)
  const [manha, setManha] = useState(limites.manha)
  const [tarde, setTarde] = useState(limites.tarde)
  const [noite, setNoite] = useState(limites.noite)
  const [erro, setErro] = useState<string | null>(null)

  function handleSalvar() {
    if (!(0 < manha && manha < tarde && tarde < noite && noite < 24)) {
      setErro('Os horários precisam estar em ordem crescente (manhã < tarde < noite).')
      return
    }
    const novos = { manha, tarde, noite }
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(novos))
    onSalvar(novos)
    setAberto(false)
    setErro(null)
  }

  const inputStyle: React.CSSProperties = { width: 46, padding: '4px 6px', textAlign: 'center', fontSize: 12 }

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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontSize: 12, width: 74 }}>Madrugada</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>{h(0)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>até</span>
            <input type="number" min={1} max={23} value={manha} onChange={(e) => setManha(Number(e.target.value))} className="input mono" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontSize: 12, width: 74 }}>Manhã</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>{h(manha)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>até</span>
            <input type="number" min={1} max={23} value={tarde} onChange={(e) => setTarde(Number(e.target.value))} className="input mono" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontSize: 12, width: 74 }}>Tarde</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>{h(tarde)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>até</span>
            <input type="number" min={1} max={23} value={noite} onChange={(e) => setNoite(Number(e.target.value))} className="input mono" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, width: 74 }}>Noite</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>{h(noite)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>até</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-dim)', width: 46, textAlign: 'center' }}>24h</span>
          </div>

          {erro && <p className="error-text" style={{ fontSize: 11, marginBottom: 8 }}>{erro}</p>}

          <button onClick={handleSalvar} className="btn-primary" style={{ width: '100%', padding: 8, fontSize: 12 }}>
            Salvar
          </button>
        </div>
      )}
    </div>
  )
}
