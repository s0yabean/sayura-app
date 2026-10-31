
export async function POST(request: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Check if we have the API key
    // Server-only: read from the server environment, never from the app bundle
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey) {
      console.error("ASSEMBLYAI_API_KEY is not set on the server");
      return new Response(JSON.stringify({ 
        success: false,
        error: 'AssemblyAI API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("Error parsing form data:", error);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid form data' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const audioFile = (formData as any).get('audio') as File;
    
    if (!audioFile) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No audio file provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check file size (limit to 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Audio file too large (max 25MB)' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const baseUrl = "https://api.assemblyai.com";
    const headers = {
      authorization: apiKey,
    };

    // Convert File to ArrayBuffer
    let audioBuffer;
    try {
      audioBuffer = await audioFile.arrayBuffer();
    } catch (error) {
      console.error("Error reading audio file:", error);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to read audio file' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const audioData = new Uint8Array(audioBuffer);

    // Upload audio file to AssemblyAI
    let uploadUrl;
    try {
      const uploadResponse = await fetch(`${baseUrl}/v2/upload`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/octet-stream',
        },
        body: audioData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      uploadUrl = uploadResult.upload_url;
    } catch (error) {
      console.error("Error uploading audio:", error);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to upload audio file' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Submit transcription request
    const transcriptData = {
      audio_url: uploadUrl,
      speech_model: "slam-1",
      punctuate: true,
      format_text: true,
    };

    let transcriptId;
    try {
      const transcriptResponse = await fetch(`${baseUrl}/v2/transcript`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcriptData),
      });

      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text();
        throw new Error(`Transcription request failed: ${errorText}`);
      }

      const transcriptResult = await transcriptResponse.json();
      transcriptId = transcriptResult.id;
    } catch (error) {
      console.error("Error submitting transcription:", error);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to submit transcription request' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Poll for completion
    const pollingEndpoint = `${baseUrl}/v2/transcript/${transcriptId}`;
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes max

    while (attempts < maxAttempts) {
      try {
        const pollingResponse = await fetch(pollingEndpoint, { headers });
        
        if (!pollingResponse.ok) {
          const errorText = await pollingResponse.text();
          throw new Error(`Polling request failed: ${errorText}`);
        }

        const transcriptionResult = await pollingResponse.json();

        if (transcriptionResult.status === "completed") {
          return new Response(JSON.stringify({
            success: true,
            text: transcriptionResult.text,
            confidence: transcriptionResult.confidence,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else if (transcriptionResult.status === "error") {
          throw new Error(`Transcription failed: ${transcriptionResult.error}`);
        }

        // Wait 3 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000));
        attempts++;
      } catch (error) {
        console.error("Error during polling:", error);
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Transcription processing failed' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Timeout
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Transcription timeout' 
    }), {
      status: 408,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Transcription API error:", error);
    
    // Ensure we always return JSON, even for unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: errorMessage 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      }
    });
  }
}