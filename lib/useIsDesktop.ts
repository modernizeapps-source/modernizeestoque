'use client'

import { useEffect, useState } from 'react'

// Diz se a tela é grande o suficiente pro layout de computador.
//
// Começa sempre como `false`, inclusive na primeira renderização no servidor.
// Isso é proposital: garante que o celular renderize exatamente o mesmo HTML
// de antes desta mudança, sem nenhum risco de alteração no layout dele.
// Só depois que a página carrega no navegador é que o computador troca de layout.
export function useIsDesktop(larguraMinima = 1024) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${larguraMinima}px)`)
    setIsDesktop(mq.matches)

    function aoMudar(e: MediaQueryListEvent) {
      setIsDesktop(e.matches)
    }

    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [larguraMinima])

  return isDesktop
}
