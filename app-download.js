/* "Download the app" — one file, copied unchanged into all four web apps
   (assets/js/app-download.js) and used by the download page itself.
   Canonical copy: PMODepartment/megawide-apps (private) docs/app-download.js — edit there
   and copy out, so the four sidebars never disagree.

   It picks the installer for the device you are on:
     Windows -> .exe   Mac -> .dmg
   DESKTOP ONLY (2026-10-15): on a phone or tablet (Android, iPhone, iPad) and on
   anything it cannot identify, NO button is shown — the phone apps are paused.
   It also hides itself inside the Megawide Apps app (its user agent carries
   "MegawideApps"), where offering the app would make no sense.
   To bring phones back, add their keys to SHOW_ON.

   Placement: the first row of the sidebar's sibling-app group (.pd-nav-foot) in
   Planning, Bids and Engineering, and just above the sidebar footer in
   Procurement, which has no such group. Sidebars that are re-rendered by script
   (Bids modules, Engineering) are picked up by a MutationObserver.

   Links use GitHub's "latest release" URLs, which never change between releases. */
(function (root) {
  /* PUBLIC downloads repo: the code repo (megawide-apps) is private, and private
     release files need a GitHub login to download. */
  var REPO = 'https://github.com/PMODepartment/megawide-apps-downloads';
  var LATEST = REPO + '/releases/latest/download/';
  var PAGE = 'https://pmodepartment.github.io/megawide-apps-downloads/';
  /* Set once the paid Apple account exists and iPhone builds are published:
     the itms-services:// install link for the signed build. Until then iPhone
     users are sent to the download page, which explains. */
  var IOS_INSTALL_URL = '';

  /* The devices that get a button. Everything else (android, ios, other, inapp)
     gets nothing. */
  var SHOW_ON = { windows: true, mac: true };

  var TARGETS = {
    windows: { label: 'Download for Windows', url: LATEST + 'Megawide-Apps-Setup.exe', file: true },
    mac:     { label: 'Download for Mac',     url: LATEST + 'Megawide-Apps.dmg',       file: true },
    android: { label: 'Download for Android', url: LATEST + 'Megawide-Apps.apk',       file: true },
    ios:     { label: 'Get the iPhone app',   url: IOS_INSTALL_URL || PAGE + '#iphone', file: !!IOS_INSTALL_URL },
    other:   { label: 'Download the app',     url: PAGE,                                 file: false }
  };

  function detect(ua, platform, touchPoints) {
    ua = ua || ''; platform = platform || '';
    if (/MegawideApps/.test(ua)) return 'inapp';
    if (/Android/i.test(ua)) return 'android';
    /* iPadOS reports itself as a Mac; a touch screen gives it away (no Mac has
       one). Case-insensitive: Chromium's userAgentData reports 'macOS', which a
       case-sensitive /Mac/ missed, so a touch "Mac" was offered the .dmg. */
    if (/iPhone|iPad|iPod/.test(ua) || ((/mac/i.test(platform) || /Macintosh/.test(ua)) && touchPoints > 1)) return 'ios';
    if (/Win/i.test(platform) || /Windows/.test(ua)) return 'windows';
    if (/Mac/i.test(platform) || /Mac OS X/.test(ua)) return 'mac';
    return 'other';
  }
  function current() {
    var n = root.navigator || {};
    var platform = (n.userAgentData && n.userAgentData.platform) || n.platform || '';
    return detect(n.userAgent, platform, n.maxTouchPoints || 0);
  }

  var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>';

  function link(device, cls, inner) {
    var t = TARGETS[device];
    var a = document.createElement('a');
    a.className = cls;
    a.href = t.url;
    a.setAttribute('data-mwdl', device);
    a.title = t.label + ' — Megawide Apps: all four apps in one app';
    if (!t.file) { a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML = inner(t.label);
    return a;
  }

  function shows(device) { return SHOW_ON[device] === true; }

  function mountInto(doc) {
    var device = current();
    if (!shows(device)) return;
    /* Planning, Bids, Engineering: first row of the sibling-app group. */
    var foots = doc.querySelectorAll('.pd-nav-foot');
    for (var i = 0; i < foots.length; i++) {
      var f = foots[i];
      if (f.querySelector('[data-mwdl]')) continue;
      f.insertBefore(link(device, 'pd-nav-sibling mwdl-row', function (label) {
        return '<span class="pd-navico">' + ICON + '</span><span class="pd-navtxt">' + label + '</span>';
      }), f.firstChild);
    }
    /* Procurement: no sibling group, so just above the sidebar footer. */
    var prc = doc.querySelector('.sidebar > .sidebar-footer');
    if (prc && !doc.querySelector('.sidebar [data-mwdl]')) {
      var wrap = doc.createElement('div');
      wrap.className = 'sidebar-section mwdl-section';
      /* Procurement's own icon font (Tabler), so it matches its neighbours exactly. */
      wrap.appendChild(link(device, 'nav-item mwdl-row', function (label) {
        return '<i class="ti ti-download" aria-hidden="true"></i>' + label;
      }));
      prc.parentNode.insertBefore(wrap, prc);
    }
  }

  function injectCss(doc) {
    if (doc.getElementById('mwdl-css')) return;
    var s = doc.createElement('style');
    s.id = 'mwdl-css';
    /* Same row as its neighbours; a brand-red icon is the only accent, so it
       reads as part of the group rather than as an advert. */
    s.textContent =
      '.mwdl-row svg{display:block;color:#FF7A6E}' +
      '.mwdl-row .pd-navico{opacity:1!important;display:inline-flex}' +
      '.mwdl-row .ti-download{color:#FF7A6E}' +
      /* Pinned to the bottom of Procurement's rail, directly above its footer.
         ⚠️ The footer carries margin-top:auto too; two auto margins would SPLIT
         the free space and float this mid-rail, so the footer's is zeroed. */
      '.sidebar>.mwdl-section{margin-top:auto;padding-bottom:4px}' +
      '.sidebar>.mwdl-section+.sidebar-footer{margin-top:0}';
    (doc.head || doc.documentElement).appendChild(s);
  }

  function start() {
    if (typeof document === 'undefined' || !shows(current())) return;
    injectCss(document);
    mountInto(document);
    if (root.MutationObserver) {
      var pending = false;
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        setTimeout(function () { pending = false; mountInto(document); }, 50);
      }).observe(document.body || document.documentElement, { childList: true, subtree: true });
    }
  }

  var api = { detect: detect, current: current, shows: shows, targets: TARGETS, page: PAGE, repo: REPO, mount: start };
  root.MegawideDownload = api;
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  if (root.__MEGAWIDE_DOWNLOAD_NO_AUTOMOUNT) return;   // the download page renders its own UI
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : this);
