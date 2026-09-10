const META_API_VERSION = 'v26.0';
const META_TOKEN_PROPERTY = 'Ayaan_Meta_Access_Token';
const META_RAW_SHEET_ID = '1swJZwAeuNJ-SBwIDq1OjEdt7jadLqhmv3p16FPdR0NU';

function testAyaanMetaConnection() {
  const token = PropertiesService
    .getScriptProperties()
    .getProperty(META_TOKEN_PROPERTY);

  if (!token) {
    throw new Error(
      'Token not found. Check Script Property: ' + META_TOKEN_PROPERTY
    );
  }

  const ss = SpreadsheetApp.openById(META_RAW_SHEET_ID);
  const setup = ss.getSheetByName('SETUP');

  if (!setup) {
    throw new Error('SETUP tab not found in META Ads Live - RAW.');
  }

  const fields = [
    'id',
    'account_id',
    'name',
    'account_status',
    'currency',
    'timezone_name'
  ].join(',');

  let url =
    'https://graph.facebook.com/' +
    META_API_VERSION +
    '/me/adaccounts?fields=' +
    encodeURIComponent(fields) +
    '&limit=100';

  const accounts = [];

  while (url) {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + token
      },
      muteHttpExceptions: true
    });

    const status = response.getResponseCode();
    const body = response.getContentText();

    if (status !== 200) {
      throw new Error('Meta API error ' + status + ': ' + body);
    }

    const json = JSON.parse(body);

    if (json.data) {
      accounts.push(...json.data);
    }

    url =
      json.paging && json.paging.next
        ? json.paging.next
        : null;
  }

  setup.getRange('A10:F100').clearContent();

  setup.getRange('A10:B11').setValues([
    ['LAST_TEST', new Date()],
    ['ACCOUNTS_FOUND', accounts.length]
  ]);

  setup.getRange('A12:F12').setValues([[
    'PORTFOLIO',
    'AD_ACCOUNT_ID',
    'ACCOUNT_NAME',
    'STATUS_CODE',
    'CURRENCY',
    'TIMEZONE'
  ]]);

  if (accounts.length > 0) {
    const rows = accounts.map(a => [
      'Ayaan',
      a.id,
      a.name || '',
      a.account_status || '',
      a.currency || '',
      a.timezone_name || ''
    ]);

    setup
      .getRange(13, 1, rows.length, 6)
      .setValues(rows);
  }

  Logger.log(JSON.stringify(accounts, null, 2));
}
function pullAyaanSeptemberMeta() {
  const token = PropertiesService
    .getScriptProperties()
    .getProperty(META_TOKEN_PROPERTY);

  if (!token) throw new Error('Meta token not found.');

  const ss = SpreadsheetApp.openById(META_RAW_SHEET_ID);
  const setup = ss.getSheetByName('SETUP');
  const raw = ss.getSheetByName('RAW_META');

  // Read the validated accounts from SETUP
  const accountRows = setup.getRange('A13:F100').getValues()
    .filter(r => r[0] === 'Ayaan' && r[1]);

  if (!accountRows.length) {
    throw new Error('No Ayaan ad accounts found in SETUP.');
  }

  const startDate = '2026-09-01';
  const endDate = Utilities.formatDate(
    new Date(),
    'Asia/Dubai',
    'yyyy-MM-dd'
  );

  const headers = [
    'Portfolio',
    'Date',
    'Account_ID',
    'Account_Name',
    'Currency',
    'Campaign_ID',
    'Campaign_Name',
    'Adset_ID',
    'Adset_Name',
    'Ad_ID',
    'Ad_Name',
    'Spend_Native',
    'Impressions',
    'Reach',
    'Clicks',
    'CTR',
    'CPC',
    'CPM',
    'Frequency',
    'Pixel_Purchases',
    'Omni_Purchases',
    'Pixel_Purchase_Value',
    'Omni_Purchase_Value',
    'Actions_JSON',
    'Action_Values_JSON',
    'Pulled_At'
  ];

  const output = [];

  accountRows.forEach(accountRow => {
    const accountId = accountRow[1];   // act_xxx
    const accountName = accountRow[2];
    const currency = accountRow[4];

    const fields = [
      'date_start',
      'account_id',
      'account_name',
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      'spend',
      'impressions',
      'reach',
      'clicks',
      'ctr',
      'cpc',
      'cpm',
      'frequency',
      'actions',
      'action_values'
    ].join(',');

    const timeRange = JSON.stringify({
      since: startDate,
      until: endDate
    });

    let url =
      'https://graph.facebook.com/' +
      META_API_VERSION +
      '/' +
      accountId +
      '/insights' +
      '?level=ad' +
      '&time_increment=1' +
      '&limit=500' +
      '&fields=' + encodeURIComponent(fields) +
      '&time_range=' + encodeURIComponent(timeRange);

    while (url) {
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: {
          Authorization: 'Bearer ' + token
        },
        muteHttpExceptions: true
      });

      const status = response.getResponseCode();
      const body = response.getContentText();

      if (status !== 200) {
        throw new Error(
          'Meta API error for ' +
          accountName +
          ' (' + status + '): ' +
          body
        );
      }

      const json = JSON.parse(body);

      (json.data || []).forEach(row => {
        const actions = row.actions || [];
        const values = row.action_values || [];

        output.push([
          'Ayaan',
          row.date_start || '',
          'act_' + row.account_id,
          row.account_name || accountName,
          currency,
          row.campaign_id || '',
          row.campaign_name || '',
          row.adset_id || '',
          row.adset_name || '',
          row.ad_id || '',
          row.ad_name || '',
          num(row.spend),
          num(row.impressions),
          num(row.reach),
          num(row.clicks),
          num(row.ctr),
          num(row.cpc),
          num(row.cpm),
          num(row.frequency),

          // Keep Pixel + Omni separately so we DON'T double count
          actionValue(actions, 'offsite_conversion.fb_pixel_purchase'),
          actionValue(actions, 'omni_purchase'),

          actionValue(values, 'offsite_conversion.fb_pixel_purchase'),
          actionValue(values, 'omni_purchase'),

          JSON.stringify(actions),
          JSON.stringify(values),
          new Date()
        ]);
      });

      url =
        json.paging && json.paging.next
          ? json.paging.next
          : null;
    }
  });

  // Ensure enough rows
  const neededRows = Math.max(output.length + 1, 2);

  if (raw.getMaxRows() < neededRows) {
    raw.insertRowsAfter(
      raw.getMaxRows(),
      neededRows - raw.getMaxRows()
    );
  }

  raw.clearContents();

  raw
    .getRange(1, 1, 1, headers.length)
    .setValues([headers]);

  if (output.length) {
    raw
      .getRange(2, 1, output.length, headers.length)
      .setValues(output);
  }

  setup.getRange('A25:B29').setValues([
    ['META_PULL_STATUS', 'SUCCESS'],
    ['META_PULL_FROM', startDate],
    ['META_PULL_TO', endDate],
    ['META_ROWS', output.length],
    ['META_LAST_PULL', new Date()]
  ]);

  Logger.log('Meta rows pulled: ' + output.length);
}


