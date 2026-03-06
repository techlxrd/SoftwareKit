export default {
  async fetch(request, env) {
    const url = new URL(request.url);
   
    if (url.pathname === "/get-profile") {
      const requestId = url.searchParams.get("requestId");
      
     
      const apiResponse = await fetch('https://udid.s0n1c.ca/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_url: `${url.origin}/callback?requestId=${requestId}`,
          message: 'After installing return to the app. Thank you for choosing SoftwareKit! '
        })
      });

      const profileContent = await apiResponse.text();
    
      return new Response(profileContent, {
        headers: {
          "Content-Type": "application/x-apple-aspen-config",
          "Content-Disposition": 'attachment; filename="softwarekit-udid.mobileconfig"'
        }
      });
    }
    
    
if (url.pathname === "/callback") {
  const requestId = url.searchParams.get("requestId");
  const device = url.searchParams.get("device");

  if (requestId && device) {
   
    await env.DEVICE_KV.put(requestId, device, { expirationTtl: 300 });
  }

  
  return Response.redirect("https://softwarekit.pages.dev/ios/udid-success", 302);
}

    
    if (url.pathname === "/retrieve") {
      const id = url.searchParams.get("requestId");
      const data = await env.DEVICE_KV.get(id);
      return new Response(JSON.stringify({ 
        deviceInfo: data ? JSON.parse(atob(data)) : null 
      }), {
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};