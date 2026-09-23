'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n'
import SeletorIdioma from './SeletorIdioma'

// Tela inicial de quem está no balcão. Sem faturamento, sem lucro, sem taxas —
// só o que ele precisa pra trabalhar: vender e saber se o caixa está aberto.
export default function PainelFuncionario({
  caixaAberto, nome, aoTrocar,
}: {
  caixaAberto: boolean | null
  nome: string | null
  aoTrocar: () => void
}) {
  const t = useT()

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '0 24px 48px' }}>

      {/* Quem está operando, sempre visível, com a troca de turno do lado */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 14, marginBottom: 26, paddingBottom: 16, borderBottom: '1px solid var(--line)',
      }}>
        <div>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            {t('quemEstaOperando')}
          </div>
          <div style={{ fontSize: 22, fontWeight: 500, marginTop: 5 }}>{nome ?? '—'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SeletorIdioma />
          <button onClick={aoTrocar} className="btn-secondary" style={{ padding: '9px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
            {t('trocarUsuario')}
          </button>
        </div>
      </div>

      {caixaAberto === false && (
        <Link
          href="/caixa"
          className="card"
          style={{
            display: 'block', marginBottom: 18, textDecoration: 'none',
            borderColor: 'rgba(255,180,84,0.4)', background: 'rgba(255,180,84,0.04)',
          }}
        >
          <span style={{ color: 'var(--amber)', fontSize: 13.5 }}>
            ⚠ {t('semCaixaAberto')} — {t('abrirCaixa').toLowerCase()}
          </span>
        </Link>
      )}

      <Link
        href="/venda"
        className="btn-primary"
        style={{
          width: '100%', padding: '22px 0', fontSize: 18, justifyContent: 'center',
          marginBottom: 14, boxShadow: '0 0 28px -8px rgba(79,216,255,0.5)',
        }}
      >
        + {t('novaVenda')}
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Link href="/caixa" className="btn-secondary" style={{ padding: '16px 0', fontSize: 14.5, justifyContent: 'center' }}>
          {t('caixa')}{caixaAberto ? ' · ✓' : ''}
        </Link>
        <Link href="/produtos" className="btn-secondary" style={{ padding: '16px 0', fontSize: 14.5, justifyContent: 'center' }}>
          {t('produtos')}
        </Link>
      </div>
    </div>
  )
}
