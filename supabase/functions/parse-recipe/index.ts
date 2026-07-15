import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Definimos las cabeceras CORS para permitir llamadas desde tu frontend (PWA)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Manejo de peticiones preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") // Trae la clave desde el panel de Supabase de forma segura

    if (!GEMINI_API_KEY) {
      throw new Error("No se ha configurado la variable de entorno GEMINI_API_KEY.")
    }

    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: "Falta la imagen o el tipo de archivo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // El prompt optimizado para recetas estructuradas
    const prompt = `Analiza esta imagen o documento de una receta de cocina/pastelería. 
    Extrae la información relevante y devuélmela ESTRICTAMENTE en el siguiente formato JSON:
    {
      "nombre": "Nombre de la receta",
      "ingredientes": [
        { "nombre": "Nombre del ingrediente", "cantidad": 100, "unidad": "g" }
      ],
      "pasos": [
        "Primer paso de la preparación...",
        "Segundo paso..."
      ]
    }
    No agregues introducciones, explicaciones, markdown adicional ni bloques de código. Solo el JSON plano.`

    // Llamada directa al API de Gemini 2.0 Flash de Google (v1beta)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      }
    )

    if (!response.ok) {
      const errorDetail = await response.text()
      
      // Intentar listar modelos para diagnóstico de clave y permisos
      let diagnosticMsg = ""
      try {
        const diagResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`)
        if (diagResp.ok) {
          const diagData = await diagResp.json()
          const modelsList = diagData.models ? diagData.models.map((m: any) => m.name.replace("models/", "")).join(", ") : "Ninguno"
          diagnosticMsg = ` (Modelos disponibles en tu API Key: ${modelsList})`
        } else {
          const diagErr = await diagResp.text()
          diagnosticMsg = ` (Fallo de diagnóstico al listar modelos: ${diagErr})`
        }
      } catch (diagErr: any) {
        diagnosticMsg = ` (Error de diagnóstico: ${diagErr.message})`
      }
      
      throw new Error(`Error en API de Gemini: ${errorDetail}${diagnosticMsg}`)
    }

    const data = await response.json()
    const textResponse = data.candidates[0].content.parts[0].text
    const recipeData = JSON.parse(textResponse)

    return new Response(JSON.stringify(recipeData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    })
  }
})