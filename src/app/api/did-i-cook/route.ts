import { NextRequest, NextResponse } from "next/server";
import { didICookStream } from "@/lib/openai";

export async function POST(request: NextRequest) {
    const { beforeImage, afterImage } = await request.json();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'status', 
                    message: 'Starting AI analysis...' 
                })}\n\n`));

                const aiStream = await didICookStream(beforeImage, afterImage);
                
                let fullContent = '';
                let jsonContent = '';
                let isInJsonSection = false;

                for await (const chunk of aiStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        fullContent += content;
                        
                        if (content.includes('{') && !isInJsonSection) {
                            isInJsonSection = true;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                                type: 'status', 
                                message: 'Generating final summary...' 
                            })}\n\n`));
                        }
                        
                        if (isInJsonSection) {
                            jsonContent += content;
                        } else {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                                type: 'content', 
                                content: content 
                            })}\n\n`));
                        }
                    }
                }

                let finalResult = null;
                try {
                    const jsonMatch = fullContent.match(/\{[^{}]*"is_improvement"[^{}]*\}/);
                    if (jsonMatch) {
                        finalResult = JSON.parse(jsonMatch[0]);
                    }
                } catch (parseError) {
                    console.error('Failed to parse JSON:', parseError);
                }

                if (finalResult) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'result', 
                        data: finalResult 
                    })}\n\n`));
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'done' 
                })}\n\n`));

                controller.close();
            } catch (error) {
                console.error('Streaming error:', error);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'error', 
                    message: 'Failed to analyze design. Please try again.' 
                })}\n\n`));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}