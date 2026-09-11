#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const DEFAULT_CLASP_OAUTH_CLIENT_ID = '1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com';
const DEFAULT_CLASP_OAUTH_CLIENT_SECRET = 'v6V3fKV_zWU7iw1DrpO1rknX';

class DeploymentInspectionError extends Error {
  constructor(code) {
    super(code);
    this.name = 'DeploymentInspectionError';
    this.code = code;
  }
}

function credentialFromStore(store) {
  if (store && store.tokens && typeof store.tokens === 'object') {
    const named = store.tokens.default || Object.values(store.tokens).find(Boolean);
    if (named) return named;
  }
  if (store && store.token && store.oauth2ClientSettings) {
    return {
      ...store.token,
      client_id: store.oauth2ClientSettings.clientId,
      client_secret: store.oauth2ClientSettings.clientSecret
    };
  }
  if (store && (store.access_token || store.refresh_token)) {
    return {
      ...store,
      client_id: store.client_id || DEFAULT_CLASP_OAUTH_CLIENT_ID,
      client_secret: store.client_secret || DEFAULT_CLASP_OAUTH_CLIENT_SECRET
    };
  }
  throw new DeploymentInspectionError('CLASP_CREDENTIAL_UNAVAILABLE');
}

async function accessTokenFor(credential, fetchImpl = globalThis.fetch) {
  const expiry = Number(credential.expiry_date || credential.exprity_date || 0);
  if (credential.access_token && expiry > Date.now() + 60000) return credential.access_token;
  if (!credential.refresh_token || !credential.client_id || !credential.client_secret) {
    throw new DeploymentInspectionError('CLASP_REFRESH_UNAVAILABLE');
  }

  let response;
  try {
    response = await fetchImpl('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: credential.client_id,
        client_secret: credential.client_secret,
        refresh_token: credential.refresh_token,
        grant_type: 'refresh_token'
      })
    });
  } catch (_error) {
    throw new DeploymentInspectionError('OAUTH_REFRESH_REQUEST_FAILED');
  }

  let payload;
  try {
    payload = JSON.parse(await response.text());
  } catch (_error) {
    throw new DeploymentInspectionError('OAUTH_REFRESH_RESPONSE_INVALID');
  }
  if (!response.ok || !payload.access_token) {
    throw new DeploymentInspectionError('OAUTH_REFRESH_REJECTED');
  }
  return payload.access_token;
}

function safeEntryPoints(deployment) {
  return (Array.isArray(deployment.entryPoints) ? deployment.entryPoints : []).map((entry) => {
    const webApp = entry && entry.webApp ? entry.webApp : {};
    const config = webApp.entryPointConfig || {};
    let urlHost = 'none';
    if (webApp.url) {
      try {
        urlHost = new URL(webApp.url).hostname;
      } catch (_error) {
        urlHost = 'invalid';
      }
    }
    return {
      type: String(entry.entryPointType || 'UNKNOWN'),
      access: String(config.access || 'UNKNOWN_ACCESS'),
      executeAs: String(config.executeAs || 'UNKNOWN_EXECUTE_AS'),
      urlHost
    };
  });
}

async function inspectDeployment({ authFile, scriptId, deploymentId, fetchImpl = globalThis.fetch }) {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(String(scriptId || ''))) {
    throw new DeploymentInspectionError('SCRIPT_ID_INVALID');
  }
  if (!/^AK[A-Za-z0-9_-]{20,}$/.test(String(deploymentId || ''))) {
    throw new DeploymentInspectionError('DEPLOYMENT_ID_INVALID');
  }

  let store;
  try {
    store = JSON.parse(fs.readFileSync(authFile, 'utf8'));
  } catch (_error) {
    throw new DeploymentInspectionError('CLASP_CREDENTIAL_READ_FAILED');
  }
  const credential = credentialFromStore(store);
  const accessToken = await accessTokenFor(credential, fetchImpl);

  let response;
  try {
    response = await fetchImpl(
      `https://script.googleapis.com/v1/projects/${scriptId}/deployments/${deploymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
    );
  } catch (_error) {
    throw new DeploymentInspectionError('DEPLOYMENT_METADATA_REQUEST_FAILED');
  }

  let deployment;
  try {
    deployment = JSON.parse(await response.text());
  } catch (_error) {
    throw new DeploymentInspectionError('DEPLOYMENT_METADATA_RESPONSE_INVALID');
  }
  if (!response.ok) throw new DeploymentInspectionError(`DEPLOYMENT_METADATA_HTTP_${response.status}`);

  return {
    versionNumber: Number(deployment.deploymentConfig && deployment.deploymentConfig.versionNumber || 0),
    manifestFileName: String(deployment.deploymentConfig && deployment.deploymentConfig.manifestFileName || 'unknown'),
    entryPoints: safeEntryPoints(deployment)
  };
}

function printInspection(result, logger = console.log) {
  logger(`APPS_SCRIPT_DEPLOYMENT version=${result.versionNumber || 'unknown'} manifest=${result.manifestFileName}`);
  if (!result.entryPoints.length) {
    logger('APPS_SCRIPT_ENTRY_POINT type=NONE access=UNKNOWN_ACCESS execute_as=UNKNOWN_EXECUTE_AS url_host=none');
    return;
  }
  result.entryPoints.forEach((entry) => {
    logger(`APPS_SCRIPT_ENTRY_POINT type=${entry.type} access=${entry.access} execute_as=${entry.executeAs} url_host=${entry.urlHost}`);
  });
}

async function main() {
  try {
    const result = await inspectDeployment({
      authFile: process.env.CLASP_AUTH_FILE || '',
      scriptId: process.env.FCT_SCRIPT_ID || '',
      deploymentId: process.env.FCT_DEPLOYMENT_ID || ''
    });
    printInspection(result);
    console.log('APPS_SCRIPT_DEPLOYMENT_METADATA_PASS');
  } catch (error) {
    const code = error instanceof DeploymentInspectionError ? error.code : 'UNEXPECTED_INSPECTION_FAILURE';
    console.error(`APPS_SCRIPT_DEPLOYMENT_METADATA_FAIL code=${code}`);
    process.exitCode = 1;
  }
}

module.exports = {
  DeploymentInspectionError,
  accessTokenFor,
  credentialFromStore,
  printInspection,
  safeEntryPoints
};

if (require.main === module) main();
