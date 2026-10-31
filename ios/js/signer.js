const SignerEngine = (function () {
  'use strict';

  const WORKER_BASE = 'https://flarestore.app';
  const PROXY_BASE  = 'https://flarestore-proxy.techlxrd.workers.dev/?url=';
  const ALLOWED_INSTALL_ORIGINS = ['https://flarestore.app'];
  const MAX_SIZES = { ipa: 1073741824, p12: 10485760, prov: 5242880 };
  const TIMEOUTS = { network: 300000, validate: 15000, alert: 500 };

  function assertHttps(url, name) {
    if (!/^https:\/\//i.test(url)) throw new Error(`${name} must use HTTPS (got: ${url}).`);
  }
  assertHttps(WORKER_BASE, 'workerBase');
  assertHttps(PROXY_BASE, 'proxyBase');

  const LABELS = { ipa: 'Select iPA', p12: 'Select Certificate', prov: 'Select File' };
  const EXT_ERR = { ipa: 'Please select a .ipa file.', p12: 'Please select a .p12 or .pfx file.', prov: 'Please select a .mobileprovision file.' };
  const READ_ERR = {
    NotFoundError: 'File not found — it may not be downloaded from iCloud yet. Open the Files app, tap the file to download it, then try again.',
    NotReadableError: 'File is locked or in use by another app.',
    SecurityError: 'Security error — this file cannot be read.',
    AbortError: 'File read was cancelled.'
  };
  const CERT_IDS = ['cert-subject','cert-status','cert-expiry','cert-issuer','cert-serial',
                    'prov-name','prov-status','prov-expiry','prov-bundle','revocation-status'];
  const API_PARAMS = ['bundle_id','app_name','app_version','min_os_version','add_url_schemes'];
  const HAS_RAF = typeof requestAnimationFrame === 'function';

  const _cache = new Map();
  function _el(id) {
    const c = _cache.get(id);
    if (c && c.isConnected) return c;
    const f = document.getElementById(id);
    _cache.set(id, f);
    return f;
  }
  function _val(id) { const e = _el(id); return e ? e.value : ''; }
  function _app() { return (typeof app !== 'undefined' && app) || window.app || null; }
  function _fmt(b) {
    if (!b || b < 1024) return `${b || 0} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(2)} MB`;
  }

  const _logs = [];
  let _logRaf = 0;
  function _flushLogs() {
    _logRaf = 0;
    const el = _el('signer-logs');
    if (!el || !_logs.length) { _logs.length = 0; return; }
    const frag = document.createDocumentFragment();
    for (let i = 0; i < _logs.length; i++) {
      const it = _logs[i];
      const d = document.createElement('div');
      d.style.color = it.color || 'var(--f7-theme-color)';
      d.textContent = '> ' + String(it.msg).slice(0, 2000);
      frag.appendChild(d);
    }
    _logs.length = 0;
    el.appendChild(frag);
    el.scrollTop = el.scrollHeight;
  }

  let _lastAlert = 0;
  function _rateLimit() {
    const now = Date.now();
    if (now - _lastAlert < TIMEOUTS.alert) return false;
    _lastAlert = now;
    return true;
  }

  function _readSlice(file, mode, n, timeoutMs) {
    return new Promise((resolve, reject) => {
      let done = false;
      const reader = new FileReader();
      const timer = setTimeout(() => {
        try { reader.abort(); } catch (_) {}
        if (done) return; done = true;
        reject(new Error('File read timed out. The file may still be downloading from iCloud — open Files, tap the file, then try again.'));
      }, timeoutMs || TIMEOUTS.validate);
      const finish = (fn, val) => { if (done) return; done = true; clearTimeout(timer); fn(val); };
      reader.onload = () => finish(resolve, new Uint8Array(reader.result));
      reader.onerror = () => {
        const name = (reader.error && reader.error.name) || 'Error';
        finish(reject, new Error(READ_ERR[name] || `Cannot read file (${name}).`));
      };
      reader.onabort = () => finish(reject, new Error('File read cancelled.'));
      try {
        if (mode === 'head') reader.readAsArrayBuffer(file.slice(0, Math.min(n || 8192, file.size)));
        else if (mode === 'tail') { const sz = Math.min(n || 8192, file.size); reader.readAsArrayBuffer(file.slice(file.size - sz)); }
        else reader.readAsArrayBuffer(file);
      } catch (e) {
        finish(reject, new Error('Cannot start reading file: ' + (e && e.message ? e.message : 'unknown error')));
      }
    });
  }

  function _setFileBox(input, state, message, label) {
    const box = input.parentElement && input.parentElement.querySelector('.file-box');
    if (!box) return;
    const span = box.querySelector('span');
    box.style.borderWidth = box.style.borderStyle = box.style.borderColor = '';
    box.removeAttribute('title');
    if (state === 'error') {
      box.classList.remove('loaded');
      box.style.borderWidth = '1px';
      box.style.borderStyle = 'solid';
      box.style.borderColor = '#ff3b30';
      box.title = message || 'Invalid file';
      if (span) { span.textContent = (message || 'Invalid file').slice(0, 32); span.style.color = '#ff3b30'; }
    } else if (state === 'ok') {
      box.classList.add('loaded');
      if (span) span.style.color = '';
    } else {
      box.classList.remove('loaded');
      if (span) { span.textContent = label || 'Select File'; span.style.color = ''; }
    }
  }

  return {
    workerBase: WORKER_BASE,
    proxyBase: PROXY_BASE,
    files: { ipa: null, p12: null, prov: null },
    appInfo: null,
    currentMode: 'custom',
    _hasCertResults: false,
    _scriptPromises: {},
    _fileSeq: 0,
    _initDone: false,

    _invalidateElementCache: () => _cache.clear(),

    _fetch: async function (url, options) {
      if (typeof url !== 'string' || !/^https:\/\//i.test(url)) throw new Error('Refusing to fetch a non-HTTPS URL.');
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort('timeout'), TIMEOUTS.network);
      const opts = Object.assign({}, options, { signal: ctrl.signal });
      let res;
      try { res = await fetch(this.proxyBase + encodeURIComponent(url), opts); }
      catch (err) {
        clearTimeout(timer);
        if (err && err.name === 'AbortError') throw new Error('Request timed out. Your connection may be slow — please retry.');
        throw new Error(`Network error: ${(err && err.message) || 'unknown'}.`);
      }
      clearTimeout(timer);
      if (!res.ok) {
        let body = '';
        try { body = await res.clone().text(); } catch (_) {}
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300) || 'request rejected'}`);
      }
      return res;
    },

    _fetchJson: async function (url, opts, label) {
      const p = await this._parseResponse(await this._fetch(url, opts));
      this.log(`${label} HTTP ${p.status} (${p.type})`, '#8e8e93');
      return p;
    },

    log: function (msg, color) {
      _logs.push({ msg, color });
      if (_logRaf) return;
      if (HAS_RAF) _logRaf = requestAnimationFrame(_flushLogs);
      else _flushLogs();
    },

    _setHtml: function (id, v) { const e = _el(id); if (e) e.innerHTML = v; },
    _setText: function (id, v) { const e = _el(id); if (e) e.textContent = v; },

    _alert: function (message, title) {
      if (!_rateLimit()) return;
      const msg = String(message || 'Unknown error').slice(0, 500);
      const a = _app();
      title = title || 'Error';
      if (!a || !a.dialog) { try { window.alert(`${title}: ${msg}`); } catch (_) {} return; }
      if (a.dialog.alert) return a.dialog.alert(msg, title);
      a.dialog.create({ title, text: msg, buttons: [{ text: 'OK' }] }).open();
    },

    _preloader: function (text) {
      const a = _app();
      if (a && a.dialog && a.dialog.preloader) { try { a.dialog.preloader(text); } catch (_) {} }
    },

    _closePreloader: function () {
      const a = _app();
      if (a && a.dialog && a.dialog.close) { try { a.dialog.close(); } catch (_) {} }
    },

    _clearP12Password: function () { const e = _el('p12-pass'); if (e) e.value = ''; },

    _checkExtension: function (name, type) {
      const i = name.lastIndexOf('.');
      const ext = i === -1 ? '' : name.slice(i).toLowerCase();
      if (type === 'ipa') return ext === '.ipa';
      if (type === 'p12') return ext === '.p12' || ext === '.pfx';
      if (type === 'prov') return ext === '.mobileprovision' || ext === '.provisionprofile';
      return false;
    },

    _validateFile: async function (file, type) {
      const max = MAX_SIZES[type] || MAX_SIZES.ipa;
      if (file.size > max) return `File exceeds maximum size of ${_fmt(max)}.`;
      if (file.size === 0) return 'File is empty or not yet downloaded from iCloud. Open Files and tap the file to download it, then try again.';
      if (file.size < 64) return 'File is too small to be valid.';

      if (type === 'ipa') {
        const h = await _readSlice(file, 'head', 4);
        return h.length >= 4 && !(h[0] === 0x50 && h[1] === 0x4B && h[2] === 0x03 && h[3] === 0x04)
          ? 'Not a valid iPA (missing ZIP signature).' : null;
      }
      if (type === 'p12') {
        const h = await _readSlice(file, 'head', 4);
        return h.length && h[0] !== 0x30 ? 'Not a valid P12 (bad ASN.1 header).' : null;
      }
      if (type === 'prov') {
        const h = await _readSlice(file, 'head', 4096);
        if (h.length < 4 || h[0] === 0x30) return null;
        const ht = new TextDecoder('utf-8').decode(h);
        if (ht.includes('<?xml') || ht.includes('<plist')) return null;
        const t = await _readSlice(file, 'tail', 4096);
        if (new TextDecoder('utf-8').decode(t).includes('</plist>')) return null;
        return 'Not a valid provisioning profile.';
      }
      return 'Unknown file type.';
    },

    _resetFileInput: function (input, type, err) {
      try { input.value = ''; } catch (_) {}
      _setFileBox(input, err ? 'error' : 'idle', err, LABELS[type] || 'Select File');
    },

    _rejectFile: function (input, type, reason) {
      this.files[type] = null;
      this._fileSeq++;
      this._resetFileInput(input, type, reason);
      this.log(`${type.toUpperCase()} rejected: ${reason}`, '#ff3b30');
      this._alert(reason, 'Invalid File');
    },

    _validateSelection: function (input, type) {
      const files = input.files;
      if (!files || !files.length) { this.log(`${type.toUpperCase()}: no file received.`, '#ff9500'); return null; }
      const file = files[0];
      if (typeof file.name !== 'string' || !file.name.length || file.name.length > 255) { this._rejectFile(input, type, 'Invalid filename.'); return null; }
      if (!this._checkExtension(file.name, type)) { this._rejectFile(input, type, EXT_ERR[type] || 'Invalid file type.'); return null; }
      const max = MAX_SIZES[type];
      if (file.size > max) { this._rejectFile(input, type, `${type.toUpperCase()} exceeds maximum size of ${_fmt(max)}.`); return null; }
      if (file.size === 0) { this._rejectFile(input, type, `${type.toUpperCase()} is empty or not yet downloaded from iCloud. Open Files, tap the file to download it, then retry.`); return null; }
      return file;
    },

    _arrayBufferToBinaryString: function (buf) {
      const b = new Uint8Array(buf);
      let out = '';
      for (let i = 0; i < b.length; i += 0x8000) out += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      return out;
    },

    _parseResponse: async function (res) {
      const text = await res.text();
      const trimmed = text.trim();
      let json = null;
      if (trimmed && (trimmed[0] === '{' || trimmed[0] === '[')) {
        try { json = JSON.parse(trimmed); } catch (_) {}
      }
      if (json !== null) return { type: 'json', data: json, text, status: res.status, ok: res.ok };
      return {
        type: 'text', text,
        snippet: text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<\/?[^>]+(>|$)/g, '').slice(0, 1200),
        status: res.status, ok: res.ok
      };
    },

    _extractError: function (p, fallback) {
      if (!p) return fallback;
      if (p.type === 'json' && p.data && typeof p.data === 'object') {
        const m = p.data.error || p.data.message || p.data.detail;
        return typeof m === 'string' && m.length ? m.slice(0, 500) : fallback;
      }
      return p.snippet ? p.snippet.slice(0, 500) : fallback;
    },

    _normalizeRevocationStatus: function (p) {
      if (!p || typeof p !== 'object') return 'unknown';
      const keys = ['status', 'revocation_status', 'revocationStatus', 'state'];
      const pick = s => {
        if (typeof s !== 'string') return null;
        const l = s.toLowerCase();
        if (l === 'revoked') return 'revoked';
        if (l === 'good' || l === 'valid' || l === 'signed' || l === 'ok') return 'good';
        return null;
      };
      for (let i = 0; i < keys.length; i++) { const r = pick(p[keys[i]]); if (r) return r; }
      const inner = p.data || p.result;
      if (inner && typeof inner === 'object') {
        for (let i = 0; i < keys.length; i++) { const r = pick(inner[keys[i]]); if (r) return r; }
      }
      let j;
      try { j = JSON.stringify(p).toLowerCase(); } catch (_) { return 'unknown'; }
      if (j.includes('"status":"revoked"') || j.includes('revoked')) return 'revoked';
      if (j.includes('"status":"signed"') || j.includes('"status":"valid"') || j.includes('"status":"good"') ||
          j.includes('good') || j.includes('valid')) return 'good';
      return 'unknown';
    },

    _hideCertUI: function () { const b = _el('cert-info-list'); if (b) b.style.display = 'none'; },
    _showCertUI: function () { const b = _el('cert-info-list'); if (b) b.style.display = 'block'; },
    _syncCertUIVisibility: function () {
      const b = _el('cert-info-list');
      if (b) b.style.display = (this.currentMode === 'check' && this._hasCertResults) ? 'block' : 'none';
    },
    _clearCertValues: function () {
      for (let i = 0; i < CERT_IDS.length; i++) { const e = _el(CERT_IDS[i]); if (e) e.textContent = '—'; }
    },
    _markCertDataDirty: function () { this._hasCertResults = false; this._hideCertUI(); },

    showModeFiles: function (mode) {
      const items = document.querySelectorAll('#upload-list [data-modes]');
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        it.style.display = it.getAttribute('data-modes').split(',').indexOf(mode) !== -1 ? '' : 'none';
      }
      const isSerial = mode === 'check' && _val('cert-check-method') === 'serial';
      const p12Els = document.querySelectorAll('.check-method-p12');
      const serEls = document.querySelectorAll('.check-method-serial');
      for (let i = 0; i < p12Els.length; i++) p12Els[i].style.display = isSerial ? 'none' : '';
      for (let i = 0; i < serEls.length; i++) serEls[i].style.display = isSerial ? '' : 'none';
      const dsb = _el('direct-sign-button');
      if (dsb) dsb.style.display = mode === 'check' ? 'none' : 'block';
    },

    initModeSegmented: function () {
      const container = _el('mode-segmented');
      if (!container || this._initDone) return;
      this._initDone = true;
      const buttons = container.querySelectorAll('.button');
      const sb = _el('signing-options-block');
      const ab = _el('app-info-block');
      const sBtn = _el('sign-button');
      const cBtn = _el('check-button');
      const self = this;
      const setActive = function (mode) {
        for (let i = 0; i < buttons.length; i++) {
          const b = buttons[i];
          const on = b.getAttribute('data-mode') === mode;
          if (on !== b.classList.contains('button-active')) b.classList.toggle('button-active', on);
        }
        self.currentMode = mode;
        self.showModeFiles(mode);
        if (mode !== 'check') self._hideCertUI(); else self._syncCertUIVisibility();
        const hide = mode === 'check' || !self.files.ipa;
        if (sb) sb.style.display = hide ? 'none' : 'block';
        if (ab) ab.style.display = hide ? 'none' : 'block';
        if (sBtn) sBtn.style.display = mode === 'check' ? 'none' : 'block';
        if (cBtn) cBtn.style.display = mode === 'check' ? 'block' : 'none';
      };
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        btn.onclick = function (e) { e.preventDefault(); setActive(btn.getAttribute('data-mode')); };
      }
      setActive('custom');
    },

    onFile: function (input, type) {
      const file = this._validateSelection(input, type);
      if (!file) return;
      this.files[type] = file;
      const seq = ++this._fileSeq;
      _setFileBox(input, 'ok', null, LABELS[type]);
      this.log(`${type.toUpperCase()} loaded: ${file.name} (${_fmt(file.size)})`, '#34c759');
      if (type === 'p12' || type === 'prov') {
        this._markCertDataDirty();
        this._clearCertValues();
        this._syncCertUIVisibility();
      }
      this.log(`${type.toUpperCase()}: validating…`, '#8e8e93');
      this._validateFile(file, type).then(reason => {
        if (seq !== this._fileSeq) return;
        if (reason) this._rejectFile(input, type, reason);
        else this.log(`${type.toUpperCase()} validated`, '#34c759');
      }).catch(e => {
        if (seq !== this._fileSeq) return;
        this._rejectFile(input, type, (e && e.message) || 'File validation failed.');
      });
    },

    onIPASelected: async function (input) {
      const file = this._validateSelection(input, 'ipa');
      if (!file) return;
      this.files.ipa = file;
      const seq = ++this._fileSeq;
      _setFileBox(input, 'ok', null, LABELS.ipa);
      this.log(`IPA loaded: ${file.name} (${_fmt(file.size)})`, '#34c759');
      const ab = _el('app-info-block');
      const sb = _el('signing-options-block');
      if (ab) ab.style.display = 'none';
      if (sb) sb.style.display = 'none';
      try {
        this._preloader('Parsing app…');
        if (typeof AppInfoParser !== 'undefined') {
          const info = await new AppInfoParser(file).parse();
          if (seq !== this._fileSeq) return;
          this.appInfo = info;
          this.log(`Parsed: ${info.CFBundleName || info.name || 'Unknown'}`, '#34c759');
          this.updateAppInfoUI(info);
        }
      } catch (e) {
        this.log(`Parsing failed: ${(e && e.message) || 'iPA parsing failed'}`, '#ff9500');
      } finally {
        this._closePreloader();
      }
      if (this.currentMode !== 'check') {
        if (ab) ab.style.display = 'block';
        if (sb) sb.style.display = 'block';
      }
      this._validateFile(file, 'ipa').then(reason => {
        if (seq !== this._fileSeq) return;
        if (reason) this._rejectFile(input, 'ipa', reason);
        else this.log('IPA validated', '#34c759');
      }).catch(e => {
        if (seq !== this._fileSeq) return;
        this._rejectFile(input, 'ipa', (e && e.message) || 'IPA validation failed.');
      });
    },

    updateAppInfoUI: function (info) {
      this._setText('app-name', info.CFBundleName || info.name || 'Unknown');
      this._setText('app-version', `Version ${info.CFBundleShortVersionString || info.version || '?'}`);
      this._setText('app-bundle', info.CFBundleIdentifier || '?');
      const icon = _el('app-icon');
      if (icon) {
        if (info.icon) { icon.src = info.icon; icon.style.display = 'block'; }
        else icon.style.display = 'none';
      }
    },

    _loadScript: function (src) {
      if (this._scriptPromises[src]) return this._scriptPromises[src];
      const self = this;
      const p = new Promise((resolve, reject) => {
        const have = document.querySelector(`script[src="${src}"]`);
        if (have) {
          if ((src.includes('forge.min.js') && window.forge) || (src.includes('plist.js') && window.plist)) return resolve();
          have.addEventListener('load', resolve, { once: true });
          have.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.onload = resolve;
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });
      this._scriptPromises[src] = p;
      p.catch(() => { delete self._scriptPromises[src]; });
      return p;
    },

    _readFileAsArrayBuffer: function (file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(r.error || new Error('File read failed'));
        r.readAsArrayBuffer(file);
      });
    },

    _parseMobileProvision: function (data) {
      const text = new TextDecoder('utf-8').decode(data);
      const start = text.indexOf('<?xml');
      const end = text.lastIndexOf('</plist>');
      if (start === -1 || end === -1) throw new Error('Invalid mobileprovision file');
      if (typeof window.plist === 'undefined') throw new Error('plist parser not available');
      const p = window.plist.parse(text.slice(start, end + 8)) || {};
      const e = p.Entitlements || {};
      const aid = e['application-identifier'];
      return {
        name: p.Name || p.AppIDName || 'Unnamed',
        bundleId: aid ? aid.split('.').slice(1).join('.') : 'Unknown',
        teamIdentifier: p.TeamIdentifier || [],
        expirationDate: p.ExpirationDate ? new Date(p.ExpirationDate) : null,
        entitlements: e,
        uuid: p.UUID || '',
        provisionsAllDevices: !!p.ProvisionsAllDevices
      };
    },

    _parseP12: async function (data, password) {
      const forge = window.forge || globalThis.forge;
      if (!forge) throw new Error('Forge not available');
      try {
        const asn1 = forge.asn1.fromDer(this._arrayBufferToBinaryString(data));
        const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password || '');
        const bags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] || [];
        const cert = bags[0] && bags[0].cert;
        if (!cert) throw new Error('No certificate found in P12');
        const attrs = list => {
          const o = {};
          for (const a of list || []) {
            const k = a.shortName || a.name || a.type;
            if (k) o[k] = a.value;
          }
          return o;
        };
        const v = cert.validity || {};
        const nb = v.notBefore ? new Date(v.notBefore) : null;
        const na = v.notAfter ? new Date(v.notAfter) : null;
        if (!nb || !na) throw new Error('Certificate validity data is missing');
        return {
          subject: attrs(cert.subject.attributes),
          issuer: attrs(cert.issuer.attributes),
          validity: { notBefore: nb, notAfter: na },
          serialNumber: cert.serialNumber || ''
        };
      } catch (err) {
        throw new Error('Invalid P12 password or certificate file.');
      }
    },

    checkCert: async function () {
      if (this.currentMode !== 'check') { this._alert('Check mode must be active.', 'Error'); return; }
      const method = _val('cert-check-method') || 'p12';
      const serialEl = _el('cert-serial-input');
      if (method === 'p12' && (!this.files.prov || !this.files.p12)) { this._alert('Upload both a P12 and mobileprovision file.', 'Missing Files'); return; }
      if (method === 'serial' && (!serialEl || !serialEl.value.trim())) { this._alert('Provide a serial number.', 'Missing Serial'); return; }

      this.log('Checking certificate validity…', '#ff9500');
      this._hasCertResults = false;
      this._clearCertValues();
      const revEl = _el('revocation-status');
      if (revEl) revEl.innerHTML = '<span class="badge color-orange">Checking API</span>';

      try {
        if (!window.forge) await this._loadScript('https://cdn.jsdelivr.net/npm/node-forge@1.3.1/dist/forge.min.js');
        if (!window.plist) await this._loadScript('https://cdn.jsdelivr.net/npm/plist@3.0.5/dist/plist.js');

        const p12Pass = _val('p12-pass');
        let certData = null, provInfo = null;
        if (method === 'p12' && window.forge) {
          try { certData = await this._parseP12(await this._readFileAsArrayBuffer(this.files.p12), p12Pass); }
          catch (e) { this.log(`P12 parse: ${e.message}`, '#ff9500'); }
        }
        if (method === 'p12' && window.plist) {
          try { provInfo = this._parseMobileProvision(await this._readFileAsArrayBuffer(this.files.prov)); }
          catch (e) { this.log(`Provision parse: ${e.message}`, '#ff9500'); }
        }

        if (certData) {
          const now = Date.now();
          const ok = certData.validity.notBefore.getTime() <= now && certData.validity.notAfter.getTime() >= now;
          this._setText('cert-subject', certData.subject.CN || 'Unknown');
          this._setHtml('cert-status', ok ? '<span class="badge color-green">Valid File</span>' : '<span class="badge color-red">Expired File</span>');
          this._setText('cert-expiry', certData.validity.notAfter.toLocaleString());
          this._setText('cert-issuer', certData.issuer.CN || 'Unknown');
          this._setText('cert-serial', certData.serialNumber || 'Unknown');
        }
        if (provInfo) {
          const ok = provInfo.expirationDate && provInfo.expirationDate.getTime() > Date.now();
          this._setText('prov-name', provInfo.name || 'Unnamed');
          this._setHtml('prov-status', ok ? '<span class="badge color-green">Valid File</span>' : '<span class="badge color-red">Expired File</span>');
          this._setText('prov-expiry', provInfo.expirationDate ? provInfo.expirationDate.toLocaleString() : 'Unknown');
          this._setText('prov-bundle', provInfo.bundleId || 'Unknown');
        }

        this._hasCertResults = true;
        this._showCertUI();

        const fd = new FormData();
        fd.append('method', method);
        if (method === 'p12') {
          fd.append('p12', this.files.p12, this.files.p12.name);
          fd.append('provision', this.files.prov, this.files.prov.name);
          if (p12Pass) fd.append('password', p12Pass);
        } else {
          fd.append('serial', serialEl.value.trim());
          fd.append('serialType', _val('cert-serial-type') || 'decimal');
        }

        const parsed = await this._fetchJson(`${this.workerBase}/check-cert`, { method: 'POST', body: fd }, 'Server responded');
        if (parsed.type !== 'json') {
          const msg = this._extractError(parsed, `Server returned non-JSON (HTTP ${parsed.status}).`);
          this.log('Response parse failed: ' + msg, '#ff3b30');
          if (revEl) revEl.innerHTML = '<span class="badge color-gray">Error</span>';
          this._alert(msg, 'Check Failed');
          return;
        }
        const root = parsed.data;
        if (!parsed.ok || !root || root.success === false || root.status === 'error' || root.error) {
          const msg = this._extractError(parsed, `Check failed (HTTP ${parsed.status}).`);
          this.log('API error: ' + msg, '#ff3b30');
          if (revEl) revEl.innerHTML = '<span class="badge color-red">Error</span>';
          this._alert(msg, 'Certificate Check Failed');
          return;
        }
        if (revEl) {
          const s = this._normalizeRevocationStatus(root);
          revEl.innerHTML = s === 'revoked' ? '<span class="badge color-red">Revoked</span>'
                          : s === 'good' ? '<span class="badge color-green">Signed/Valid</span>'
                          : '<span class="badge color-gray">Unknown</span>';
        }
        this.log('Certificate check completed.', '#34c759');
      } catch (err) {
        const msg = (err && err.message) || 'Unknown error';
        this.log('Check failed: ' + msg, '#ff3b30');
        if (revEl) revEl.innerHTML = '<span class="badge color-gray">Error</span>';
        this._alert(msg, 'Check Failed');
      } finally {
        this._syncCertUIVisibility();
      }
    },

    _appendSigningOptions: function (fd) {
      const pw = _val('p12-pass');
      const icon = _el('custom-icon');
      const tweak = _el('tweak-file');
      if (pw) fd.append('p12_password', pw);
      if (icon && icon.files[0]) fd.append('icon', icon.files[0], icon.files[0].name);
      if (tweak && tweak.files[0]) fd.append('tweak', tweak.files[0], tweak.files[0].name);
      for (let i = 0; i < API_PARAMS.length; i++) {
        const p = API_PARAMS[i];
        const v = _val('sign-' + p.replace(/_/g, '-'));
        if (v) fd.append(p, v);
      }
      const sel = _el('sign-boolean-options');
      if (sel) {
        const opts = sel.selectedOptions;
        for (let i = 0; i < opts.length; i++) if (opts[i].value) fd.append(opts[i].value, 'true');
      }
    },

    _validateInstallUrl: function (url) {
      let u;
      try { u = new URL(url, this.workerBase); }
      catch (e) { throw new Error('Server returned an invalid install URL.'); }
      if (ALLOWED_INSTALL_ORIGINS.indexOf(u.origin) === -1) throw new Error(`Refusing to open untrusted install URL (${u.origin}).`);
      return u.href;
    },

    _openInstallPopup: function (url) {
      const iframe = document.getElementById('signer-install-iframe');
      if (iframe) iframe.src = url;
      const a = _app();
      if (a && a.popup && a.popup.open) a.popup.open('#signer-install-popup');
      else { this.log('Install popup not found — open the URL manually:', '#ff9500'); this.log(url); }
    },

    sign: async function () {
      const mode = this.currentMode || 'custom';
      if (!this.files.ipa) { this._alert('Please select an iPA file first.', 'Missing IPA'); return; }
      if (mode === 'custom' && (!this.files.p12 || !this.files.prov)) { this._alert('Custom mode needs both P12 and MobileProvision files.', 'Missing Files'); return; }

      try {
        this._preloader('Signing');
        this.log('Uploading iPA to signing server and signing…', '#ff9500');

        const ufd = new FormData();
        ufd.append('ipa', this.files.ipa, this.files.ipa.name);
        const up = await this._fetchJson(`${this.workerBase}/upload/ipa`, { method: 'POST', body: ufd }, 'Upload');
        if (!up.ok || up.type !== 'json' || !up.data || !up.data.session_id) {
          const msg = this._extractError(up, `iPA upload rejected (HTTP ${up.status}).`);
          this.log('Upload failed: ' + msg, '#ff3b30');
          throw new Error(msg);
        }
        const session = up.data.session_id;
        this.log('Upload complete. Session: ' + session, '#34c759');

        this._preloader('Signing App');
        this.log('Submitting signing request', '#ff9500');

        const sfd = new FormData();
        sfd.append('session_id', session);
        sfd.append('p12', this.files.p12, this.files.p12.name);
        sfd.append('provision', this.files.prov, this.files.prov.name);
        this._appendSigningOptions(sfd);

        const sp = await this._fetchJson(`${this.workerBase}/sign`, { method: 'POST', body: sfd }, 'Sign');
        if (sp.type !== 'json') {
          const msg = this._extractError(sp, 'Signing server returned non-JSON response.');
          this.log('Signing failed: ' + msg, '#ff3b30');
          throw new Error(msg);
        }
        const j = sp.data || {};
        if (!sp.ok || !j.success || !j.install_url) {
          const msg = this._extractError(sp, 'Signing failed.') || j.error || j.message;
          this.log('Signing failed: ' + msg, '#ff3b30');
          throw new Error(msg);
        }

        const rawUrl = j.install_url[0] === '/' ? this.workerBase + j.install_url : j.install_url;
        const installUrl = this._validateInstallUrl(rawUrl);

        this.log('Signed successfully!', '#34c759');
        this.log('Install URL: ' + installUrl);
        if (j.message) this.log(j.message, '#34c759');

        this._clearP12Password();
        this._closePreloader();
        this._openInstallPopup(installUrl);
      } catch (e) {
        const msg = (e && e.message) || 'Unknown error';
        this.log('Signing Error: ' + msg, '#ff3b30');
        this._alert(msg, 'Signing Failed');
      } finally {
        this._closePreloader();
      }
    }
  };
})();

window.openSignerPopup = function () {
  if (window.app && app.popup) app.popup.open('#signer-popup');
  const S = window.SignerEngine;
  if (!S) return;
  S._invalidateElementCache();
  S.initModeSegmented();
  const sign = document.getElementById('sign-button');
  const check = document.getElementById('check-button');
  if (sign) sign.onclick = () => S.sign();
  if (check) check.onclick = () => S.checkCert();
  const sel = document.getElementById('cert-check-method');
  if (sel && !sel._skBound) {
    sel._skBound = true;
    sel.addEventListener('change', () => S.showModeFiles('check'));
  }
};

window.updateFileLabel = function (input) {
  const box = input.parentElement && input.parentElement.querySelector('.file-box');
  if (!box) return;
  const f = input.files && input.files[0];
  if (!f) return;
  box.classList.add('loaded');
  box.style.borderColor = box.style.borderWidth = box.style.borderStyle = '';
  const span = box.querySelector('span');
  if (span) {
    span.style.color = '';
    span.textContent = f.name.length > 25 ? f.name.slice(0, 22) + '...' : f.name;
  }
};

window.SignerEngine = SignerEngine;