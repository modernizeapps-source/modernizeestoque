'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { buscarMinutosInatividade } from './supabase/configuracoes'

// Volta pra tela inicial quando ninguém mexe no sistema por um tempo.
//
// Em vez de um cronômetro simples, guarda a HORA da última atividade e compara
// com a hora atual. Isso é importante porque o navegador congela cronômetros de
// abas em segundo plano: se trocar de aba e voltar 10 minutos depois, um
// cronômetro comum poderia nem ter rodado. Comparando horários, o tempo conta
// de verdade — inclusive com a aba minimizada ou o computador em espera.
//
// A verificação acontece a cada 15 segundos e, principalmente, no instante em
// que a aba volta a ficar visível.
//
// Qualquer sinal de uso (mouse, teclado, toque, rolagem) marca uma nova
// atividade, então isso nunca interrompe alguém no meio de uma venda.
export function useVoltarPorInatividade() {
  const router = useRouter()
  const pathname = usePathname()
  const ultimaAtividadeRef = useRef<number>(Date.now())
  const minutosRef = useRef<number>(0)
  const jaVoltouRef = useRef(false)

  // Lê o tempo configurado. Relê a cada troca de tela, pra que uma alteração
  // feita em Configurações passe a valer na hora, sem precisar recarregar a
  // página inteira.
  useEffect(() => {
    let vivo = true
    buscarMinutosInatividade()
      .then((m) => { if (vivo) minutosRef.current = m })
      .catch(() => { minutosRef.current = 0 })
    return () => { vivo = false }
  }, [pathname])

  useEffect(() => {
    // Na própria tela inicial (e no login) não há pra onde voltar
    if (pathname === '/' || pathname === '/login') return

    jaVoltouRef.current = false
    ultimaAtividadeRef.current = Date.now()

    function marcarAtividade() {
      // Atividade só conta se a aba estiver realmente visível. Assim, com o
      // sistema em segundo plano, nada reinicia a contagem.
      if (document.visibilityState === 'visible') {
        ultimaAtividadeRef.current = Date.now()
      }
    }

    function verificar() {
      if (jaVoltouRef.current) return
      const minutos = minutosRef.current
      if (!minutos || minutos <= 0) return

      const paradoHa = Date.now() - ultimaAtividadeRef.current
      if (paradoHa >= minutos * 60 * 1000) {
        jaVoltouRef.current = true
        router.push('/')
      }
    }

    const eventos = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel']
    eventos.forEach((e) => window.addEventListener(e, marcarAtividade, { passive: true }))

    // Quando a aba volta a ficar visível, confere na hora se o tempo já passou
    function aoMudarVisibilidade() {
      if (document.visibilityState === 'visible') verificar()
    }
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    window.addEventListener('focus', verificar)

    // Verificação periódica, pra quando a aba está aberta e parada
    const intervalo = setInterval(verificar, 15000)

    return () => {
      clearInterval(intervalo)
      eventos.forEach((e) => window.removeEventListener(e, marcarAtividade))
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
      window.removeEventListener('focus', verificar)
    }
  }, [pathname, router])
}
