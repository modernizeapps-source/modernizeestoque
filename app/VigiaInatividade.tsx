'use client'

import { useVoltarPorInatividade } from '@/lib/useVoltarPorInatividade'

// Componente sem visual: só liga o retorno automático pra tela inicial.
// Fica no layout, então vale pra todas as telas de uma vez.
export default function VigiaInatividade() {
  useVoltarPorInatividade()
  return null
}
