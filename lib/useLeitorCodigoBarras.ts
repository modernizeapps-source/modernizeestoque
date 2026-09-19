'use client'

import { useEffect, useRef } from 'react'

// Leitores de código de barras USB funcionam "se passando por teclado": eles
// digitam os caracteres do código muito mais rápido que uma pessoa, e terminam
// com Enter. Esse hook escuta o teclado da página inteira e, quando reconhece
// esse padrão (várias teclas em sequência muito rápida + Enter), chama onScan
// com o código lido — sem atrapalhar quem está digitando normalmente em algum
// campo de texto da tela.
export function useLeitorCodigoBarras(onScan: (codigo: string) => void, ativo: boolean = true) {
  const bufferRef = useRef('')
  const ultimoTempoRef = useRef(0)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    if (!ativo) return

    function handleKeyDown(e: KeyboardEvent) {
      const agora = Date.now()
      const intervalo = agora - ultimoTempoRef.current
      ultimoTempoRef.current = agora

      // Passou muito tempo desde a última tecla: começa um buffer novo
      if (intervalo > 80) {
        bufferRef.current = ''
      }

      if (e.key === 'Enter') {
        const codigo = bufferRef.current.trim()
        bufferRef.current = ''

        // Só considera leitura de código de barras se as teclas vieram rápido
        // demais pra ser uma pessoa digitando, e o código tem um tamanho plausível
        if (codigo.length >= 4 && intervalo <= 80) {
          onScanRef.current(codigo)
        }
        return
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [ativo])
}
