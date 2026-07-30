/* ===========================================================
   Universo Promos — Gerador de links de afiliado
   ===========================================================
   Observação sobre segurança:
   Este é um site estático, então este arquivo (e a URL do
   webhook do n8n dentro dele) é sempre visível a quem inspecionar
   o código-fonte — isso é inerente a qualquer chamada feita
   diretamente do navegador, não uma falha de organização do
   código. As proteções REAIS contra abuso (spam, uso do webhook
   por terceiros, DDoS) precisam ficar do lado do servidor:
     1. Restrinja o CORS do webhook no n8n para aceitar
        apenas requisições vindas de https://universopromos.com.br
     2. Configure rate limiting por IP na frente do n8n
        (ex: regra de rate limiting no Cloudflare, já que o
        subdomínio n8n.universopromos.com.br parece estar atrás
        dele).
     3. Se possível, exija um cabeçalho/segredo simples validado
        no fluxo do n8n — não impede um atacante dedicado, mas
        barra bots genéricos.
   As validações abaixo (formato de URL, domínios aceitos, timeout,
   limite de tentativas) protegem a experiência do usuário e
   reduzem ruído no seu webhook, mas não substituem os pontos acima.
   =========================================================== */

(function () {
  'use strict';

  const WEBHOOK_URL = 'https://n8n.universopromos.com.br/webhook/5706369e-9f76-40c5-a7ea-4182967a5676';
  const REQUEST_TIMEOUT_MS = 15000;
  const MIN_INTERVAL_MS = 4000; // evita cliques repetidos disparando várias requisições

  // Domínios aceitos pela ferramenta. Ajuste aqui se adicionar novas lojas.
  const ALLOWED_HOST_FRAGMENTS = [
    'mercadolivre.com',
    'mercadolibre.com',
    'amazon.com',
    'amzn.to',
    'amzn.com',
    'shopee.com',
    's.shopee.com',
    'aliexpress.com',
    's.click.aliexpress.com',
    'instant-gaming.com'
  ];

  let lastSubmitAt = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function isAllowedUrl(rawUrl) {
    let url;
    try {
      url = new URL(rawUrl);
    } catch (e) {
      return false;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_HOST_FRAGMENTS.some((fragment) => host.includes(fragment));
  }

  // Só aceitamos usar um link retornado pela API se for http(s) —
  // evita que uma resposta inesperada vire um "javascript:" ou "data:"
  // URI clicável na página.
  function isSafeHttpUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function showError(message) {
    const errorState = $('error-state');
    errorState.querySelector('p').textContent = message;
    errorState.classList.remove('hidden');
  }

  function hideError() {
    $('error-state').classList.add('hidden');
  }

  function setLoading(isLoading) {
    const generateBtn = $('generate-btn');
    const loadingState = $('loading-state');
    generateBtn.disabled = isLoading;
    generateBtn.style.opacity = isLoading ? '0.5' : '1';
    loadingState.classList.toggle('hidden', !isLoading);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    hideError();

    const now = Date.now();
    if (now - lastSubmitAt < MIN_INTERVAL_MS) {
      showError('Aguarde alguns segundos antes de tentar novamente.');
      return;
    }

    const originalLinkInput = $('original-link');
    const originalLink = originalLinkInput.value.trim();
    const resultContainer = $('result-container');

    resultContainer.classList.add('hidden');

    if (!isAllowedUrl(originalLink)) {
      showError('Cole um link válido do Mercado Livre, Amazon, Shopee, Aliexpress ou Instant Gaming.');
      return;
    }

    lastSubmitAt = now;
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_usuario: originalLink }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error('Falha ao comunicar com o servidor.');

      const data = await response.json();
      const finalLink = data && data.link_final;

      if (!finalLink || !isSafeHttpUrl(finalLink)) {
        throw new Error('Link não retornado pela API.');
      }

      renderResult(finalLink);
      resultContainer.classList.remove('hidden');
    } catch (error) {
      const message = error.name === 'AbortError'
        ? 'A requisição demorou demais para responder. Tente novamente.'
        : 'Houve um erro de comunicação. Tente novamente em alguns segundos.';
      showError(message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  function renderResult(finalLink) {
    const generatedLink = $('generated-link');
    const openBtn = $('open-btn');

    generatedLink.href = finalLink;
    generatedLink.textContent = finalLink;
    openBtn.href = finalLink;
  }

  async function handleCopyClick() {
    const generatedLink = $('generated-link');
    const linkText = generatedLink.textContent.trim();
    if (!linkText || linkText === '—') return;

    const copyBtn = $('copy-btn');
    try {
      await navigator.clipboard.writeText(linkText);
    } catch (e) {
      // Fallback para navegadores sem suporte à Clipboard API
      const tempInput = document.createElement('textarea');
      tempInput.value = linkText;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }

    const originalLabel = copyBtn.textContent;
    copyBtn.textContent = '✓';
    copyBtn.disabled = true;
    setTimeout(() => {
      copyBtn.textContent = originalLabel;
      copyBtn.disabled = false;
    }, 1800);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = $('link-form');
    if (form) form.addEventListener('submit', handleSubmit);

    const copyBtn = $('copy-btn');
    if (copyBtn) copyBtn.addEventListener('click', handleCopyClick);
  });
})();
