function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};

  // TikTok Business API commonly returns auth_code.
  // "code" is accepted as fallback so callback remains robust.
  const authCode = params.auth_code || params.code || '';
  const state = params.state || '';

  if (authCode) {
    PropertiesService.getScriptProperties()
      .setProperty('TIKTOK_AUTH_CODE_TEMP', authCode);

    if (state) {
      PropertiesService.getScriptProperties()
        .setProperty('TIKTOK_AUTH_STATE_TEMP', state);
    }

    return HtmlService.createHtmlOutput(
      '<h2>TikTok authorization received.</h2>' +
      '<p>You can close this window and return to Founder Control Tower.</p>'
    );
  }

  return HtmlService.createHtmlOutput(
    '<h2>Founder Control Tower — TikTok API Callback</h2>' +
    '<p>Callback endpoint is active.</p>'
  );
}