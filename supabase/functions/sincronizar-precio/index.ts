import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de peticiones preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No se envió la cabecera de autorización' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { ingrediente_id } = await req.json()
    if (!ingrediente_id) {
      return new Response(
        JSON.stringify({ error: 'Falta el ID del ingrediente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inicializar el cliente de Supabase usando el token del usuario para respetar RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Obtener los datos del ingrediente
    const { data: ingredient, error: fetchErr } = await supabase
      .from('ingredientes')
      .select('*')
      .eq('id', ingrediente_id)
      .single()

    if (fetchErr || !ingredient) {
      return new Response(
        JSON.stringify({ error: 'No se encontró el ingrediente en la base de datos' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalizar a array de URLs
    const rawUrls = ingredient.url_proveedor
    let urls: string[] = []
    if (Array.isArray(rawUrls)) {
      urls = rawUrls.filter(Boolean)
    } else if (typeof rawUrls === 'string' && rawUrls) {
      urls = [rawUrls]
    }

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'El ingrediente no tiene enlaces de proveedor configurados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let extractedPrecioCompra: number | null = null
    let urlGanadora: string | null = null
    let fallbackUsado = false

    // Bucle de contingencia (Fallback loop)
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      console.log(`Intentando sincronizar precio con enlace ${i + 1}/${urls.length}: ${url}`)

      const isValentino = url.includes('cocinaconvalentino.com.ar')
      const isBotica = url.includes('boticadelpastelero.com.ar')
      const isDia = url.includes('diaonline.supermercadosdia.com.ar')

      if (!isValentino && !isBotica && !isDia) {
        console.log(`Enlace omitido: dominio no soportado.`)
        continue
      }

      try {
        // Fetch del producto con cabeceras simuladas
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3'
          }
        })

        if (!response.ok) {
          console.log(`Enlace falló: HTTP ${response.status}. Buscando siguiente...`)
          continue
        }

        const html = await response.text()

        // 1. Detección de falta de stock en el HTML
        const outOfStockKeywords = [/sin\s+stock/i, /agotado/i, /producto\s+no\s+disponible/i, /sin\s+disponibilidad/i]
        const outOfStock = outOfStockKeywords.some(kw => kw.test(html))
        if (outOfStock) {
          console.log(`Enlace omitido: Producto sin stock. Buscando siguiente...`)
          continue
        }

        // 2. Extraer precio según el proveedor
        let rawPrice: string | null = null

        if (isDia) {
          // A) PLATAFORMA VTEX: SUPERMERCADOS DIA
          // Prioridad 1: Meta product:price:amount
          const matchMetaProd = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i)
          if (matchMetaProd) {
            rawPrice = matchMetaProd[1]
          }

          // Prioridad 2: JSON-LD de VTEX
          if (!rawPrice) {
            const scriptMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
            for (const match of scriptMatches) {
              const jsonContent = match[1]
              const priceMatch = jsonContent.match(/"price"\s*:\s*"?([\d.,]+)"?/)
              if (priceMatch) {
                rawPrice = priceMatch[1]
                break
              }
            }
          }

          // Prioridad 3: Selectores de clase de VTEX
          if (!rawPrice) {
            const matchClass = html.match(/<[^>]*class=["'][^"']*vtex-product-price-1-x-sellingPriceValue[^"']*["'][^>]*>\s*([^<]+?)\s*</i)
            if (matchClass) {
              rawPrice = matchClass[1]
            }
          }

          // Combinar currencyInteger y currencyFraction
          if (!rawPrice) {
            const integerMatch = html.match(/<[^>]*class=["'][^"']*vtex-product-price-1-x-currencyInteger[^"']*["'][^>]*>\s*([^<]+?)\s*</i)
            const fractionMatch = html.match(/<[^>]*class=["'][^"']*vtex-product-price-1-x-currencyFraction[^"']*["'][^>]*>\s*([^<]+?)\s*</i)
            if (integerMatch) {
              rawPrice = integerMatch[1] + (fractionMatch ? "." + fractionMatch[1] : "")
            }
          }

        } else if (isBotica) {
          // B) PLATAFORMA TIENDANUBE: BOTICA DEL PASTELERO
          const matchMain = html.match(/<[^>]*class=["'][^"']*js-price-display[^"']*["'][^>]*>\s*([^<]+?)\s*</i) ||
                            html.match(/<[^>]*id=["']price_display["'][^>]*>\s*([^<]+?)\s*</i)
          if (matchMain) {
            rawPrice = matchMain[1]
          }

          if (!rawPrice) {
            const matchCompare = html.match(/<[^>]*class=["'][^"']*js-compare-price-display[^"']*["'][^>]*>\s*([^<]+?)\s*</i)
            if (matchCompare) {
              rawPrice = matchCompare[1]
            }
          }

          if (!rawPrice) {
            const matchMetaProd = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                                  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i)
            if (matchMetaProd) {
              rawPrice = matchMetaProd[1]
            }
          }

          if (!rawPrice) {
            const matchMetaOg = html.match(/<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:price:amount["']/i)
            if (matchMetaOg) {
              rawPrice = matchMetaOg[1]
            }
          }

        } else if (isValentino) {
          // C) PLATAFORMA PRESTASHOP: COCINA CON VALENTINO
          const metaMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i)
          if (metaMatch) {
            rawPrice = metaMatch[1]
          }

          if (!rawPrice) {
            const idMatch = html.match(/id=["']our_price_display["'][^>]*>\s*([^<]+?)\s*</i)
            if (idMatch) {
              rawPrice = idMatch[1]
            }
          }

          if (!rawPrice) {
            const textMatch = html.match(/Precio unitario:\s*\$([\d.,]+)/i)
            if (textMatch) {
              rawPrice = textMatch[1]
            }
          }
        }

        if (!rawPrice) {
          console.log(`No se pudo extraer el precio de este enlace. Buscando siguiente...`)
          continue
        }

        // Limpieza de precio
        let cleanedPriceStr = rawPrice.replace(/[^\d.,]/g, '').trim()
        if (cleanedPriceStr.includes(',')) {
          cleanedPriceStr = cleanedPriceStr.replace(/\./g, '').replace(',', '.')
        }

        const priceNum = parseFloat(cleanedPriceStr)
        if (isNaN(priceNum) || priceNum <= 0) {
          console.log(`Precio extraído no numérico o menor a cero: "${rawPrice}". Buscando siguiente...`)
          continue
        }

        // ¡Sincronización exitosa!
        extractedPrecioCompra = priceNum
        urlGanadora = url
        fallbackUsado = (i > 0)
        break // Salir del bucle al encontrar precio válido

      } catch (fetchErr) {
        console.error(`Error de red al intentar el enlace: ${url}. Error: ${fetchErr.message}`)
        continue
      }
    }

    if (!extractedPrecioCompra || !urlGanadora) {
      return new Response(
        JSON.stringify({ error: 'Ninguno de los enlaces de proveedor configurados devolvió un precio disponible/con stock' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cantidadCompra = parseFloat(ingredient.cantidad_compra)
    if (isNaN(cantidadCompra) || cantidadCompra <= 0) {
      return new Response(
        JSON.stringify({ error: `La cantidad de compra registrada en el ingrediente es inválida: "${ingredient.cantidad_compra}"` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const precioUnitario = extractedPrecioCompra / cantidadCompra

    // Actualizar la base de datos en Supabase
    const { data: updatedData, error: updateErr } = await supabase
      .from('ingredientes')
      .update({
        precio_compra: extractedPrecioCompra,
        precio: precioUnitario,
        proveedor_activo: urlGanadora
      })
      .eq('id', ingrediente_id)
      .select()
      .single()

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: `Error al actualizar la base de datos de Supabase: ${updateErr.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Devolver los datos actualizados y el estado de contingencia
    const resultPayload = {
      precio_compra: updatedData.precio_compra,
      precio: updatedData.precio,
      proveedor_activo: updatedData.proveedor_activo,
      fallback_usado: fallbackUsado,
      id: updatedData.id
    }

    return new Response(
      JSON.stringify(resultPayload),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
