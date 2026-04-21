type BuildNativeBookReaderHtmlParams = {
  pdfUrl: string;
  title: string;
};

const sanitizeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const buildNativeBookReaderHtml = ({
  pdfUrl,
  title,
}: BuildNativeBookReaderHtmlParams) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <title>${sanitizeHtml(title)}</title>
    <style>
      :root {
        --bg: #f4efe7;
        --shell: #eadbc8;
        --page: #fffdf9;
        --border: #e0d3c2;
        --text: #1a1a1a;
        --muted: #6b6258;
        --button: #ffffff;
        --error: #e53935;
      }

      * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }

      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: var(--bg);
        color: var(--text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        display: flex;
        align-items: stretch;
        justify-content: center;
      }

      .reader {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 10px 0 14px;
        gap: 10px;
        background:
          radial-gradient(circle at top, rgba(255,255,255,0.65), rgba(255,255,255,0) 36%),
          var(--bg);
      }

      .meta {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
        padding: 0 12px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .stage {
        position: relative;
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 0 10px;
      }

      .spread-shell {
        position: relative;
        flex: 1;
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        align-items: stretch;
        justify-content: center;
        border-radius: 24px;
        background: var(--shell);
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
        padding: 12px;
        overflow: hidden;
      }

      .spread-pages {
        flex: 1;
        display: flex;
        gap: 10px;
        min-height: 0;
        width: 100%;
      }

      .page-card {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        min-width: 0;
        background: var(--page);
        border: 1px solid var(--border);
        border-radius: 16px;
      }

      .page-card.left {
        box-shadow: 6px 8px 14px rgba(0, 0, 0, 0.08);
      }

      .page-card.right {
        box-shadow: -6px 8px 14px rgba(0, 0, 0, 0.08);
      }

      canvas {
        display: block;
        max-width: 100%;
        max-height: 100%;
        margin: auto;
      }

      .page-number {
        position: absolute;
        right: 12px;
        bottom: 10px;
        padding: 4px 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        color: #8a7257;
        font-size: 11px;
        font-weight: 700;
      }

      .nav-button {
        width: 74px;
        height: 74px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--button);
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
        padding: 8px;
        user-select: none;
        z-index: 5;
      }

      .nav-button.disabled {
        opacity: 0.35;
      }

      .nav-button span {
        display: block;
      }

      .loading,
      .error {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 24px;
        z-index: 4;
      }

      .loading {
        background: rgba(255, 248, 240, 0.72);
        color: var(--muted);
        font-size: 15px;
        font-weight: 600;
      }

      .error {
        display: none;
        background: rgba(255, 247, 247, 0.94);
        color: var(--error);
        font-size: 15px;
        font-weight: 600;
        line-height: 1.5;
      }

      .hint {
        text-align: center;
        color: var(--muted);
        font-size: 12px;
        font-weight: 600;
        padding: 0 12px;
      }

      @media (max-width: 900px) {
        .reader {
          padding-top: 6px;
        }

        .stage {
          padding: 0;
        }

        .spread-shell {
          border-radius: 0;
          box-shadow: none;
          padding: 10px 8px;
        }

        .nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          font-size: 10px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(6px);
        }

        .nav-button.prev {
          left: 6px;
        }

        .nav-button.next {
          right: 6px;
        }
      }
    </style>
  </head>
  <body>
    <div class="reader">
      <div class="meta">
        <span id="doc-name">${sanitizeHtml(title)}</span>
        <span id="spread-label">Spread 1 - 2</span>
        <span id="page-count">Loading pages</span>
      </div>

      <div class="stage" id="stage">
        <div class="nav-button prev" id="prev-button"><span>Previous</span></div>
        <div class="spread-shell" id="spread-shell">
          <div class="loading" id="loading">Loading book layout…</div>
          <div class="error" id="error"></div>
          <div class="spread-pages" id="spread-pages">
            <div class="page-card left">
              <canvas id="left-canvas"></canvas>
              <div class="page-number" id="left-number">1</div>
            </div>
            <div class="page-card right">
              <canvas id="right-canvas"></canvas>
              <div class="page-number" id="right-number">2</div>
            </div>
          </div>
        </div>
        <div class="nav-button next" id="next-button"><span>Next</span></div>
      </div>

      <div class="hint">Swipe right for the next spread and swipe left for the previous spread.</div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
      (function () {
        const pdfUrl = ${JSON.stringify(pdfUrl)};
        const title = ${JSON.stringify(title)};
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        const INITIAL_PREFETCH_PAGES = 8;
        const NEXT_PREFETCH_BATCH = 8;
        const SWIPE_THRESHOLD = 48;

        const leftCanvas = document.getElementById('left-canvas');
        const rightCanvas = document.getElementById('right-canvas');
        const leftNumber = document.getElementById('left-number');
        const rightNumber = document.getElementById('right-number');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');
        const stage = document.getElementById('stage');
        const spreadPages = document.getElementById('spread-pages');
        const docName = document.getElementById('doc-name');
        const spreadLabel = document.getElementById('spread-label');
        const pageCount = document.getElementById('page-count');

        let pdfDocument = null;
        let spreadStartPage = 1;
        let renderToken = 0;
        let touchStartX = null;
        let prefetchedUntil = 0;
        const pageCache = new Map();
        const pagePromiseCache = new Map();

        const postMessage = (payload) => {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }

          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              source: 'brahmand-book-reader',
              payload,
            }, '*');
          }
        };

        const setLoading = (visible) => {
          loading.style.display = visible ? 'flex' : 'none';
        };

        const setError = (message) => {
          error.style.display = message ? 'flex' : 'none';
          error.textContent = message || '';
        };

        const getMaxSpreadStart = () => {
          if (!pdfDocument || pdfDocument.numPages <= 1) {
            return 1;
          }

          return pdfDocument.numPages % 2 === 0 ? pdfDocument.numPages - 1 : pdfDocument.numPages;
        };

        const getRightPage = () => {
          if (!pdfDocument || spreadStartPage + 1 > pdfDocument.numPages) {
            return null;
          }

          return spreadStartPage + 1;
        };

        const updateMeta = () => {
          const rightPage = getRightPage();

          docName.textContent = title;
          spreadLabel.textContent = 'Spread ' + spreadStartPage + (rightPage ? ' - ' + rightPage : '');
          pageCount.textContent = pdfDocument ? pdfDocument.numPages + ' pages' : 'Loading pages';
          leftNumber.textContent = String(spreadStartPage);
          rightNumber.textContent = rightPage ? String(rightPage) : '--';

          prevButton.classList.toggle('disabled', spreadStartPage <= 1);
          nextButton.classList.toggle('disabled', !pdfDocument || spreadStartPage >= getMaxSpreadStart());
        };

        const renderBlank = (canvas) => {
          const context = canvas.getContext('2d');
          canvas.width = 12;
          canvas.height = 12;
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          context.fillStyle = '#F3ECE3';
          context.fillRect(0, 0, canvas.width, canvas.height);
        };

        const ensurePage = async (pageNumber) => {
          if (!pdfDocument) {
            return null;
          }

          if (pageCache.has(pageNumber)) {
            return pageCache.get(pageNumber);
          }

          if (pagePromiseCache.has(pageNumber)) {
            return pagePromiseCache.get(pageNumber);
          }

          const pagePromise = pdfDocument.getPage(pageNumber).then((page) => {
            pageCache.set(pageNumber, page);
            pagePromiseCache.delete(pageNumber);
            return page;
          });

          pagePromiseCache.set(pageNumber, pagePromise);
          return pagePromise;
        };

        const prefetchRange = async (startPage, endPage) => {
          if (!pdfDocument) {
            return;
          }

          const safeStart = Math.max(1, startPage);
          const safeEnd = Math.min(endPage, pdfDocument.numPages);

          if (safeStart > safeEnd) {
            return;
          }

          const tasks = [];
          for (let pageNumber = safeStart; pageNumber <= safeEnd; pageNumber += 1) {
            tasks.push(ensurePage(pageNumber));
          }

          await Promise.allSettled(tasks);
          prefetchedUntil = Math.max(prefetchedUntil, safeEnd);
        };

        const maybePrefetchUpcoming = () => {
          if (!pdfDocument) {
            return;
          }

          if (!prefetchedUntil) {
            prefetchRange(1, INITIAL_PREFETCH_PAGES);
            return;
          }

          if (spreadStartPage >= Math.max(1, prefetchedUntil - 1)) {
            prefetchRange(prefetchedUntil + 1, prefetchedUntil + NEXT_PREFETCH_BATCH);
          }
        };

        const renderPage = async (pageNumber, canvas) => {
          if (!pageNumber || !pdfDocument) {
            renderBlank(canvas);
            return;
          }

          const page = await ensurePage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max((spreadPages.clientWidth - 10) / 2, 150);
          const availableHeight = Math.max(spreadPages.clientHeight, 260);
          const scale = Math.min(availableWidth / baseViewport.width, availableHeight / baseViewport.height);
          const viewport = page.getViewport({ scale });
          const pixelRatio = window.devicePixelRatio || 1;
          const context = canvas.getContext('2d');

          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);
          canvas.style.width = viewport.width + 'px';
          canvas.style.height = viewport.height + 'px';
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, viewport.width, viewport.height);

          const renderTask = page.render({
            canvasContext: context,
            viewport,
          });

          await renderTask.promise;
        };

        const renderSpread = async () => {
          if (!pdfDocument) {
            return;
          }

          const token = ++renderToken;
          setLoading(true);
          setError('');

          try {
            maybePrefetchUpcoming();
            const rightPage = getRightPage();

            await Promise.all([
              renderPage(spreadStartPage, leftCanvas),
              renderPage(rightPage, rightCanvas),
            ]);

            if (token !== renderToken) {
              return;
            }

            updateMeta();
            setLoading(false);
            postMessage({
              type: 'spread',
              spreadStartPage,
              rightPage,
              numPages: pdfDocument.numPages,
            });
          } catch (renderError) {
            console.error(renderError);
            setLoading(false);
            setError('Unable to render this PDF spread.');
            postMessage({ type: 'error', message: 'Unable to render this PDF spread.' });
          }
        };

        const goNext = () => {
          if (!pdfDocument) {
            return;
          }

          const nextStart = Math.min(spreadStartPage + 2, getMaxSpreadStart());
          if (nextStart === spreadStartPage) {
            return;
          }

          spreadStartPage = nextStart;
          renderSpread();
        };

        const goPrevious = () => {
          const nextStart = Math.max(spreadStartPage - 2, 1);
          if (nextStart === spreadStartPage) {
            return;
          }

          spreadStartPage = nextStart;
          renderSpread();
        };

        prevButton.addEventListener('click', goPrevious);
        nextButton.addEventListener('click', goNext);

        stage.addEventListener('touchstart', function (event) {
          touchStartX = event.changedTouches[0] ? event.changedTouches[0].screenX : null;
        }, { passive: true });

        stage.addEventListener('touchend', function (event) {
          if (touchStartX == null) {
            return;
          }

          const endX = event.changedTouches[0] ? event.changedTouches[0].screenX : null;
          if (endX == null) {
            touchStartX = null;
            return;
          }

          const deltaX = endX - touchStartX;

          if (deltaX > SWIPE_THRESHOLD) {
            goNext();
          } else if (deltaX < -SWIPE_THRESHOLD) {
            goPrevious();
          }

          touchStartX = null;
        }, { passive: true });

        window.addEventListener('resize', function () {
          if (pdfDocument) {
            renderSpread();
          }
        });

        const load = async () => {
          if (!pdfjsLib) {
            setLoading(false);
            setError('PDF.js did not load inside the app.');
            postMessage({ type: 'error', message: 'PDF.js did not load inside the app.' });
            return;
          }

          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

          try {
            const loadingTask = pdfjsLib.getDocument({
              url: pdfUrl,
              disableAutoFetch: true,
              disableStream: true,
              rangeChunkSize: 65536,
            });

            pdfDocument = await loadingTask.promise;
            spreadStartPage = 1;
            updateMeta();
            await prefetchRange(1, INITIAL_PREFETCH_PAGES);
            await renderSpread();
            postMessage({ type: 'loaded', numPages: pdfDocument.numPages, title: title });
          } catch (loadError) {
            console.error(loadError);
            setLoading(false);
            setError('This PDF could not be opened.');
            postMessage({ type: 'error', message: 'This PDF could not be opened.' });
          }
        };

        updateMeta();
        load();
      })();
    </script>
  </body>
</html>`;
