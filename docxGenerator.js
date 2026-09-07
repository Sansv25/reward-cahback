/**
 * Reward Cashback Generator — Docx Generator Module
 * Client-side Word (.docx) file creation using docx library UMD
 */

(function (window) {
    'use strict';

    /**
     * Generates a Blob representing the Word document.
     * @param {Object} options 
     * @param {string} options.periodTitle 
     * @param {string} options.tanggalProses 
     * @param {string} options.idColumnLabel 
     * @param {string} options.promoColumnLabel 
     * @param {string} options.walletColumnLabel 
     * @param {string} options.nominalColumnLabel 
     * @param {number} options.agentsPerPage 
     * @param {Array} options.parsedGroups 
     * @param {number} options.totalNominal 
     * @returns {Promise<Blob>}
     */
    async function generateDocxBlob(options) {
        if (!window.docx) {
            throw new Error("Library 'docx' belum dimuat. Pastikan koneksi internet tersedia untuk memuat CDN.");
        }

        const {
            periodTitle = "REWARD CASHBACK VOUCHER CW WEEKEND PERIODE TRANSFER",
            tanggalProses = "",
            idColumnLabel = "ID USER",
            promoColumnLabel = "VOUCHER",
            walletColumnLabel = "E-WALLET / ID PLN",
            nominalColumnLabel = "NOMINAL",
            agentsPerPage = 2,
            showTotalRow = true,
            parsedGroups = [],
            totalNominal = 0
        } = options;

        const docx = window.docx;

        // Check if Tanggal Proses column is enabled
        const hasTanggalProses = !!(tanggalProses && tanggalProses.trim());
        const totalColumnCount = hasTanggalProses ? 9 : 8;

        // Common border definition (Thin black borders)
        const borderStyle = {
            top: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" },
            bottom: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" },
            left: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" },
            right: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" },
            insideHorizontal: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" },
            insideVertical: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" }
        };

        const cellMargins = { top: 100, bottom: 100, left: 100, right: 100 };

        // Helper to format text run
        const createTextParagraph = (text, options = {}) => {
            const {
                bold = false,
                color = "000000",
                size = 18, // 9pt
                align = docx.AlignmentType.CENTER
            } = options;

            return new docx.Paragraph({
                alignment: align,
                children: [
                    new docx.TextRun({
                        text: String(text || ''),
                        bold: bold,
                        color: color,
                        size: size,
                        font: "Arial"
                    })
                ]
            });
        };

        // Define Headers Array
        const headers = [];
        if (hasTanggalProses) headers.push("TANGGAL PROSES");
        headers.push(
            "NAMA AGEN",
            "JUMLAH USER",
            "NAMA USER",
            idColumnLabel || "ID USER",
            promoColumnLabel || "VOUCHER",
            walletColumnLabel || "E-WALLET / ID PLN",
            nominalColumnLabel || "NOMINAL",
            "BUKTI TF"
        );

        // Grouping agents into pages (e.g. 2 agents per page)
        const pageSize = parseInt(agentsPerPage, 10);
        const groupChunks = [];

        if (pageSize > 0 && parsedGroups.length > 0) {
            for (let i = 0; i < parsedGroups.length; i += pageSize) {
                groupChunks.push(parsedGroups.slice(i, i + pageSize));
            }
        } else {
            // All in single continuous table
            groupChunks.push(parsedGroups);
        }

        const sectionChildren = [];

        groupChunks.forEach((chunk, pageIdx) => {
            const tableRows = [];

            // 1. TITLE ROW
            tableRows.push(
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: totalColumnCount,
                            shading: { fill: "4472C4", val: docx.ShadingType.CLEAR },
                            verticalAlign: docx.VerticalAlign.CENTER,
                            margins: { top: 140, bottom: 140, left: 120, right: 120 },
                            children: [
                                createTextParagraph(periodTitle, {
                                    bold: true,
                                    color: "FFFFFF",
                                    size: 22, // 11pt
                                    align: docx.AlignmentType.CENTER
                                })
                            ]
                        })
                    ]
                })
            );

            // 2. HEADER ROW
            tableRows.push(
                new docx.TableRow({
                    children: headers.map((hText) =>
                        new docx.TableCell({
                            shading: { fill: "FFFF00", val: docx.ShadingType.CLEAR },
                            verticalAlign: docx.VerticalAlign.CENTER,
                            margins: cellMargins,
                            children: [
                                createTextParagraph(hText, {
                                    bold: true,
                                    color: "000000",
                                    size: 19, // 9.5pt
                                    align: docx.AlignmentType.CENTER
                                })
                            ]
                        })
                    )
                })
            );

            // 3. DATA ROWS FOR THIS PAGE CHUNK
            chunk.forEach((group) => {
                const userCount = (group.users && group.users.length > 0) ? group.users.length : Math.max(1, group.jumlahUser || 1);

                for (let uIdx = 0; uIdx < userCount; uIdx++) {
                    const user = (group.users && group.users[uIdx]) ? group.users[uIdx] : { namaUser: "", idPermohonan: "" };
                    const rowCells = [];

                    if (uIdx === 0) {
                        // Include Tanggal Proses if enabled
                        if (hasTanggalProses) {
                            rowCells.push(
                                new docx.TableCell({
                                    rowSpan: userCount,
                                    verticalAlign: docx.VerticalAlign.CENTER,
                                    margins: cellMargins,
                                    children: [createTextParagraph(tanggalProses, { align: docx.AlignmentType.CENTER })]
                                })
                            );
                        }

                        // Agent level merged columns
                        rowCells.push(
                            new docx.TableCell({
                                rowSpan: userCount,
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph(group.namaAgen, { bold: true, align: docx.AlignmentType.LEFT })]
                            }),
                            new docx.TableCell({
                                rowSpan: userCount,
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph(group.jumlahUser, { align: docx.AlignmentType.CENTER })]
                            }),
                            new docx.TableCell({
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph(user.namaUser, { align: docx.AlignmentType.LEFT })]
                            }),
                            new docx.TableCell({
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph(user.idPermohonan, { align: docx.AlignmentType.CENTER })]
                            }),
                            new docx.TableCell({
                                rowSpan: userCount,
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph(group.promo, { align: docx.AlignmentType.CENTER })]
                            }),
                            new docx.TableCell({
                                rowSpan: userCount,
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph(group.noEwallet, { align: docx.AlignmentType.CENTER })]
                            }),
                            new docx.TableCell({
                                rowSpan: userCount,
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph(group.nominalFormatted, { align: docx.AlignmentType.CENTER })]
                            })
                        );

                        // BUKTI TF Column (1 photo per agent group with left/right padding)
                        const proofChildren = [];
                        if (group.imageBuffer && group.imageDimensions) {
                            proofChildren.push(
                                new docx.Paragraph({
                                    alignment: docx.AlignmentType.CENTER,
                                    children: [
                                        new docx.ImageRun({
                                            data: group.imageBuffer,
                                            transformation: {
                                                width: group.imageDimensions.width || 180,
                                                height: group.imageDimensions.height || 269
                                            }
                                        })
                                    ]
                                })
                            );
                        } else {
                            proofChildren.push(createTextParagraph(""));
                        }

                        rowCells.push(
                            new docx.TableCell({
                                rowSpan: userCount,
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: { top: 80, bottom: 80, left: 140, right: 140 },
                                children: proofChildren
                            })
                        );
                    } else {
                        // Continuation row of group -> include only NAMA USER and ID PERMOHONAN
                        rowCells.push(
                            new docx.TableCell({
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph(user.namaUser, { align: docx.AlignmentType.LEFT })]
                            }),
                            new docx.TableCell({
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph(user.idPermohonan, { align: docx.AlignmentType.CENTER })]
                            })
                        );
                    }

                    tableRows.push(new docx.TableRow({ cantSplit: true, children: rowCells }));
                }
            });

            // 4. TOTAL ROW (ONLY ON THE VERY LAST PAGE IF ENABLED)
            if (showTotalRow && pageIdx === groupChunks.length - 1) {
                const formattedTotal = "Rp " + Number(totalNominal || 0).toLocaleString('id-ID');
                const labelSpan = totalColumnCount - 2; // e.g. 9 - 2 = 7, or 8 - 2 = 6

                tableRows.push(
                    new docx.TableRow({
                        children: [
                            new docx.TableCell({
                                columnSpan: labelSpan,
                                shading: { fill: "FFFF00", val: docx.ShadingType.CLEAR },
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [
                                    createTextParagraph("TOTAL", {
                                        bold: true,
                                        color: "000000",
                                        size: 20,
                                        align: docx.AlignmentType.CENTER
                                    })
                                ]
                            }),
                            new docx.TableCell({
                                columnSpan: 1,
                                shading: { fill: "FFFF00", val: docx.ShadingType.CLEAR },
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [
                                    createTextParagraph(formattedTotal, {
                                        bold: true,
                                        color: "000000",
                                        size: 20,
                                        align: docx.AlignmentType.CENTER
                                    })
                                ]
                            }),
                            new docx.TableCell({
                                columnSpan: 1,
                                shading: { fill: "FFFF00", val: docx.ShadingType.CLEAR },
                                verticalAlign: docx.VerticalAlign.CENTER,
                                margins: cellMargins,
                                children: [createTextParagraph("")]
                            })
                        ]
                    })
                );
            }

            // Build Page Table
            const table = new docx.Table({
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                rows: tableRows,
                borders: borderStyle
            });

            sectionChildren.push(table);

            // Insert Page Break between page chunks
            if (pageIdx < groupChunks.length - 1) {
                sectionChildren.push(
                    new docx.Paragraph({
                        children: [new docx.PageBreak()]
                    })
                );
            }
        });

        // Build Document with LANDSCAPE Orientation
        const doc = new docx.Document({
            sections: [
                {
                    properties: {
                        page: {
                            size: {
                                orientation: docx.PageOrientation.LANDSCAPE
                            },
                            margin: {
                                top: 720,    // 0.5 inch
                                bottom: 720,
                                left: 720,
                                right: 720
                            }
                        }
                    },
                    children: sectionChildren
                }
            ]
        });

        // Pack into Blob
        const blob = await docx.Packer.toBlob(doc);
        return blob;
    }

    // Export to window scope
    window.docxGenerator = {
        generateDocxBlob: generateDocxBlob
    };

})(window);
