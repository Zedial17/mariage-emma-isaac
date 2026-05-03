// ============================================================
// Emma & Isaac — RSVP Google Apps Script (v2 — avec carte)
// ============================================================
// Pour mettre à jour : Apps Script → Déployer → Gérer les déploiements
// → icône crayon → Version "Nouvelle version" → Déployer
// L'URL reste identique.
// ============================================================

var SHEET_NAME  = 'RSVP Emma & Isaac';
var NOTIFY_MAIL = 'manue.fity@gmail.com';

var HEADERS = [
  'Horodatage',
  'Prénom',
  'Nom',
  'Email',
  'Téléphone',
  'Ville',
  'Pays',
  'Latitude',
  'Longitude',
  'Nb d\'invités',
  'Cérémonies',
  'Régime alimentaire',
  'Navette',
  'Hôtel',
  'Message'
];

var FIELD_MAP = {
  'Horodatage':         'timestamp',
  'Prénom':             'prenom',
  'Nom':                'nom',
  'Email':              'email',
  'Téléphone':          'tel',
  'Ville':              'ville',
  'Pays':               '_country',
  'Latitude':           '_lat',
  'Longitude':          '_lng',
  'Nb d\'invités':      'guests',
  'Cérémonies':         'ceremonies',
  'Régime alimentaire': 'diet',
  'Navette':            'transport',
  'Hôtel':              'hotel',
  'Message':            'message'
};

// ── doPost : reçoit un RSVP ou une demande de virement ───────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Demande de coordonnées bancaires
    if (data.type === 'virement_request') {
      var nom     = data.nom     || '—';
      var contact = data.contact || '—';
      var sujet   = '🏦 Demande de coordonnées bancaires — ' + nom;
      var corps   =
        'Bonjour,\n\n' +
        'Une personne souhaite effectuer un virement bancaire pour le mariage Emma & Isaac.\n\n' +
        '────────────────────────────\n' +
        '  Nom      : ' + nom + '\n' +
        '  Contact  : ' + contact + '\n' +
        '────────────────────────────\n\n' +
        'Veuillez la contacter directement pour lui communiquer les coordonnées bancaires.\n\n' +
        'Emma & Isaac · 17 & 19 Décembre 2026 · Libreville, Gabon';
      GmailApp.sendEmail(NOTIFY_MAIL, sujet, corps);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    data.timestamp = Utilities.formatDate(
      new Date(), 'Africa/Lagos', 'dd/MM/yyyy HH:mm:ss'
    );

    // Géocodage de la ville
    var coords = data.ville ? geocodeVille(data.ville) : null;
    data._lat     = coords ? coords.lat     : '';
    data._lng     = coords ? coords.lng     : '';
    data._country = coords ? coords.country : '';

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    // Vérifie et corrige les en-têtes à chaque soumission
    // (utile si le sheet a été créé avec une ancienne version du script)
    _ensureHeaders(sheet);

    var row = HEADERS.map(function(h) {
      var key = FIELD_MAP[h];
      var val = data[key];
      if (val === undefined || val === null || val === '') return '—';
      if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
      return String(val).trim() || '—';
    });

    sheet.appendRow(row);
    sheet.autoResizeColumns(1, HEADERS.length);

    envoyerNotification(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log(err);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── doGet : retourne les villes pour la carte ──────────────
function doGet(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet || sheet.getLastRow() <= 1) {
      return jsonResponse([]);
    }

    var values  = sheet.getDataRange().getValues();
    var headers = values[0];

    var iVille   = headers.indexOf('Ville');
    var iCountry = headers.indexOf('Pays');
    var iLat     = headers.indexOf('Latitude');
    var iLng     = headers.indexOf('Longitude');
    var iGuests  = headers.indexOf('Nb d\'invités');

    if (iVille === -1 || iLat === -1 || iLng === -1) {
      return jsonResponse([]);
    }

    // Agrégation par ville
    var map = {};
    for (var i = 1; i < values.length; i++) {
      var row     = values[i];
      var ville   = String(row[iVille]).trim();
      var country = iCountry !== -1 ? String(row[iCountry]).trim() : '';
      var lat     = parseFloat(row[iLat]);
      var lng     = parseFloat(row[iLng]);
      var guests  = parseInt(row[iGuests]) || 1;

      if (!ville || ville === '—' || isNaN(lat) || isNaN(lng)) continue;

      if (!map[ville]) {
        map[ville] = { name: ville, lat: lat, lng: lng, guests: 0, country: country !== '—' ? country : '' };
      }
      map[ville].guests += guests;
    }

    var result = Object.keys(map).map(function(k) { return map[k]; });
    return jsonResponse(result);

  } catch (err) {
    Logger.log(err);
    return jsonResponse([]);
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Géocodage via Nominatim (OpenStreetMap) ────────────────
function geocodeVille(ville) {
  try {
    var url = 'https://nominatim.openstreetmap.org/search?q='
      + encodeURIComponent(ville)
      + '&format=json&limit=1&addressdetails=1&accept-language=fr';
    var resp    = UrlFetchApp.fetch(url, {
      headers: { 'User-Agent': 'EmmaIsaacWedding/2.0 ' + NOTIFY_MAIL }
    });
    var results = JSON.parse(resp.getContentText());
    if (results && results.length > 0) {
      var r       = results[0];
      var country = (r.address && r.address.country) ? r.address.country : '';
      return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), country: country };
    }
  } catch (err) {
    Logger.log('Geocode error: ' + err);
  }
  return null;
}

