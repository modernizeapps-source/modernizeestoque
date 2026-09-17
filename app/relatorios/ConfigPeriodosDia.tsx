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

export default function ConfigPeriodosDia({ limites, onSalvar }: Props) {
  const [aberto, setAberto] = useState(false)
  const [manha, setManha] = useState(limites.manha)
  const [tarde, setTarde] = useState(limites.tarde)
  const [noite, setNoite] = useState(limites.noite)
  const [erro, setErro] = useState<string | null>(null)

  function handleSalvar() {
    if (!(manha < tarde && tarde < noite)) {
      setErro('Os horários precisam estar em ordem crescente (manhã < tarde < noite).')
      return
    }
    const novos = { manha, tarde, noite }
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(novos))
    onSalvar(novos)
    setAberto(false)
    setErro(null)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setAberto(!aberto)}
        aria-label="Ajustar horários"
        style={{ border: 'none', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, padding: 2, opacity: 0.6 }}
      >
        ✎
      </button>

      {aberto && (
        <div style={{ position: 'absolute', top: '120%', right: 0, zIndex: 20, background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: 14, width: 220 }}>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>A que horas cada período começa?</p>

          {[
            { label: 'Manhã começa às', valor: manha, set: setManha },
            { label: 'Tarde começa às', valor: tarde, set: setTarde },
            { label: 'Noite começa às', valor: noite, set: setNoite },
          ].map((campo) => (
            <div key={campo.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12 }}>{campo.label}</span>
              <input
                type="number"
                min={0}
                max={23}
                value={campo.valor}
                onChange={(e) => campo.set(Number(e.target.value))}
                className="input mono"
                style={{ width: 50, padding: '4px 6px', textAlign: 'center', fontSize: 12 }}
              />
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
