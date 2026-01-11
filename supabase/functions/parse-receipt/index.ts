import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing receipt with Gemini Flash...");

const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert receipt/invoice parser. Your job is to extract data from this receipt image.

STEP 1: Identify the SUBTOTAL line (the sum of all items BEFORE tax/fees)
STEP 2: Identify Tax, Service Charge, Tip, and Discount lines SEPARATELY
STEP 3: Extract each purchasable item

CRITICAL RULES:
1. For item pricing: If there are "PRICE" and "SUBTOTAL/AMOUNT/TOTAL" columns, use the line-item SUBTOTAL (not unit price). Calculate unit_price = line_subtotal / quantity.
2. DO NOT include Tax, VAT, GST, Service Charge, Tip, or Discount as "items" - return them in "fees" instead.
3. DO NOT include the Grand Total or Subtotal summary row as an item.

WHAT TO RETURN:
- items: Array of purchasable items (name, price per unit, quantity)
- fees: Object with tax, tip, service_charge, discount amounts (use 0 if not present)
- subtotal: The bill subtotal BEFORE fees (sum of all item prices × quantities)

Example output structure:
{
  "items": [{"name": "Burger", "price": 12.50, "quantity": 1}],
  "fees": {"tax": 2.50, "tip": 0, "service_charge": 0, "discount": 0},
  "subtotal": 45.00
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") 
                    ? imageBase64 
                    : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt_data",
              description: "Extract items and fees from a receipt image",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    description: "List of purchasable items only",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Item name/description" },
                        price: { type: "number", description: "Unit price" },
                        quantity: { type: "integer", description: "Quantity purchased" }
                      },
                      required: ["name", "price", "quantity"],
                      additionalProperties: false
                    }
                  },
                  fees: {
                    type: "object",
                    description: "Tax, tip, service charge, discount amounts",
                    properties: {
                      tax: { type: "number", description: "Tax/VAT/GST amount" },
                      tip: { type: "number", description: "Tip/Gratuity amount" },
                      service_charge: { type: "number", description: "Service charge/fee" },
                      discount: { type: "number", description: "Discount amount (as positive number)" }
                    },
                    required: ["tax", "tip", "service_charge", "discount"],
                    additionalProperties: false
                  },
                  subtotal: {
                    type: "number",
                    description: "Sum of all items before fees"
                  }
                },
                required: ["items", "fees", "subtotal"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to parse receipt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    // Extract items and fees from tool call response
    let result = {
      items: [] as Array<{ name: string; price: number; quantity: number }>,
      fees: { tax: 0, tip: 0, service_charge: 0, discount: 0 },
      subtotal: 0
    };

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        result.items = parsed.items || [];
        result.fees = {
          tax: parsed.fees?.tax || 0,
          tip: parsed.fees?.tip || 0,
          service_charge: parsed.fees?.service_charge || 0,
          discount: parsed.fees?.discount || 0
        };
        result.subtotal = parsed.subtotal || result.items.reduce(
          (sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0
        );
      } catch (e) {
        console.error("Failed to parse tool response:", e);
      }
    }

    // Fallback: try to parse from content if no tool call
    if (result.items.length === 0 && data.choices?.[0]?.message?.content) {
      try {
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result.items = parsed.items || [];
          result.fees = parsed.fees || result.fees;
          result.subtotal = parsed.subtotal || 0;
        }
      } catch (e) {
        console.error("Failed to parse content as JSON:", e);
      }
    }

    console.log("Extracted receipt data:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("parse-receipt error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
