// CodeRulit PWA Controller & Service Worker Registration
(function () {
  'use strict';

  let deferredPrompt = null;
  let isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  window.CodeRulitPWA = {
    deferredPrompt: null,
    isInstallable: false,
    isInstalled: isInstalled,
    isOffline: !navigator.onLine,

    async promptInstall() {
      if (!deferredPrompt) {
        console.log('[PWA] Install prompt not available or already installed.');
        return false;
      }
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        console.log('[PWA] User choice:', choice.outcome);
        if (choice.outcome === 'accepted') {
          this.isInstalled = true;
          this.isInstallable = false;
          deferredPrompt = null;
          this.deferredPrompt = null;
          dispatchPwaState();
          return true;
        }
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
      return false;
    }
  };

  function dispatchPwaState() {
    window.dispatchEvent(new CustomEvent('coderulit-pwa-state', {
      detail: {
        isInstallable: window.CodeRulitPWA.isInstallable,
        isInstalled: window.CodeRulitPWA.isInstalled,
        isOffline: window.CodeRulitPWA.isOffline
      }
    }));
  }

  // 1. Capture PWA Install Prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.CodeRulitPWA.deferredPrompt = e;
    window.CodeRulitPWA.isInstallable = true;
    console.log('[PWA] beforeinstallprompt event captured.');
    dispatchPwaState();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully!');
    deferredPrompt = null;
    window.CodeRulitPWA.deferredPrompt = null;
    window.CodeRulitPWA.isInstallable = false;
    window.CodeRulitPWA.isInstalled = true;
    dispatchPwaState();
  });

  // 2. Online / Offline Status
  window.addEventListener('online', () => {
    window.CodeRulitPWA.isOffline = false;
    dispatchPwaState();
    showNetworkToast(true);
  });

  window.addEventListener('offline', () => {
    window.CodeRulitPWA.isOffline = true;
    dispatchPwaState();
    showNetworkToast(false);
  });

  function showNetworkToast(isOnline) {
    let toast = document.getElementById('pwa-network-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pwa-network-toast';
      toast.className = 'fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 max-w-xs w-full px-4 pointer-events-none';
      document.body.appendChild(toast);
    }

    if (isOnline) {
      toast.innerHTML = `
        <div class="alert alert-success shadow-lg py-2 px-3 text-xs font-bold rounded-2xl flex items-center gap-2">
          <span class="material-symbols-rounded text-base filled">wifi</span>
          <span>Подключение к сети восстановлено</span>
        </div>
      `;
      setTimeout(() => {
        if (toast && toast.parentNode) toast.innerHTML = '';
      }, 3000);
    } else {
      toast.innerHTML = `
        <div class="alert alert-warning shadow-lg py-2 px-3 text-xs font-bold rounded-2xl flex items-center gap-2">
          <span class="material-symbols-rounded text-base filled">wifi_off</span>
          <span>Офлайн-режим: все уроки доступны без интернета</span>
        </div>
      `;
    }
  }

  // 3. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Relative path resolution based on current document location
      const isTemplateSubdir = window.location.pathname.includes('/templates/');
      const swUrl = isTemplateSubdir ? '../../sw.js' : './sw.js';
      const swScope = isTemplateSubdir ? '../../' : './';

      navigator.serviceWorker.register(swUrl, { scope: swScope })
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);

          // Check for SW updates
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version available! Prompting update.');
                  showUpdateToast(reg);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  function showUpdateToast(registration) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4 pointer-events-auto';
    toast.innerHTML = `
      <div class="alert alert-info shadow-xl py-2.5 px-3.5 text-xs font-bold rounded-2xl flex items-center justify-between gap-2 border border-info/30 bg-base-100">
        <div class="flex items-center gap-2">
          <span class="material-symbols-rounded text-base text-info filled">system_update</span>
          <span>Доступно обновление</span>
        </div>
        <button id="pwa-update-btn" class="btn btn-xs btn-primary rounded-xl font-bold">
          Обновить
        </button>
      </div>
    `;
    document.body.appendChild(toast);
    document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      toast.remove();
    });
  }

})();
