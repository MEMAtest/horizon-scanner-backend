function getHandbookScripts() {
  return `
    <script>
      (function() {
        const state = {
          sourcebooks: [],
          outline: null,
          outlineByCode: {},
          latestIngest: null,
          currentCode: null,
          activeSectionId: null,
          searchResults: [],
          sectionCache: {},
          referenceCache: {}
        };

        const ui = {};

        function escapeHtml(value) {
          if (!value) return '';
          return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function escapeAttr(value) {
          return escapeHtml(value).replace(/\\s+/g, ' ');
        }

        function formatDate(value) {
          if (!value) return 'No ingest data';
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return value;
          return date.toLocaleString();
        }

        async function fetchJson(url) {
          const response = await fetch(url);
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Request failed');
          }
          return data;
        }

        function setStatus(message, ok) {
          ui.ingestStatus.innerHTML = '<span class="status-pill ' + (ok ? 'ok' : '') + '">' +
            (ok ? 'Ready' : 'Status') +
          '</span>' + '<span>' + escapeHtml(message) + '</span>';
        }

        function setContentLoading(message) {
          ui.contentBody.innerHTML = '<div class="loading-state">' + escapeHtml(message) + '</div>';
        }

        function setOutlineLoading(message) {
          ui.outline.innerHTML = '<div class="loading-state">' + escapeHtml(message) + '</div>';
        }

        function setSearchResultsVisible(visible) {
          if (visible) {
            ui.searchResults.classList.add('active');
          } else {
            ui.searchResults.classList.remove('active');
          }
        }

        function clearSearchResults() {
          state.searchResults = [];
          ui.searchResultsBody.innerHTML = '';
          setSearchResultsVisible(false);
        }

        function renderSourcebooks() {
          if (!state.sourcebooks.length) {
            ui.sourcebookSelect.innerHTML = '<option value="">No sourcebooks</option>';
            return;
          }
          ui.sourcebookSelect.innerHTML = state.sourcebooks.map(book => (
            '<option value="' + escapeAttr(book.code) + '">' +
            escapeHtml(book.code + ' - ' + (book.title || '')) +
            '</option>'
          )).join('');

          if (!state.currentCode) {
            state.currentCode = state.sourcebooks[0].code;
          }
          ui.sourcebookSelect.value = state.currentCode;
        }

        function renderOutline() {
          if (!state.outline || !state.outline.chapters || !state.outline.chapters.length) {
            ui.outline.innerHTML = '<div class="content-placeholder">No outline available.</div>';
            return;
          }

          const html = state.outline.chapters.map(chapter => {
            const chapterTitle = chapter.title || '';
            const sections = (chapter.sections || []).map(section => (
              '<button class="section-item" data-section-id="' + section.id + '">' +
                '<span>' + escapeHtml(section.ref || section.sectionNumber || '') + '</span>' +
                (section.title ? '<span class="section-title">' + escapeHtml(section.title) + '</span>' : '') +
              '</button>'
            )).join('');

            return (
              '<div class="outline-chapter">' +
                '<button class="chapter-toggle" data-chapter-toggle="' + chapter.id + '">' +
                  '<span>' + escapeHtml(chapter.ref || chapter.sectionNumber || '') + '</span>' +
                  (chapterTitle ? '<span class="chapter-title">' + escapeHtml(chapterTitle) + '</span>' : '') +
                  '<span>▾</span>' +
                '</button>' +
                '<div class="section-list" data-chapter-sections="' + chapter.id + '">' +
                  (sections || '<div class="content-placeholder">No sections</div>') +
                '</div>' +
              '</div>'
            );
          }).join('');

          ui.outline.innerHTML = html;
        }

        function renderSearchResults() {
          if (!state.searchResults.length) {
            ui.searchResultsBody.innerHTML = '<div class="content-placeholder">No results found.</div>';
            return;
          }

          ui.searchResultsBody.innerHTML = state.searchResults.map(result => (
            '<button class="search-result" data-ref="' + escapeAttr(result.canonical_ref) + '">' +
              '<div class="search-result-title">' + escapeHtml(result.canonical_ref) + '</div>' +
              '<div class="search-result-meta">' +
                escapeHtml([result.sourcebook_code, result.section_title].filter(Boolean).join(' · ')) +
              '</div>' +
            '</button>'
          )).join('');
        }

        function setActiveSection(sectionId) {
          state.activeSectionId = sectionId;
          ui.outline.querySelectorAll('.section-item').forEach(item => {
            item.classList.toggle('active', item.dataset.sectionId === String(sectionId));
          });
        }

        function renderParagraphs(paragraphs) {
          return paragraphs.map(paragraph => {
            const ref = paragraph.paragraph_number || paragraph.canonical_ref || '';
            const bodyHtml = paragraph.html
              ? paragraph.html
              : '<p>' + escapeHtml(paragraph.text || '') + '</p>';

            return (
              '<article class="provision">' +
                '<div class="provision-header">' +
                  '<span class="provision-ref">' + escapeHtml(ref) + '</span>' +
                '</div>' +
                '<div class="provision-body">' + bodyHtml + '</div>' +
              '</article>'
            );
          }).join('');
        }

        function renderContentHeader(title, subtitle) {
          ui.contentTitle.textContent = title || 'Handbook Content';
          ui.contentMeta.textContent = subtitle || '';
        }

        function renderSectionContent(section, paragraphs) {
          renderContentHeader(section.canonical_ref || section.section_number || 'Section', section.section_title || '');
          ui.contentBody.innerHTML = paragraphs.length
            ? renderParagraphs(paragraphs)
            : '<div class="content-placeholder">No provisions available for this section.</div>';
        }

        function renderReferenceContent(item, paragraphs, ref) {
          renderContentHeader(item.canonical_ref || ref, item.section_title || item.sourcebook_title || '');
          if (paragraphs.length) {
            ui.contentBody.innerHTML = renderParagraphs(paragraphs);
          } else if (item.html) {
            ui.contentBody.innerHTML = '<div class="provision-body">' + item.html + '</div>';
          } else if (item.text) {
            ui.contentBody.innerHTML = '<div class="provision-body"><p>' + escapeHtml(item.text) + '</p></div>';
          } else {
            ui.contentBody.innerHTML = '<div class="content-placeholder">No content available.</div>';
          }
        }

        async function loadSourcebooks() {
          setStatus('Loading sourcebooks...', false);
          try {
            const response = await fetchJson('/api/handbook/sourcebooks');
            state.sourcebooks = response.data || [];
            state.latestIngest = response.latestIngest || null;
            const statusLabel = state.latestIngest?.status ? state.latestIngest.status.toUpperCase() : 'UNKNOWN';
            const timestamp = formatDate(state.latestIngest?.ended_at || state.latestIngest?.started_at);
            setStatus('Last ingest: ' + timestamp + ' · ' + statusLabel, true);

            renderSourcebooks();
            await loadOutline();
          } catch (error) {
            console.error('[Handbook] Sourcebook load failed:', error);
            setStatus('Unable to load sourcebooks', false);
            setOutlineLoading('Failed to load handbook outline.');
          }
        }

        async function loadOutline() {
          if (!state.currentCode) return;
          if (state.outlineByCode[state.currentCode]) {
            state.outline = state.outlineByCode[state.currentCode];
            renderOutline();
            return;
          }
          setOutlineLoading('Loading outline...');
          try {
            const response = await fetchJson('/api/handbook/sourcebooks/' + encodeURIComponent(state.currentCode) + '/outline');
            state.outline = response.data;
            state.outlineByCode[state.currentCode] = response.data;
            renderOutline();
          } catch (error) {
            console.error('[Handbook] Outline load failed:', error);
            setOutlineLoading('Failed to load outline.');
          }
        }

        async function loadSection(sectionId) {
          if (!sectionId) return;
          setActiveSection(sectionId);
          const cached = state.sectionCache[sectionId];
          if (cached) {
            renderSectionContent(cached.section, cached.paragraphs);
            return;
          }
          setContentLoading('Loading section content...');
          try {
            const response = await fetchJson('/api/handbook/sections/' + sectionId + '?includeParagraphs=true');
            const section = response.data || {};
            const paragraphs = response.paragraphs || [];
            state.sectionCache[sectionId] = { section, paragraphs };
            renderSectionContent(section, paragraphs);
          } catch (error) {
            console.error('[Handbook] Section load failed:', error);
            setContentLoading('Failed to load section.');
          }
        }

        async function loadReference(ref) {
          if (!ref) return;
          const cached = state.referenceCache[ref];
          if (cached) {
            renderReferenceContent(cached.item, cached.paragraphs, ref);
            return;
          }
          setContentLoading('Loading reference...');
          try {
            const response = await fetchJson('/api/handbook/reference/' + encodeURIComponent(ref) + '?includeParagraphs=true');
            const item = response.data || {};
            const paragraphs = response.paragraphs || [];
            state.referenceCache[ref] = { item, paragraphs };
            renderReferenceContent(item, paragraphs, ref);
          } catch (error) {
            console.error('[Handbook] Reference load failed:', error);
            setContentLoading('Failed to load reference.');
          }
        }

        async function runSearch(query) {
          if (!query) return;
          ui.searchResultsBody.innerHTML = '<div class="loading-state">Searching...</div>';
          setSearchResultsVisible(true);
          try {
            const sourcebookParam = state.currentCode
              ? '&sourcebook=' + encodeURIComponent(state.currentCode)
              : '';
            const response = await fetchJson('/api/handbook/search?q=' + encodeURIComponent(query) + sourcebookParam);
            state.searchResults = response.data || [];
            renderSearchResults();
          } catch (error) {
            console.error('[Handbook] Search failed:', error);
            ui.searchResultsBody.innerHTML = '<div class="content-placeholder">Search failed. Try again.</div>';
          }
        }

        function bindEvents() {
          ui.sourcebookSelect.addEventListener('change', async event => {
            state.currentCode = event.target.value;
            clearSearchResults();
            await loadOutline();
          });

          ui.searchForm.addEventListener('submit', async event => {
            event.preventDefault();
            const query = ui.searchInput.value.trim();
            if (!query) return;
            await runSearch(query);
          });

          ui.clearSearch.addEventListener('click', () => {
            ui.searchInput.value = '';
            clearSearchResults();
          });

          ui.outline.addEventListener('click', event => {
            const toggle = event.target.closest('[data-chapter-toggle]');
            if (toggle) {
              const chapterId = toggle.getAttribute('data-chapter-toggle');
              const list = ui.outline.querySelector('[data-chapter-sections="' + chapterId + '"]');
              if (list) {
                list.classList.toggle('is-collapsed');
              }
              return;
            }

            const sectionButton = event.target.closest('[data-section-id]');
            if (sectionButton) {
              const sectionId = sectionButton.getAttribute('data-section-id');
              loadSection(sectionId);
            }
          });

          ui.searchResults.addEventListener('click', event => {
            const resultButton = event.target.closest('[data-ref]');
            if (resultButton) {
              const ref = resultButton.getAttribute('data-ref');
              loadReference(ref);
            }
          });
        }

        function init() {
          ui.sourcebookSelect = document.getElementById('handbookSourcebookSelect');
          ui.searchForm = document.getElementById('handbookSearchForm');
          ui.searchInput = document.getElementById('handbookSearchInput');
          ui.outline = document.getElementById('handbookOutline');
          ui.contentTitle = document.getElementById('handbookContentTitle');
          ui.contentMeta = document.getElementById('handbookContentMeta');
          ui.contentBody = document.getElementById('handbookContentBody');
          ui.ingestStatus = document.getElementById('handbookIngestStatus');
          ui.searchResults = document.getElementById('handbookSearchResults');
          ui.searchResultsBody = document.getElementById('handbookSearchResultsBody');
          ui.clearSearch = document.getElementById('handbookClearSearch');

          bindEvents();
          loadSourcebooks();
        }

        window.HandbookPage = { init: init };
        document.addEventListener('DOMContentLoaded', init);
      })();
    </script>
  `
}

module.exports = { getHandbookScripts }
