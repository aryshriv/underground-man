export async function GET() {
  try {
    const response = await fetch('https://stava.io/resources/underground-man-apartment6.glb');

    if (!response.ok) {
      return new Response('Failed to fetch GLB file', { status: 500 });
    }

    const glbBuffer = await response.arrayBuffer();

    return new Response(glbBuffer, {
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Length': glbBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching GLB file:', error);
    return new Response('Error loading GLB file', { status: 500 });
  }
}