// ── Email de notification ──────────────────────────────────
function envoyerNotification(data) {
  var prenom = data.prenom || '—';
  var nom    = data.nom    || '—';
  var n      = data.guests || '1';
  var ville  = data.ville  || '—';

  var sujet = '💌 Nouveau RSVP — ' + prenom + ' ' + nom
    + ' (' + n + ' invité' + (n > 1 ? 's' : '') + ')';

  var corps =
    'Bonjour,\n\n' +
    'Un nouvel invité vient de confirmer sa présence.\n\n' +
    '────────────────────────────\n' +
    '  Prénom       : ' + prenom + '\n' +
    '  Nom          : ' + nom + '\n' +
    '  Email        : ' + (data.email      || '—') + '\n' +
    '  Téléphone    : ' + (data.tel        || '—') + '\n' +
    '  Ville        : ' + ville + '\n' +
    '  Nb invités   : ' + n + '\n' +
    '  Cérémonies   : ' + (data.ceremonies || '—') + '\n' +
    '  Régime       : ' + (data.diet       || '—') + '\n' +
    '  Navette      : ' + (data.transport  || '—') + '\n' +
    '  Hôtel        : ' + (data.hotel === true || data.hotel === 'true' ? 'Oui' : 'Non') + '\n' +
    '  Message      : ' + (data.message    || '—') + '\n' +
    '────────────────────────────\n\n' +
    SpreadsheetApp.getActiveSpreadsheet().getUrl() + '\n\n' +
    'Emma & Isaac · 17 & 19 Décembre 2026 · Libreville, Gabon';

  GmailApp.sendEmail(NOTIFY_MAIL, sujet, corps);
}

// ── Gestion des en-têtes ───────────────────────────────────

// Appelée à chaque doPost pour s'assurer que les en-têtes sont corrects.
// Si la ligne 1 ne correspond pas à HEADERS, elle est réécrite sans toucher aux données.
function _ensureHeaders(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
  var existing = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    : [];

  var correct = HEADERS.every(function(h, i) { return existing[i] === h; });
  if (correct) return;

  // Réécriture des en-têtes uniquement (les données restent en place)
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  var hr = sheet.getRange(1, 1, 1, HEADERS.length);
  hr.setFontWeight('bold');
  hr.setBackground('#3d2012');
  hr.setFontColor('#f5ecd7');
  sheet.setFrozenRows(1);
  Logger.log('En-têtes mis à jour : ' + HEADERS.join(', '));
}

// À exécuter UNE FOIS manuellement depuis l'éditeur Apps Script
// pour réinitialiser proprement le sheet (efface tout et recrée les en-têtes).
function reinitialiserSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  sheet.clearContents();

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  var hr = sheet.getRange(1, 1, 1, HEADERS.length);
  hr.setFontWeight('bold');
  hr.setBackground('#3d2012');
  hr.setFontColor('#f5ecd7');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);

  Logger.log('✅ Sheet réinitialisé — ' + HEADERS.length + ' colonnes : ' + HEADERS.join(', '));
}

// ── Test manuel ────────────────────────────────────────────
function testerScript() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        prenom: 'Marie', nom: 'Dupont',
        email: 'marie@exemple.com', tel: '+33 6 12 34 56 78',
        ville: 'Paris, France', guests: '2',
        ceremonies: 'coutume, civil', diet: 'Végétarien',
        transport: 'Oui', hotel: true,
        message: 'Très heureux de partager ce moment avec vous !'
      })
    }
  };
  Logger.log(doPost(fakeEvent).getContent());
  Logger.log(doGet({}).getContent());
}