function actionValue(list, actionType) {
  const item = (list || []).find(
    x => x.action_type === actionType
  );

  return item ? Number(item.value || 0) : 0;
}


function num(value) {
  return value === undefined ||
         value === null ||
         value === ''
    ? 0
    : Number(value);
}
function testSabinaMetaConnection() {
  const token = PropertiesService.getScriptProperties()
    .getProperty('Sabina_Meta_Access_Token');

  const url =
    'https://graph.facebook.com/v26.0/me/adaccounts' +
    '?fields=id,name,currency,timezone_name,account_status' +
    '&limit=100' +
    '&access_token=' + encodeURIComponent(token);

  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());

  Logger.log(JSON.stringify(data, null, 2));
}
function testSabinaAllAccountsSpend() {
  const token = PropertiesService.getScriptProperties()
    .getProperty('Sabina_Meta_Access_Token');

  const accounts = [
    'act_241053651722414',
    'act_1082038593120393',
    'act_865326008400228'
  ];

  accounts.forEach(accountId => {
    const url =
      `https://graph.facebook.com/v26.0/${accountId}/insights` +
      `?level=account` +
      `&time_range=${encodeURIComponent(JSON.stringify({
        since: '2026-09-01',
        until: '2026-09-08'
      }))}` +
      `&fields=account_id,account_name,spend,impressions,clicks,actions` +
      `&access_token=${encodeURIComponent(token)}`;

    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());

    Logger.log(accountId + ' => ' + JSON.stringify(data));
  });
}
function pullSabinaaSeptemberMeta() {
  const token = PropertiesService.getScriptProperties()
    .getProperty('Sabina_Meta_Access_Token');

  const accountId = 'act_1082038593120393';
  const portfolio = 'Sabinaa';

  const ss = SpreadsheetApp.openById(META_RAW_SHEET_ID);
  const sheet = ss.getSheetByName('RAW_META');

  const since = '2026-09-01';
  const until = '2026-09-08';

  const fields = [
    'date_start',
    'account_id',
    'account_name',
    'campaign_id',
    'campaign_name',
    'adset_id',
    'adset_name',
    'ad_id',
    'ad_name',
    'spend',
    'impressions',
    'reach',
    'clicks',
    'ctr',
    'cpc',
    'cpm',
    'frequency',
    'actions',
    'action_values'
  ].join(',');

  let url =
    `https://graph.facebook.com/${META_API_VERSION}/${accountId}/insights` +
    `?level=ad` +
    `&time_increment=1` +
    `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
    `&fields=${encodeURIComponent(fields)}` +
    `&limit=500` +
    `&access_token=${encodeURIComponent(token)}`;

  let allRows = [];

  while (url) {
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());

    allRows = allRows.concat(json.data || []);
    url = json.paging?.next || null;
  }

  const output = allRows.map(r => {
    const actions = r.actions || [];
    const values = r.action_values || [];

    const actionValue = type => {
      const x = actions.find(a => a.action_type === type);
      return x ? Number(x.value || 0) : 0;
    };

    const purchaseValue = type => {
      const x = values.find(a => a.action_type === type);
      return x ? Number(x.value || 0) : 0;
    };

    return [
      portfolio,
      r.date_start || '',
      'act_' + r.account_id,
      r.account_name || '',
      'AED',
      r.campaign_id || '',
      r.campaign_name || '',
      r.adset_id || '',
      r.adset_name || '',
      r.ad_id || '',
      r.ad_name || '',
      Number(r.spend || 0),
      Number(r.impressions || 0),
      Number(r.reach || 0),
      Number(r.clicks || 0),
      Number(r.ctr || 0),
      Number(r.cpc || 0),
      Number(r.cpm || 0),
      Number(r.frequency || 0),
      actionValue('offsite_conversion.fb_pixel_purchase'),
      actionValue('omni_purchase'),
      purchaseValue('offsite_conversion.fb_pixel_purchase'),
      purchaseValue('omni_purchase'),
      JSON.stringify(actions),
      JSON.stringify(values),
      new Date()
    ];
  });

  if (output.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, output.length, 26)
      .setValues(output);
  }

  Logger.log(`Sabinaa rows written: ${output.length}`);
}
function testAqidMetaConnection() {
  const token = PropertiesService.getScriptProperties()
    .getProperty('Aqid_Meta_Access_Token');

  const url =
    'https://graph.facebook.com/v26.0/me/adaccounts' +
    '?fields=id,name,currency,timezone_name,account_status' +
    '&limit=100' +
    '&access_token=' + encodeURIComponent(token);

  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());

  Logger.log(JSON.stringify(data, null, 2));
}
function testAqidSeptemberSpend() {
  const token = PropertiesService.getScriptProperties()
    .getProperty('Aqid_Meta_Access_Token');

  const accountId = 'act_1664854027995785';

  const url =
    `https://graph.facebook.com/v26.0/${accountId}/insights` +
    `?level=account` +
    `&time_range=${encodeURIComponent(JSON.stringify({
      since: '2026-09-01',
      until: '2026-09-08'
    }))}` +
    `&fields=account_id,account_name,spend,impressions,clicks,actions,action_values` +
    `&access_token=${encodeURIComponent(token)}`;

  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());

  Logger.log(JSON.stringify(data, null, 2));
}
function pullAqidSeptemberMeta() {
  const token = PropertiesService.getScriptProperties()
    .getProperty('Aqid_Meta_Access_Token');

  const accountId = 'act_1664854027995785';
  const portfolio = 'Aqid';

  const ss = SpreadsheetApp.openById(META_RAW_SHEET_ID);
  const sheet = ss.getSheetByName('RAW_META');

  const since = '2026-09-01';
  const until = '2026-09-08';

  const fields = [
    'date_start',
    'account_id',
    'account_name',
    'campaign_id',
    'campaign_name',
    'adset_id',
    'adset_name',
    'ad_id',
    'ad_name',
    'spend',
    'impressions',
    'reach',
    'clicks',
    'ctr',
    'cpc',
    'cpm',
    'frequency',
    'actions',
    'action_values'
  ].join(',');

  let url =
    `https://graph.facebook.com/${META_API_VERSION}/${accountId}/insights` +
    `?level=ad` +
    `&time_increment=1` +
    `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
    `&fields=${encodeURIComponent(fields)}` +
    `&limit=500` +
    `&access_token=${encodeURIComponent(token)}`;

  let allRows = [];

  while (url) {
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());

    allRows = allRows.concat(json.data || []);
    url = json.paging?.next || null;
  }

  const output = allRows.map(r => {
    const actions = r.actions || [];
    const values = r.action_values || [];

    const getAction = type => {
      const x = actions.find(a => a.action_type === type);
      return x ? Number(x.value || 0) : 0;
    };

    const getValue = type => {
      const x = values.find(a => a.action_type === type);
      return x ? Number(x.value || 0) : 0;
    };

    return [
      portfolio,
      r.date_start || '',
      'act_' + r.account_id,
      r.account_name || '',
      'AED',
      r.campaign_id || '',
      r.campaign_name || '',
      r.adset_id || '',
      r.adset_name || '',
      r.ad_id || '',
      r.ad_name || '',
      Number(r.spend || 0),
      Number(r.impressions || 0),
      Number(r.reach || 0),
      Number(r.clicks || 0),
      Number(r.ctr || 0),
      Number(r.cpc || 0),
      Number(r.cpm || 0),
      Number(r.frequency || 0),
      getAction('offsite_conversion.fb_pixel_purchase'),
      getAction('omni_purchase'),
      getValue('offsite_conversion.fb_pixel_purchase'),
      getValue('omni_purchase'),
      JSON.stringify(actions),
      JSON.stringify(values),
      new Date()
    ];
  });

  if (output.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, output.length, 26)
      .setValues(output);
  }

  Logger.log(`Aqid rows written: ${output.length}`);
}