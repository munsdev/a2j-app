/* Serves public/ on a2j.app. Every other host (the old cms.muns.dev, www.a2j.app) is sent to
   the same path on a2j.app, so old links and bookmarks keep working. */
const HOME = "a2j.app";
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== HOME && !url.hostname.endsWith(".workers.dev")) {
      url.hostname = HOME; url.protocol = "https:"; url.port = "";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  }
};
