// ==========================================================================
// Local Brain Showcase Interactive Engine
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // 1. Interactive Terminal Simulator
    // --------------------------------------------------------------------------
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
        audit: {
            query: 'Verify audit trail immutability across document updates.',
            response: 'Every modification writes a new snapshot row into SQLite with write-ahead logging (WAL) enabled, generating an append-only revision DAG that preserves byte-level diffs and historical vector checkpoints.',
            tokens: '36 tokens',
        }
    };

    const queryTextEl = document.getElementById('terminal-query-text');
    const responseTextEl = document.getElementById('terminal-response-text');
    const tokensEl = document.getElementById('stat-tokens');
    const presetBtns = document.querySelectorAll('.preset-btn');
    let streamInterval = null;

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
            if (streamInterval) clearInterval(streamInterval);
            responseTextEl.textContent = '';
            let i = 0;
            const fullText = data.response;
            streamInterval = setInterval(() => {
                if (i < fullText.length) {
                    responseTextEl.textContent += fullText.charAt(i);
                    i++;
                } else {
                    clearInterval(streamInterval);
                }
            }, 10);
        });
    });

    // --------------------------------------------------------------------------
    // 2. Hybrid CPU + GPU Offload Slider
    // --------------------------------------------------------------------------
    const slider = document.getElementById('gpu-layer-slider');
    const badge = document.getElementById('offload-val-badge');
    const barGpu = document.getElementById('bar-gpu');
    const barCpu = document.getElementById('bar-cpu');
    const statMode = document.getElementById('stat-offload-mode');
    const statVram = document.getElementById('stat-vram-alloc');
    const statRam = document.getElementById('stat-ram-alloc');
    const statSpeed = document.getElementById('stat-speed-alloc');

    if (slider && badge && barGpu && barCpu) {
        const TOTAL_LAYERS = 26;

        function updateOffloadVisuals(gpuLayers) {
            gpuLayers = parseInt(gpuLayers, 10);
            const cpuLayers = TOTAL_LAYERS - gpuLayers;
            const gpuPercent = Math.round((gpuLayers / TOTAL_LAYERS) * 100);
            const cpuPercent = 100 - gpuPercent;

            badge.textContent = `${gpuLayers} GPU Layers / ${cpuLayers} CPU Layers`;

            barGpu.style.width = `${gpuPercent}%`;
            barGpu.textContent = gpuLayers > 2 ? `GPU: ${gpuLayers} Layers (${gpuPercent}%)` : (gpuLayers > 0 ? `${gpuLayers}L` : '');
            
            barCpu.style.width = `${cpuPercent}%`;
            barCpu.textContent = cpuLayers > 2 ? `CPU: ${cpuLayers} Layers (${cpuPercent}%)` : (cpuLayers > 0 ? `${cpuLayers}L` : '');

            // Calculate simulated telemetry
            if (gpuLayers === 0) {
                statMode.textContent = 'CPU Only (AVX2)';
                statMode.style.color = 'var(--accent-emerald)';
                statVram.textContent = '0.00 GB';
                statRam.textContent = '3.82 GB';
                statSpeed.textContent = '~6.2 tok/s';
                statSpeed.style.color = 'var(--text-secondary)';
            } else if (gpuLayers === TOTAL_LAYERS) {
                statMode.textContent = 'Full GPU VRAM';
                statMode.style.color = 'var(--accent-cyan)';
                statVram.textContent = '3.42 GB';
                statRam.textContent = '0.78 GB';
                statSpeed.textContent = '~28.5 tok/s';
                statSpeed.style.color = 'var(--accent-emerald)';
            } else {
                statMode.textContent = 'Hybrid Vulkan';
                statMode.style.color = 'var(--accent-cyan)';
                const vram = (0.35 + (gpuLayers / TOTAL_LAYERS) * 3.05).toFixed(2);
                const ram = (0.78 + (cpuLayers / TOTAL_LAYERS) * 2.9).toFixed(2);
                const speed = (6.2 + (gpuLayers / TOTAL_LAYERS) * 22.3).toFixed(1);
                statVram.textContent = `${vram} GB`;
                statRam.textContent = `${ram} GB`;
                statSpeed.textContent = `~${speed} tok/s`;
                statSpeed.style.color = 'var(--accent-emerald)';
            }
        }

        slider.addEventListener('input', (e) => {
            updateOffloadVisuals(e.target.value);
        });

        // Initialize at 12 layers
        updateOffloadVisuals(12);
    }

    // --------------------------------------------------------------------------
    // 3. Multi-Level Summary Engine Showcase
    // --------------------------------------------------------------------------
    const SUMMARIES = {
        brief: `<p><strong>Executive Brief:</strong> This specification defines an air-gapped cryptographic partitioning standard utilizing AES-256-GCM sub-key rotations and in-process LanceDB vector embeddings to guarantee deterministic zero-knowledge document isolation across untrusted edge compute nodes without external cloud reliance.</p>`,
        synthesis: `<div style="display: flex; flex-direction: column; gap: 10px;">
            <p><strong>1. Architectural Scope & Encryption:</strong> The protocol enforces strict data-at-rest isolation across multi-tenant distributed environments. Partitions are sealed using authenticated AES-256-GCM with hardware-derived ephemeral keys rotated on an automated 24-hour cycle to mitigate side-channel replay attacks.</p>
            <p><strong>2. In-Process Vector Ingestion:</strong> Semantic embeddings are computed entirely on-device via local embedding pipelines and committed directly to LanceDB write-ahead log (WAL) tables. This eliminates network telemetry while preserving sub-5ms cosine similarity lookups.</p>
            <p><strong>3. Compliance & Fail-Safe Verification:</strong> Revision state is anchored through SQLite WAL append-only journaling. Any failed cryptographic integrity check automatically isolates the affected chunk and alerts the auditing service without exposing raw memory buffers.</p>
        </div>`,
        bullets: `<ul style="display: flex; flex-direction: column; gap: 8px; padding-left: 18px; margin: 0;">
            <li><strong>Zero Data Egress:</strong> 100% of cryptographic verification, chunking, and embedding generation occurs strictly in local host memory.</li>
            <li><strong>Automated Key Rotation:</strong> Sub-keys rotate every 24 hours via hardware-anchored PRNG without requiring node reboots or database locks.</li>
            <li><strong>LanceDB Acceleration:</strong> Cosine vector queries execute in sub-5ms latency directly from memory-mapped disk files.</li>
            <li><strong>Audit Readiness:</strong> Every document mutation generates an immutable revision entry in the SQLite WAL DAG for automated compliance audits.</li>
            <li><strong>Graceful Degradation:</strong> Hardware memory anomalies automatically trigger safe CPU fallback without process interruption or data loss.</li>
        </ul>`
    };

    const summaryContentEl = document.getElementById('summary-content');
    const summaryTabBtns = document.querySelectorAll('.summary-tab-btn');

    if (summaryContentEl && summaryTabBtns.length > 0) {
        summaryTabBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                summaryTabBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');

                const level = btn.dataset.level;
                if (SUMMARIES[level]) {
                    summaryContentEl.innerHTML = SUMMARIES[level];
                }
            });
        });

        // Initialize with Executive Brief
        summaryContentEl.innerHTML = SUMMARIES.brief;
    }

    // --------------------------------------------------------------------------
    // 4. FAQ Accordion
    // --------------------------------------------------------------------------
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                faqItems.forEach((i) => i.classList.remove('open'));
                if (!isOpen) {
                    item.classList.add('open');
                }
            });
        }
    });

    // --------------------------------------------------------------------------
    // 5. Copy Commands to Clipboard
    // --------------------------------------------------------------------------
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
