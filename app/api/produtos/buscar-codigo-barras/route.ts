import { NextRequest, NextResponse } from 'next/server'

// Consulta o Cosmos (catálogo público de produtos brasileiros por código de
// barras) pra sugerir nome/marca/categoria ao cadastrar um produto novo.
// Se não tiver token configurado ou o produto não for encontrado, simplesmente
// devolve "encontrado: false" — o cadastro manual continua funcionando normalmente.
export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('codigo')
  if (!codigo) {
    return NextResponse.json({ erro: 'Código de barras não informado.' }, { status: 400 })
  }

  const token = process.env.COSMOS_API_TOKEN
  if (!token) {
    return NextResponse.json({ encontrado: false })
  }

  try {
    const resposta = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${encodeURIComponent(codigo)}.json`, {
      headers: {
        'X-Cosmos-Token': token,
        'User-Agent': 'Cosmos-API-Request',
      },
      cache: 'no-store',
    })

    if (!resposta.ok) {
      return NextResponse.json({ encontrado: false })
    }

    const dados = await resposta.json()
    return NextResponse.json({
      encontrado: true,
      nome: dados.description ?? null,
      marca: dados.brand?.name ?? null,
      categoriaSugerida: dados.gpc?.description ?? null,
    })
  } catch (e) {
    return NextResponse.json({ encontrado: false })
  }
}
