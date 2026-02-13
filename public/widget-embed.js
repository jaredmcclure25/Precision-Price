/**
 * Precision Prices - Embeddable Widget Script
 * Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.
 *
 * Usage:
 * <script src="https://precisionprices.com/widget-embed.js" data-business-id="YOUR_ID"></script>
 */
(function() {
  'use strict';

  // Find the script tag to get config
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];
  var businessId = currentScript.getAttribute('data-business-id');

  if (!businessId) {
    console.error('Precision Prices Widget: Missing data-business-id attribute');
    return;
  }

  var baseUrl = currentScript.src.replace('/widget-embed.js', '') || 'https://precisionprices.com';
  var widgetUrl = baseUrl + '/widget/' + businessId;

  // Styles
  var styles = document.createElement('style');
  styles.textContent = [
    '.pp-widget-btn {',
    '  position: fixed;',
    '  bottom: 24px;',
    '  right: 24px;',
    '  background: linear-gradient(135deg, #10b981, #059669);',
    '  color: white;',
    '  border: none;',
    '  padding: 14px 24px;',
    '  border-radius: 50px;',
    '  font-size: 16px;',
    '  font-weight: 600;',
    '  cursor: pointer;',
    '  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);',
    '  z-index: 99998;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  transition: transform 0.2s, box-shadow 0.2s;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '}',
    '.pp-widget-btn:hover {',
    '  transform: scale(1.05);',
    '  box-shadow: 0 6px 28px rgba(16, 185, 129, 0.5);',
    '}',
    '.pp-widget-btn svg {',
    '  width: 20px;',
    '  height: 20px;',
    '}',
    '.pp-widget-overlay {',
    '  position: fixed;',
    '  inset: 0;',
    '  background: rgba(0,0,0,0.5);',
    '  z-index: 99999;',
    '  display: none;',
    '  align-items: center;',
    '  justify-content: center;',
    '}',
    '.pp-widget-overlay.pp-open {',
    '  display: flex;',
    '}',
    '.pp-widget-frame-container {',
    '  width: 420px;',
    '  max-width: 95vw;',
    '  height: 680px;',
    '  max-height: 90vh;',
    '  background: white;',
    '  border-radius: 16px;',
    '  overflow: hidden;',
    '  box-shadow: 0 25px 50px rgba(0,0,0,0.25);',
    '  position: relative;',
    '}',
    '.pp-widget-close {',
    '  position: absolute;',
    '  top: 8px;',
    '  right: 8px;',
    '  width: 32px;',
    '  height: 32px;',
    '  background: rgba(0,0,0,0.1);',
    '  border: none;',
    '  border-radius: 50%;',
    '  cursor: pointer;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  font-size: 18px;',
    '  color: #666;',
    '  z-index: 1;',
    '}',
    '.pp-widget-close:hover { background: rgba(0,0,0,0.2); }',
    '.pp-widget-iframe {',
    '  width: 100%;',
    '  height: 100%;',
    '  border: none;',
    '}'
  ].join('\n');
  document.head.appendChild(styles);

  // Create button
  var btn = document.createElement('button');
  btn.className = 'pp-widget-btn';
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Get Estimate';
  document.body.appendChild(btn);

  // Create overlay
  var overlay = document.createElement('div');
  overlay.className = 'pp-widget-overlay';
  overlay.innerHTML = '<div class="pp-widget-frame-container">' +
    '<button class="pp-widget-close">&times;</button>' +
    '<iframe class="pp-widget-iframe" src="' + widgetUrl + '"></iframe>' +
    '</div>';
  document.body.appendChild(overlay);

  // Event handlers
  btn.addEventListener('click', function() {
    overlay.classList.add('pp-open');
  });

  overlay.querySelector('.pp-widget-close').addEventListener('click', function() {
    overlay.classList.remove('pp-open');
  });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.classList.remove('pp-open');
    }
  });
})();
