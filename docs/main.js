// ==========================================================================
// Local Brain Showcase Interactive Engine
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Preset queries for on-device enterprise intelligence
    const PRESETS = {
        arch: {
            query: 'What are the core guarantees of an offline vector indexing pipeline?',
            response: 'An offline vector indexing pipeline guarantees zero network data egress by generating dense vector embeddings and executing cosine similarity scoring entirely in-process against local persistent storage.',
            tokens: '38 tokens',
        },
        compliance: {
            query: 'How does on-device document intelligence support regulatory compliance?',
            response: 'By confining all document parsing, categorization, and contextual inference to local hardware, organizations strictly adhere to zero-trust mandates (e.g., HIPAA, GDPR, SOC 2) without third-party vendor data transmission.',
            tokens: '42 tokens',
        },
        synthesis: {
            query: 'Explain how the local router resolves cross-document technical citations.',
            response: 'The agentic router queries the local SQLite relational catalog alongside LanceDB embeddings, extracting precise chunk offsets and metadata to synthesize answers with immutable local file path citations.',
            tokens: '39 tokens',
        },
    };

    const queryTextEl = document.getElementById('terminal-query-text');
    const responseTextEl = document.getElementById('terminal-response-text');
    const tokensEl = document.getElementById('stat-tokens');
    const presetBtns = document.querySelectorAll('.preset-btn');

    presetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            presetBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            const key = btn.dataset.query;
            const data = PRESETS[key];
            if (!data) return;

            queryTextEl.textContent = data.query;
            tokensEl.textContent = data.tokens;

            // Stream simulation effect
            responseTextEl.textContent = '';
            let i = 0;
            const fullText = data.response;
            const interval = setInterval(() => {
                if (i < fullText.length) {
                    responseTextEl.textContent += fullText.charAt(i);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 8);
        });
    });

    // Copy commands to clipboard
    const copyBtns = document.querySelectorAll('.copy-btn');
    copyBtns.forEach((btn) => {
        btn.addEventListener('click', async () => {
            const textToCopy = btn.dataset.copy;
            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i data-lucide="check" style="color: #10b981; width: 14px; height: 14px;"></i>';
                if (window.lucide) window.lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    if (window.lucide) window.lucide.createIcons();
                }, 1500);
            } catch (err) {
                console.error('Clipboard copy failed:', err);
            }
        });
    });
});
