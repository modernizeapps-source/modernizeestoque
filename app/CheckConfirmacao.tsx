'use client'

// Símbolo de confirmação que se desenha na tela. Usado junto com .success-box
// pra deixar claro que a ação foi concluída.
export default function CheckConfirmacao() {
  return (
    <svg className="check-animado" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="12" />
      <path d="M7.5 13.4l3.7 3.7 7.3-7.8" />
    </svg>
  )
}
