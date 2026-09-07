/**
 * Reward Cashback Generator — Main Application Engine
 * Parsing, State Management, UI Rendering, LocalStorage Persistence
 */

(function () {
    'use strict';

    // Sample Data Sets for testing
    const SAMPLES = {
        sample1: {
            title: "REWARD CASHBACK USER DAN SALES FORCE MITRA PENJUALAN ICONNET PERIODE TRANSFER 4 SEPTEMBER 2026 (BATCH 1)",
            idLabel: "ID PERMOHONAN",
            raw: `GITA PRABANDARI \t2\tNI MADE ERNA KURNIAWATI\tA15102608170035\tPAHE 1 TAHUN\t087849915681 \t Rp301,200 \t
\t\tKOMANG PRADNYA MAHESWARI\tA15102608040021\t\t\t\t
I MADE BUDIARTA \t1\tKADEK ERIK NURIAWAN SH\tA15102608250026\tPAHE 1 TAHUN\t12401001960534\t Rp102,500 \t
Nabilla Rahmadani Debora \t1\tI NYOMAN BUDI ARTIKA\tA15102608210062\tPAHE 1 TAHUN\t'085718792544\t Rp152,200 \t
TOTAL\t\t\t\t\t\t Rp555,900 \t`
        },
        sample2: {
            title: "REWARD CASHBACK VOUCHER CW ICONNET BIZ PERIODE TRANSFER 4 September 2026",
            idLabel: "ID PLN",
            raw: `Anom Darjito Nurprahtono \t4\tTOKO SERBA 35\tA15112608290033\tBIZ 1\t  0041725430/ BNI  \t402,500\t 
\t\tMILA FHASION\tA15112608280026\t\t\t\t
\t\tTOKO ARINA\tA15112608240062\t\t\t\t
\t\tTOKO PEDELI SEMBAKO BERKAH\tA15112608230016\t\t\t\t
Herlin satriani \t2\tTOKO RISKI\tA15112608270003\tBIZ 1\t BCA 2020170193 \t202,500\t 
\t\tHAJI LALU JALALUDIN\tA15112608260081\t\t\t\t
EGA APRIADI\t1\tPT WAHANA DEWATA ADIDAYA (QJMOTOR BALI)\tA15102608050068\tBIZ 1\t 087849915681 - Gopay \t101,200\t 
kadek oktapiani \t1\tPANDE PUTU NGURAH SAPUTRA WIGUNA\tA15102608270488\tBIZ 6\t Mandiri 1450012330458 \t200,000\t 
I KETUT PARTA\t3\tRICKO HAMZAH\tA15102608270487\tBIZ 1\t 085737340600 ( ovo) \t300,000\t 
\t\tHIMATUL MUIZAH\tA15102608270483\t\t\t\t
\t\tIKLIMAH\tA15102608270480\t\t\t\t
I NYOMAN AGUS WISNAWA\t1\tPLN ULP KUTA\tA15102609030055\tBIZ 1\t BANK BNI 1820076004 \t102,500\t 
Lalu Surya Febriana putra \t4\tM.MUNADI\tA15112608250011\tBIZ 1\t BCA - 2320446671 \t402,500\t 
\t\tUD. ATHA JAYA\tA15112607290012\tBIZ 1\t\t\t
\t\tUD SASTRO KUSUMO\tA15112608200208\tBIZ 1\t\t\t
\t\tCV IKRAM\tA15112608230013\tBIZ 1\t\t\t
Khairil Ansyori , ST\t1\tNASARUDIN\tA15112608310029\tBIZ 1 \t Dana/085339042080 \t101,000\t 
TOTAL\t\t\t\t\t\t Rp1,812,200`
        }
    };

    // State Variables
    let appState = {
        periodTitle: '',
        tanggalProses: '',
        idColumnLabel: 'ID USER',
        promoColumnLabel: 'VOUCHER',
        walletColumnLabel: 'E-WALLET / ID PLN',
        nominalColumnLabel: 'NOMINAL',
        agentsPerPage: 0,
        rawText: '',
        parsedGroups: [],
        warnings: [],
        totalNominal: 0,
        imageBuffer: null,
        imageDimensions: null,
        imageDataUrl: null
    };

    // DOM Elements
    const elements = {
        periodTitle: document.getElementById('periodTitle'),
        tanggalProses: document.getElementById('tanggalProses'),
        idColumnLabel: document.getElementById('idColumnLabel'),
        agentsPerPage: document.getElementById('agentsPerPage'),
        promoColumnLabel: document.getElementById('promoColumnLabel'),
        walletColumnLabel: document.getElementById('walletColumnLabel'),
        nominalColumnLabel: document.getElementById('nominalColumnLabel'),
        rawInput: document.getElementById('rawInput'),
        proofImage: document.getElementById('proofImage'),
        fileUploadContent: document.getElementById('fileUploadContent'),
        fileNameText: document.getElementById('fileNameText'),
        btnRemoveImage: document.getElementById('btnRemoveImage'),

        btnProcess: document.getElementById('btnProcess'),
        btnPreview: document.getElementById('btnPreview'),
        btnDownload: document.getElementById('btnDownload'),
        btnReset: document.getElementById('btnReset'),
        btnSample1: document.getElementById('btnSample1'),
        btnSample2: document.getElementById('btnSample2'),

        alertBox: document.getElementById('alertBox'),
        previewSection: document.getElementById('previewSection'),
        tableContainer: document.getElementById('tableContainer'),
        parseSummaryBadge: document.getElementById('parseSummaryBadge'),

        previewModal: document.getElementById('previewModal'),
        modalTableBody: document.getElementById('modalTableBody'),
        btnCloseModal: document.getElementById('btnCloseModal'),
        btnModalClose: document.getElementById('btnModalClose'),
        btnModalDownload: document.getElementById('btnModalDownload')
    };

    // ==========================================
    // Utility Functions
    // ==========================================

    /**
     * Cleans non-digit characters from string and returns integer
     * @param {string} str 
     * @returns {number}
     */
    function parseNominal(str) {
        if (typeof str === 'number') return str;
        if (!str) return 0;
        const cleaned = String(str).replace(/[^\d]/g, '');
        return cleaned ? parseInt(cleaned, 10) : 0;
    }

    /**
     * Formats number as IDR standard string (Rp X.XXX.XXX)
     * @param {number} num 
     * @returns {string}
     */
    function formatNominal(num) {
        return "Rp " + Number(num || 0).toLocaleString('id-ID');
    }

    /**
     * Converts a string into a URL-friendly filename slug
     * @param {string} str 
     * @returns {string}
     */
    function slugify(str) {
        return str
            .toString()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '_')
            .replace(/^-+|-+$/g, '');
    }

    // ==========================================
    // LocalStorage Operations
    // ==========================================
    function saveToLocalStorage() {
        try {
            if (elements.periodTitle) localStorage.setItem('rcg_periodTitle', elements.periodTitle.value);
            if (elements.tanggalProses) localStorage.setItem('rcg_tanggalProses', elements.tanggalProses.value);
            if (elements.idColumnLabel) localStorage.setItem('rcg_idColumnLabel', elements.idColumnLabel.value);
            if (elements.promoColumnLabel) localStorage.setItem('rcg_promoColumnLabel', elements.promoColumnLabel.value);
            if (elements.walletColumnLabel) localStorage.setItem('rcg_walletColumnLabel', elements.walletColumnLabel.value);
            if (elements.nominalColumnLabel) localStorage.setItem('rcg_nominalColumnLabel', elements.nominalColumnLabel.value);
            if (elements.agentsPerPage) localStorage.setItem('rcg_agentsPerPage', elements.agentsPerPage.value);
            if (elements.rawInput) localStorage.setItem('rcg_rawInput', elements.rawInput.value);
        } catch (e) {
            console.warn("LocalStorage save error:", e);
        }
    }

    function loadFromLocalStorage() {
        try {
            const title = localStorage.getItem('rcg_periodTitle');
            const tgl = localStorage.getItem('rcg_tanggalProses');
            const label = localStorage.getItem('rcg_idColumnLabel');
            const promoLbl = localStorage.getItem('rcg_promoColumnLabel');
            const walletLbl = localStorage.getItem('rcg_walletColumnLabel');
            const nominalLbl = localStorage.getItem('rcg_nominalColumnLabel');
            const perPage = localStorage.getItem('rcg_agentsPerPage');
            const raw = localStorage.getItem('rcg_rawInput');

            if (title !== null && elements.periodTitle) elements.periodTitle.value = title;
            if (tgl !== null && elements.tanggalProses) elements.tanggalProses.value = tgl;
            if (label !== null && elements.idColumnLabel) elements.idColumnLabel.value = label;
            if (promoLbl !== null && elements.promoColumnLabel) elements.promoColumnLabel.value = promoLbl;
            if (walletLbl !== null && elements.walletColumnLabel) elements.walletColumnLabel.value = walletLbl;
            if (nominalLbl !== null && elements.nominalColumnLabel) elements.nominalColumnLabel.value = nominalLbl;
            if (perPage !== null && elements.agentsPerPage) elements.agentsPerPage.value = perPage;
            if (raw !== null && elements.rawInput) elements.rawInput.value = raw;
        } catch (e) {
            console.warn("LocalStorage load error:", e);
        }
    }

    // ==========================================
    // Core Parsing Engine
    // ==========================================

    /**
     * Checks if string contains mostly numeric/money content
     * @param {string} str 
     * @returns {boolean}
     */
    function isNumericString(str) {
        if (!str) return false;
        const cleaned = str.replace(/[^\d]/g, '');
        return cleaned.length > 0 && /^\d+$/.test(cleaned) && !/[a-zA-Z]{3,}/.test(str);
    }

    /**
     * Parses raw tab-separated input text into structured group objects.
     * Supports both Detailed Multi-User Breakdown (Format A) and Summary Agent Tables (Format B).
     * @param {string} rawText 
     * @returns {{ groups: Array, warnings: Array, totalNominal: number, isSummaryFormat: boolean, detectedTitle: string|null }}
     */
    function parseRawInput(rawText) {
        const groups = [];
        const warnings = [];
        let detectedTitle = null;

        if (!rawText || !rawText.trim()) {
            return { groups: [], warnings: ["Teks input mentah kosong."], totalNominal: 0, isSummaryFormat: false, detectedTitle: null };
        }

        const lines = rawText.split(/\r?\n/);

        // Phase 1: Auto-Detect Title & Format Mode (Summary vs Detailed)
        let hasContinuationLines = false;
        let hasSummaryHeader = false;
        let nonNumericCol2Count = 0;
        let numericCol2Count = 0;

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const cols = line.split('\t').map(c => c.trim());
            const firstColUpper = (cols[0] || '').toUpperCase();

            // Detect title header line (e.g. "Intensif Prestasi Mitra Individu...")
            if (cols.length === 1 || (cols.length > 1 && !cols[1] && !cols[2])) {
                if (!detectedTitle && (firstColUpper.includes('INTENSIF') || firstColUpper.includes('REWARD') || firstColUpper.includes('CASHBACK') || firstColUpper.includes('PERIODE') || firstColUpper.includes('MITRA'))) {
                    detectedTitle = trimmed;
                }
            }

            // Header indicators for Summary format
            if (firstColUpper.includes('HC') || firstColUpper.includes('INSENTIF') || firstColUpper.includes('TAMBAHAN') || firstColUpper.includes('TOTAL TF') || firstColUpper.includes('NOMINAL FEE')) {
                hasSummaryHeader = true;
            }

            // Detect continuation lines (empty col[0])
            if (cols[0] === '' && cols.length > 2 && cols[2] !== '') {
                hasContinuationLines = true;
            }

            // Check if col[2] is numeric vs person name
            if (cols[0] !== '' && !firstColUpper.includes('REWARD') && !firstColUpper.includes('NAMA') && !firstColUpper.includes('INTENSIF') && firstColUpper !== 'TOTAL') {
                if (cols.length > 2 && cols[2] !== '') {
                    if (isNumericString(cols[2])) {
                        numericCol2Count++;
                    } else {
                        nonNumericCol2Count++;
                    }
                }
            }
        });

        const isSummaryFormat = hasSummaryHeader || (!hasContinuationLines && numericCol2Count > nonNumericCol2Count);
        let currentGroup = null;

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const cols = line.split('\t').map(c => c.trim());
            const firstColUpper = (cols[0] || '').toUpperCase();

            // Skip Title & Header lines
            if (firstColUpper.includes('REWARD CASHBACK') || firstColUpper.includes('NAMA AGEN') || firstColUpper.includes('INTENSIF PRESTASI')) {
                return;
            }
            if (cols.length > 1 && (cols[0].toUpperCase() === 'NAMA' || cols[1].toUpperCase() === 'HC' || cols[2].toUpperCase().includes('NAMA USER') || cols[2].toUpperCase().includes('NOMINAL FEE'))) {
                return;
            }
            if (firstColUpper === 'TOTAL' || (cols.length === 1 && firstColUpper.startsWith('TOTAL'))) {
                return;
            }

            const namaAgen = cols[0] || '';
            const jumlahUserStr = cols[1] || '';

            if (isSummaryFormat) {
                // Format B: Summary Agent Table (1 row per agent, numeric fee/incentive columns)
                if (namaAgen !== '') {
                    const jumlahUser = parseInt(jumlahUserStr, 10) || 1;

                    // Extract total nominal transfer from rightmost valid number (e.g. TOTAL TF / TOTAL)
                    let nominalVal = 0;
                    for (let i = cols.length - 1; i >= 2; i--) {
                        const parsed = parseNominal(cols[i]);
                        if (parsed > 0 && cols[i].toUpperCase() !== 'IDR') {
                            nominalVal = parsed;
                            break;
                        }
                    }

                    // Optional details for promo/wallet columns
                    const promoStr = cols[4] ? `Tambahan: ${cols[4]}` : (cols[3] ? `Insentif: ${cols[3]}` : '-');

                    groups.push({
                        namaAgen: namaAgen,
                        jumlahUser: jumlahUser,
                        promo: promoStr,
                        noEwallet: '-',
                        nominalVal: nominalVal,
                        nominalFormatted: formatNominal(nominalVal),
                        users: [{ namaUser: '-', idPermohonan: '-' }],
                        isSummary: true
                    });
                }
            } else {
                // Format A: Detailed Multi-User Breakdown Table
                if (namaAgen !== '') {
                    if (currentGroup) {
                        groups.push(currentGroup);
                    }

                    const jumlahUser = parseInt(jumlahUserStr, 10) || 1;
                    const namaUser = cols[2] || '';
                    const idPermohonan = cols[3] || '';
                    const promo = cols[4] || '';
                    const noEwallet = cols[5] || '';
                    const nominalVal = parseNominal(cols[6] || '0');

                    currentGroup = {
                        namaAgen: namaAgen,
                        jumlahUser: jumlahUser,
                        promo: promo,
                        noEwallet: noEwallet,
                        nominalVal: nominalVal,
                        nominalFormatted: formatNominal(nominalVal),
                        users: [],
                        isSummary: false
                    };

                    if (namaUser !== '') {
                        currentGroup.users.push({
                            namaUser: namaUser,
                            idPermohonan: idPermohonan
                        });
                    }
                } else {
                    if (currentGroup && cols[2] !== '') {
                        currentGroup.users.push({
                            namaUser: cols[2],
                            idPermohonan: cols[3] || ''
                        });
                    }
                }
            }
        });

        if (!isSummaryFormat && currentGroup) {
            groups.push(currentGroup);
        }

        // Validate user counts & generate warnings ONLY for Detailed format
        groups.forEach((g) => {
            if (!g.isSummary && g.users.length !== g.jumlahUser) {
                warnings.push(
                    `Agen "<strong>${g.namaAgen}</strong>": Nilai JUMLAH USER = ${g.jumlahUser}, tetapi ditemukan ${g.users.length} data user.`
                );
            }
        });

        // Calculate Sum Total
        const totalNominal = groups.reduce((sum, g) => sum + g.nominalVal, 0);

        return {
            groups: groups,
            warnings: warnings,
            totalNominal: totalNominal,
            isSummaryFormat: isSummaryFormat,
            detectedTitle: detectedTitle
        };
    }

    // ==========================================
    // HTML Table Rendering (Landscape & Pagination)
    // ==========================================

    /**
     * Builds HTML table markup matching official Word layout
     * @param {Object} state 
     * @returns {string} HTML string
     */
    function renderTableHTML(state) {
        const {
            periodTitle,
            tanggalProses,
            idColumnLabel,
            promoColumnLabel,
            walletColumnLabel,
            nominalColumnLabel,
            agentsPerPage,
            parsedGroups,
            totalNominal
        } = state;

        const hasTanggalProses = !!(tanggalProses && tanggalProses.trim());
        const totalColumnCount = hasTanggalProses ? 9 : 8;

        const pageSize = parseInt(agentsPerPage, 10);
        const groupChunks = [];

        if (pageSize > 0 && parsedGroups.length > 0) {
            for (let i = 0; i < parsedGroups.length; i += pageSize) {
                groupChunks.push(parsedGroups.slice(i, i + pageSize));
            }
        } else {
            groupChunks.push(parsedGroups);
        }

        let html = '';

        groupChunks.forEach((chunk, pageIdx) => {
            if (pageIdx > 0) {
                html += `<div class="page-break-divider">Halaman ${pageIdx + 1} (Landscape — ${pageSize} Agen Per Lembar Kertas)</div>`;
            }

            html += `<table class="docx-mockup-table">`;

            // 1. Title Row
            html += `<tr class="title-row">
                <td colspan="${totalColumnCount}">${periodTitle || 'REWARD CASHBACK VOUCHER CW WEEKEND PERIODE TRANSFER'}</td>
            </tr>`;

            // 2. Header Row
            html += `<tr class="header-row">`;
            if (hasTanggalProses) html += `<th>TANGGAL PROSES</th>`;
            html += `
                <th>NAMA AGEN</th>
                <th>JUMLAH USER</th>
                <th>NAMA USER</th>
                <th>${idColumnLabel || 'ID USER'}</th>
                <th>${promoColumnLabel || 'VOUCHER'}</th>
                <th>${walletColumnLabel || 'E-WALLET / ID PLN'}</th>
                <th>${nominalColumnLabel || 'NOMINAL'}</th>
                <th>BUKTI TF</th>
            </tr>`;

            // 3. Data Rows
            chunk.forEach((group) => {
                const userCount = (group.users && group.users.length > 0) ? group.users.length : Math.max(1, group.jumlahUser || 1);

                for (let uIdx = 0; uIdx < userCount; uIdx++) {
                    const user = (group.users && group.users[uIdx]) ? group.users[uIdx] : { namaUser: '', idPermohonan: '' };
                    html += `<tr>`;

                    if (uIdx === 0) {
                        if (hasTanggalProses) {
                            html += `<td rowspan="${userCount}" class="text-center">${tanggalProses}</td>`;
                        }

                        // Merged Group Columns
                        html += `<td rowspan="${userCount}" class="text-left font-bold">${group.namaAgen}</td>`;
                        html += `<td rowspan="${userCount}" class="text-center">${group.jumlahUser}</td>`;

                        // Non-merged User Columns
                        html += `<td class="text-left">${user.namaUser}</td>`;
                        html += `<td class="text-center">${user.idPermohonan}</td>`;

                        // Merged Group Columns
                        html += `<td rowspan="${userCount}" class="text-center">${group.promo}</td>`;
                        html += `<td rowspan="${userCount}" class="text-center">${group.noEwallet}</td>`;
                        html += `<td rowspan="${userCount}" class="text-center font-bold">${group.nominalFormatted}</td>`;

                        // Merged Proof Image Column (Per Agent Group)
                        const imgContent = group.imageDataUrl
                            ? `<img src="${group.imageDataUrl}" class="proof-img-preview" alt="Bukti Transfer ${group.namaAgen}">`
                            : ``;
                        html += `<td rowspan="${userCount}" class="text-center">${imgContent}</td>`;
                    } else {
                        // Continuation rows -> only individual user columns
                        html += `<td class="text-left">${user.namaUser}</td>`;
                        html += `<td class="text-center">${user.idPermohonan}</td>`;
                    }

                    html += `</tr>`;
                }
            });

            // 4. TOTAL Row (Only on the last page table)
            if (pageIdx === groupChunks.length - 1) {
                const formattedTotal = formatNominal(totalNominal);
                const labelSpan = totalColumnCount - 2;

                html += `<tr class="total-row">
                    <td colspan="${labelSpan}" class="text-center font-bold">TOTAL</td>
                    <td class="text-center font-bold">${formattedTotal}</td>
                    <td></td>
                </tr>`;
            }

            html += `</table>`;
        });

        return html;
    }

    // ==========================================
    // Image File Processing & Canvas Scaling
    // ==========================================

    /**
     * Reads image file, resizes on canvas, and generates ArrayBuffer & Data URL
     * @param {File} file 
     * @returns {Promise<{ arrayBuffer: ArrayBuffer, width: number, height: number, dataUrl: string }>}
     */
    function processImageFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve({ arrayBuffer: null, width: 0, height: 0, dataUrl: null });
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    // Display bounds inside Word table cell (Min height 2.8 in = 269px at 96 DPI)
                    const MIN_DOCX_HEIGHT = 269; // 2.8 inches (7.11 cm)
                    const MAX_DOCX_HEIGHT = 320; // ~3.3 inches max
                    const MAX_DOCX_WIDTH = 220;  // ~2.3 inches max

                    let docxWidth = img.width;
                    let docxHeight = img.height;
                    const aspectRatio = img.width / img.height;

                    // Ensure minimum height of 2.8 inches (269px)
                    if (docxHeight < MIN_DOCX_HEIGHT) {
                        docxHeight = MIN_DOCX_HEIGHT;
                        docxWidth = Math.round(docxHeight * aspectRatio);
                    }

                    // Proportional scale to fit inside MAX_DOCX_WIDTH
                    if (docxWidth > MAX_DOCX_WIDTH) {
                        docxWidth = MAX_DOCX_WIDTH;
                        docxHeight = Math.round(docxWidth / aspectRatio);
                    }

                    // Proportional scale to fit inside MAX_DOCX_HEIGHT
                    if (docxHeight > MAX_DOCX_HEIGHT) {
                        docxHeight = MAX_DOCX_HEIGHT;
                        docxWidth = Math.round(docxHeight * aspectRatio);
                    }

                    // Enforce minimum height of 2.8 inches (269px)
                    if (docxHeight < MIN_DOCX_HEIGHT) {
                        docxHeight = MIN_DOCX_HEIGHT;
                    }

                    // Canvas rendering size for preview
                    const MAX_CANVAS_WIDTH = 500;
                    let canvasWidth = img.width;
                    let canvasHeight = img.height;

                    if (canvasWidth > MAX_CANVAS_WIDTH) {
                        canvasHeight = Math.round((canvasHeight * MAX_CANVAS_WIDTH) / canvasWidth);
                        canvasWidth = MAX_CANVAS_WIDTH;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

                    // Convert dataUrl to ArrayBuffer for docx ImageRun
                    fetch(dataUrl)
                        .then(res => res.arrayBuffer())
                        .then(arrayBuffer => {
                            resolve({
                                arrayBuffer: arrayBuffer,
                                width: docxWidth,
                                height: docxHeight,
                                dataUrl: dataUrl
                            });
                        })
                        .catch(reject);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ==========================================
    // Per-Agent Photo Handlers & Grid Renderer
    // ==========================================

    function renderAgentPhotoInputs() {
        const grid = document.getElementById('agentPhotoGrid');
        const container = document.getElementById('agentPhotosSection');
        if (!grid || !container) return;

        if (appState.parsedGroups.length === 0) {
            container.classList.add('hidden');
            grid.innerHTML = '';
            return;
        }

        container.classList.remove('hidden');
        let html = '';

        appState.parsedGroups.forEach((group, index) => {
            const hasImg = !!group.imageDataUrl;
            const thumbHtml = hasImg
                ? `<img src="${group.imageDataUrl}" class="agent-thumb-preview" alt="Foto ${group.namaAgen}">`
                : ``;

            const fileName = group.fileName || 'Pilih / Drag & Drop foto di sini...';

            html += `
                <div class="agent-photo-item" data-agent-index="${index}">
                    <div class="agent-info-label">
                        <span>${group.namaAgen}</span>
                        <span class="user-count-badge">${group.jumlahUser} User</span>
                    </div>
                    <div class="agent-file-wrapper">
                        ${thumbHtml}
                        <label for="agentFile_${index}" class="agent-file-label" title="${fileName}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            ${fileName}
                        </label>
                        <input type="file" id="agentFile_${index}" data-agent-index="${index}" accept="image/jpeg,image/png,image/webp" class="agent-file-input">
                        ${hasImg ? `<button type="button" class="btn-icon-clear" data-clear-index="${index}" title="Hapus foto">&times;</button>` : ''}
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;

        // Bind file input change listeners
        grid.querySelectorAll('.agent-file-input').forEach(input => {
            input.addEventListener('change', handleAgentImageUpload);
        });

        // Bind clear button listeners
        grid.querySelectorAll('[data-clear-index]').forEach(btn => {
            btn.addEventListener('click', handleClearAgentImage);
        });

        // Bind Drag & Drop event listeners on each agent card
        grid.querySelectorAll('.agent-photo-item').forEach(item => {
            const agentIndex = parseInt(item.getAttribute('data-agent-index'), 10);

            ['dragenter', 'dragover'].forEach(eventName => {
                item.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.classList.add('drag-active');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                item.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.classList.remove('drag-active');
                }, false);
            });

            item.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    handleAgentFileProcess(agentIndex, dt.files[0]);
                }
            }, false);
        });
    }

    function handleAgentFileProcess(agentIndex, file) {
        if (isNaN(agentIndex) || !appState.parsedGroups[agentIndex] || !file) return;

        if (!file.type.startsWith('image/')) {
            alert('File yang dimasukkan harus berupa file gambar (JPG, PNG, atau WEBP).');
            return;
        }

        processImageFile(file)
            .then(res => {
                const group = appState.parsedGroups[agentIndex];
                group.imageBuffer = res.arrayBuffer;
                group.imageDimensions = { width: res.width, height: res.height };
                group.imageDataUrl = res.dataUrl;
                group.fileName = file.name;

                renderAgentPhotoInputs();
                updateLiveTableAndBadges();
            })
            .catch(err => {
                console.error("Agent image error:", err);
                alert("Gagal memproses foto agen: " + err.message);
            });
    }

    function handleAgentImageUpload(e) {
        const agentIndex = parseInt(e.target.getAttribute('data-agent-index'), 10);
        const file = e.target.files[0];
        handleAgentFileProcess(agentIndex, file);
    }

    function handleClearAgentImage(e) {
        const index = parseInt(e.currentTarget.getAttribute('data-clear-index'), 10);
        if (isNaN(index) || !appState.parsedGroups[index]) return;

        const group = appState.parsedGroups[index];
        group.imageBuffer = null;
        group.imageDimensions = null;
        group.imageDataUrl = null;
        group.fileName = null;

        renderAgentPhotoInputs();
        updateLiveTableAndBadges();
    }

    function updateLiveTableAndBadges() {
        if (appState.parsedGroups.length > 0) {
            const tableHTML = renderTableHTML(appState);
            elements.tableContainer.innerHTML = tableHTML;
            elements.previewSection.classList.remove('hidden');

            const totalUsers = appState.parsedGroups.reduce((a, b) => a + b.users.length, 0);
            const photoCount = appState.parsedGroups.filter(g => !!g.imageDataUrl).length;

            elements.parseSummaryBadge.textContent = `${appState.parsedGroups.length} Agen | ${totalUsers} User | ${photoCount} Foto | Total: ${formatNominal(appState.totalNominal)}`;

            elements.btnPreview.disabled = false;
            elements.btnDownload.disabled = false;
        }
    }

    // ==========================================
    // Real-Time Form Input Sync Handler
    // ==========================================

    function handleFormInputChange() {
        saveToLocalStorage();

        if (elements.periodTitle) appState.periodTitle = (elements.periodTitle.value || '').trim() || 'REWARD CASHBACK VOUCHER CW WEEKEND PERIODE TRANSFER';
        if (elements.tanggalProses) appState.tanggalProses = (elements.tanggalProses.value || '').trim();
        if (elements.idColumnLabel) appState.idColumnLabel = (elements.idColumnLabel.value || '').trim() || 'ID USER';
        if (elements.promoColumnLabel) appState.promoColumnLabel = (elements.promoColumnLabel.value || '').trim() || 'VOUCHER';
        if (elements.walletColumnLabel) appState.walletColumnLabel = (elements.walletColumnLabel.value || '').trim() || 'E-WALLET / ID PLN';
        if (elements.nominalColumnLabel) appState.nominalColumnLabel = (elements.nominalColumnLabel.value || '').trim() || 'NOMINAL';
        if (elements.agentsPerPage) appState.agentsPerPage = parseInt(elements.agentsPerPage.value, 10);

        // Real-time update live preview table if data exists
        if (appState.parsedGroups && appState.parsedGroups.length > 0) {
            updateLiveTableAndBadges();
        }
    }

    // ==========================================
    // Event Handlers & UI Updates
    // ==========================================

    function handleProcessData() {
        handleFormInputChange();

        appState.rawText = (elements.rawInput && elements.rawInput.value) ? elements.rawInput.value : '';

        // Preserve existing uploaded photos mapped by agent name
        const existingImagesMap = new Map();
        (appState.parsedGroups || []).forEach(g => {
            if (g.imageDataUrl) {
                existingImagesMap.set(g.namaAgen, {
                    imageBuffer: g.imageBuffer,
                    imageDimensions: g.imageDimensions,
                    imageDataUrl: g.imageDataUrl,
                    fileName: g.fileName
                });
            }
        });

        const result = parseRawInput(appState.rawText);

        if (result.detectedTitle && elements.periodTitle && (!elements.periodTitle.value || elements.periodTitle.value.trim() === '' || elements.periodTitle.value.includes('REWARD CASHBACK VOUCHER CW WEEKEND PERIODE TRANSFER'))) {
            elements.periodTitle.value = result.detectedTitle;
            appState.periodTitle = result.detectedTitle;
        }

        appState.parsedGroups = result.groups;
        appState.warnings = result.warnings;
        appState.totalNominal = result.totalNominal;

        // Restore image data for matching agents
        appState.parsedGroups.forEach(g => {
            if (existingImagesMap.has(g.namaAgen)) {
                const imgInfo = existingImagesMap.get(g.namaAgen);
                g.imageBuffer = imgInfo.imageBuffer;
                g.imageDimensions = imgInfo.imageDimensions;
                g.imageDataUrl = imgInfo.imageDataUrl;
                g.fileName = imgInfo.fileName;
            }
        });

        // Render Warning Alert Box if any
        if (appState.warnings.length > 0) {
            elements.alertBox.className = "alert-container alert-warning";
            elements.alertBox.innerHTML = `
                <strong>⚠️ Peringatan Validasi User Count:</strong>
                <ul>${appState.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
            `;
        } else {
            elements.alertBox.className = "alert-container hidden";
            elements.alertBox.innerHTML = '';
        }

        renderAgentPhotoInputs();
        updateLiveTableAndBadges();

        if (appState.parsedGroups.length > 0) {
            elements.previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            elements.tableContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #94a3b8;">Tidak ada data valid yang dapat diparsing.</p>';
            elements.previewSection.classList.remove('hidden');
            elements.btnPreview.disabled = true;
            elements.btnDownload.disabled = true;
        }
    }

    function handleOpenPreviewModal() {
        if (appState.parsedGroups.length === 0) return;
        handleFormInputChange();
        const tableHTML = renderTableHTML(appState);
        elements.modalTableBody.innerHTML = tableHTML;
        elements.previewModal.showModal();
    }

    function handleClosePreviewModal() {
        elements.previewModal.close();
    }

    async function handleDownloadDocx() {
        if (appState.parsedGroups.length === 0) {
            alert("Silakan proses data terlebih dahulu sebelum mendownload.");
            return;
        }

        const originalText = elements.btnDownload.innerHTML;
        elements.btnDownload.disabled = true;
        elements.btnDownload.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Meng-generate .docx...`;
        elements.btnModalDownload.disabled = true;

        try {
            const blob = await window.docxGenerator.generateDocxBlob({
                periodTitle: appState.periodTitle,
                tanggalProses: appState.tanggalProses,
                idColumnLabel: appState.idColumnLabel,
                promoColumnLabel: appState.promoColumnLabel,
                walletColumnLabel: appState.walletColumnLabel,
                nominalColumnLabel: appState.nominalColumnLabel,
                agentsPerPage: appState.agentsPerPage,
                parsedGroups: appState.parsedGroups,
                totalNominal: appState.totalNominal
            });

            const slug = slugify(appState.periodTitle);
            const fileName = `Reward_Cashback_${slug || 'Export'}.docx`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error generating docx:", err);
            alert("Gagal membuat file .docx: " + err.message);
        } finally {
            elements.btnDownload.disabled = false;
            elements.btnDownload.innerHTML = originalText;
            elements.btnModalDownload.disabled = false;
        }
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        elements.fileNameText.textContent = file.name;
        elements.btnRemoveImage.classList.remove('hidden');

        processImageFile(file)
            .then(res => {
                appState.imageBuffer = res.arrayBuffer;
                appState.imageDimensions = { width: res.width, height: res.height };
                appState.imageDataUrl = res.dataUrl;

                // Re-render table if data was already processed
                if (appState.parsedGroups.length > 0) {
                    handleProcessData();
                }
            })
            .catch(err => {
                console.error("Image processing error:", err);
                alert("Gagal memproses file foto: " + err.message);
            });
    }

    function handleRemoveImage() {
        elements.proofImage.value = '';
        elements.fileNameText.textContent = 'Pilih Foto Bukti Transfer (JPG/PNG)';
        elements.btnRemoveImage.classList.add('hidden');

        appState.imageBuffer = null;
        appState.imageDimensions = null;
        appState.imageDataUrl = null;

        if (appState.parsedGroups.length > 0) {
            handleProcessData();
        }
    }

    function loadSample(sampleKey) {
        const sample = SAMPLES[sampleKey];
        if (!sample) return;

        elements.periodTitle.value = sample.title;
        elements.idColumnLabel.value = sample.idLabel;
        elements.rawInput.value = sample.raw;

        handleProcessData();
    }

    function handleReset() {
        if (confirm("Apakah Anda yakin ingin mengosongkan semua input?")) {
            elements.periodTitle.value = '';
            elements.tanggalProses.value = '';
            elements.idColumnLabel.value = 'ID USER';
            elements.promoColumnLabel.value = 'VOUCHER';
            elements.walletColumnLabel.value = 'E-WALLET / ID PLN';
            elements.nominalColumnLabel.value = 'NOMINAL';
            elements.agentsPerPage.value = '0';
            elements.rawInput.value = '';
            
            localStorage.removeItem('rcg_periodTitle');
            localStorage.removeItem('rcg_tanggalProses');
            localStorage.removeItem('rcg_idColumnLabel');
            localStorage.removeItem('rcg_promoColumnLabel');
            localStorage.removeItem('rcg_walletColumnLabel');
            localStorage.removeItem('rcg_nominalColumnLabel');
            localStorage.removeItem('rcg_agentsPerPage');
            localStorage.removeItem('rcg_rawInput');

            elements.previewSection.classList.add('hidden');
            elements.alertBox.classList.add('hidden');
            elements.btnPreview.disabled = true;
            elements.btnDownload.disabled = true;
            appState.parsedGroups = [];
            renderAgentPhotoInputs();
        }
    }

    // ==========================================
    // Initialization & Event Binding
    // ==========================================
    function init() {
        loadFromLocalStorage();
        handleFormInputChange();

        // Bind Buttons safely
        if (elements.btnProcess) elements.btnProcess.addEventListener('click', handleProcessData);
        if (elements.btnPreview) elements.btnPreview.addEventListener('click', handleOpenPreviewModal);
        if (elements.btnDownload) elements.btnDownload.addEventListener('click', handleDownloadDocx);
        if (elements.btnModalDownload) elements.btnModalDownload.addEventListener('click', handleDownloadDocx);
        if (elements.btnCloseModal) elements.btnCloseModal.addEventListener('click', handleClosePreviewModal);
        if (elements.btnModalClose) elements.btnModalClose.addEventListener('click', handleClosePreviewModal);
        if (elements.btnReset) elements.btnReset.addEventListener('click', handleReset);

        // Bind Samples safely
        if (elements.btnSample1) elements.btnSample1.addEventListener('click', () => loadSample('sample1'));
        if (elements.btnSample2) elements.btnSample2.addEventListener('click', () => loadSample('sample2'));

        // Bind real-time input change handlers for instant live preview & localStorage sync
        const inputControls = [
            elements.periodTitle,
            elements.tanggalProses,
            elements.idColumnLabel,
            elements.promoColumnLabel,
            elements.walletColumnLabel,
            elements.nominalColumnLabel,
            elements.agentsPerPage,
            elements.rawInput
        ];

        inputControls.forEach(control => {
            if (control) {
                control.addEventListener('input', handleFormInputChange);
                control.addEventListener('change', handleFormInputChange);
            }
        });

        // Auto process data if raw input is restored from localStorage
        if (elements.rawInput && elements.rawInput.value.trim() !== '') {
            handleProcessData();
        }

        // Expose parseRawInput & appState for browser testing
        window.parseRawInput = parseRawInput;
        window.appState = appState;
    }

    document.addEventListener('DOMContentLoaded', init);

})();
