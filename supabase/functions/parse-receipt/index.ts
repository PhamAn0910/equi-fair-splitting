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
                text: `You are an expert receipt parser. Extract ONLY the purchasable line items from this receipt.

CRITICAL RULES for calculating the correct price:
1. If there are columns like "PRICE" (unit price) AND "SUBTOTAL"/"AMOUNT"/"TOTAL" (line total), use the SUBTOTAL/AMOUNT column divided by quantity
2. If quantity > 1 and you see both unit price and line total, calculate: unit_price = line_total / quantity
3. IGNORE these completely - do NOT include them as items:
   - Tax, VAT, GST, Service charges
   - Tips, Gratuity
   - Grand Total, Subtotal (the summary row)
   - Discounts
   - Payment method lines
   - Header/footer info (dates, addresses, invoice numbers)

4. For each ACTUAL PURCHASABLE ITEM, extract:
   - "name": The item description (clean text, no numbers/codes)
   - "price": The UNIT PRICE (if qty=2 and total=$10, price should be 5.00)
   - "quantity": How many were purchased (default 1 if not specified)

Return ONLY a JSON array, no explanation:
[{"name": "Item Name", "price": 12.50, "quantity": 1}]`
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
              name: "extract_receipt_items",
              description: "Extract items from a receipt image",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
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
                  }
                },
                required: ["items"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_items" } }
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

    // Extract items from tool call response
    let items = [];
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        items = parsed.items || [];
      } catch (e) {
        console.error("Failed to parse tool response:", e);
      }
    }

    // Fallback: try to parse from content if no tool call
    if (items.length === 0 && data.choices?.[0]?.message?.content) {
      try {
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          items = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse content as JSON:", e);
      }
    }

    console.log("Extracted items:", items);

    return new Response(
      JSON.stringify({ items }),
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
