const TestcasePanel = (() => {
    const PANEL_ID = "tcp-playground";

    function _el(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => {
            if (k === "className") el.className = v;
            else if (k === "textContent") el.textContent = v;
            else if (k === "innerHTML") el.innerHTML = v;
            else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
            else el.setAttribute(k, v);
        });
        children.forEach((c) => {
            if (typeof c === "string") el.appendChild(document.createTextNode(c));
            else if (c) el.appendChild(c);
        });
        return el;
    }

    // Parses JSON input into key-value rows; falls back to plain text.
    function _formatInput(inputStr) {
        const wrapper = _el("div", { className: "tcp-params" });

        try {
            const parsed = JSON.parse(inputStr);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                Object.entries(parsed).forEach(([key, value]) => {
                    const row = _el("div", { className: "tcp-param-row" }, [
                        _el("span", { className: "tcp-param-key", textContent: key }),
                        _el("span", { className: "tcp-param-sep", textContent: "=" }),
                        _el("span", {
                            className: "tcp-param-value",
                            textContent: typeof value === "object" ? JSON.stringify(value) : String(value),
                        }),
                    ]);
                    wrapper.appendChild(row);
                });
                return wrapper;
            }
        } catch (_) { }

        wrapper.appendChild(
            _el("span", { className: "tcp-param-value", textContent: inputStr })
        );
        return wrapper;
    }

    function _renderAIList(container, testcases) {
        container.innerHTML = "";
        if (testcases.length === 0) {
            container.appendChild(
                _el("div", { className: "tcp-empty", textContent: 'Click "Generate Testcases" to get started.' })
            );
            return;
        }
        const ul = _el("ul", { className: "tcp-list" });
        testcases.forEach((tc, i) => {
            const header = _el("div", { className: "tcp-item-header" }, [
                _el("span", { className: "tcp-item-index", textContent: `#${i + 1}` }),
            ]);
            const body = _formatInput(tc.input);
            const children = [header, body];

            if (tc.expected_output) {
                children.push(
                    _el("div", { className: "tcp-output-row" }, [
                        _el("span", { className: "tcp-output-label", textContent: "→ Output:" }),
                        _el("span", { className: "tcp-output-value", textContent: tc.expected_output }),
                    ])
                );
            }

            const li = _el("li", { className: "tcp-list-item" }, children);
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }

    function _renderCustomList(container, testcases) {
        container.innerHTML = "";
        if (testcases.length === 0) {
            container.appendChild(
                _el("div", { className: "tcp-empty", textContent: "No custom testcases yet." })
            );
            return;
        }
        const ul = _el("ul", { className: "tcp-list" });
        testcases.forEach((tc, i) => {
            const inputBlock = _el("div", {}, [
                _el("span", { className: "tcp-item-label", textContent: "Input:" }),
                _el("span", { textContent: tc.input }),
            ]);
            const children = [
                _el("span", { className: "tcp-item-index", textContent: `${i + 1}.` }),
                inputBlock,
            ];
            if (tc.expectedOutput) {
                children.push(
                    _el("div", { style: "margin-top:4px" }, [
                        _el("span", { className: "tcp-item-label", textContent: "Expected Output:" }),
                        _el("span", { textContent: tc.expectedOutput }),
                    ])
                );
            }
            ul.appendChild(_el("li", { className: "tcp-list-item" }, children));
        });
        container.appendChild(ul);
    }

    function createPanel(problemSlug, problemInfo) {
        if (document.getElementById(PANEL_ID)) return null;

        const panel = _el("div", { id: PANEL_ID });
        panel.appendChild(_el("div", { className: "tcp-title", textContent: "Testcase Playground" }));

        // AI Section
        const aiSection = _el("div", { className: "tcp-section" });
        aiSection.appendChild(
            _el("div", { className: "tcp-section-title", innerHTML: '<span class="tcp-icon">🤖</span> AI Generated Testcases' })
        );

        const aiListContainer = _el("div", { id: "tcp-ai-list" });
        const aiStatus = _el("div", { className: "tcp-status", id: "tcp-ai-status" });

        const generateBtn = _el("button", {
            className: "tcp-btn tcp-btn-primary",
            id: "tcp-generate-btn",
            innerHTML: "✨ Generate Testcases",
        });

        const generateMoreBtn = _el("button", {
            className: "tcp-btn tcp-btn-secondary",
            id: "tcp-generate-more-btn",
            textContent: "Generate More",
            style: "display:none",
        });

        const copyAllBtn = _el("button", {
            className: "tcp-btn tcp-btn-secondary",
            id: "tcp-copy-all-btn",
            textContent: "📋 Copy All",
            style: "display:none",
        });

        async function handleGenerate(btn) {
            btn.disabled = true;
            aiStatus.className = "tcp-status";
            aiStatus.innerHTML = '<span class="tcp-spinner"></span>&nbsp; Generating testcases…';

            try {
                const newTcs = await GroqAPI.generateTestcases(problemInfo);
                const data = await StorageHelper.saveAITestcases(problemSlug, newTcs);
                _renderAIList(aiListContainer, data.ai);
                aiStatus.className = "tcp-status success";
                aiStatus.textContent = `✅ ${data.ai.length} testcases available.`;
                generateMoreBtn.style.display = "";
                copyAllBtn.style.display = "";
            } catch (err) {
                console.error("[TCP]", err);
                aiStatus.className = "tcp-status error";
                aiStatus.textContent = `❌ ${err.message}`;
            } finally {
                btn.disabled = false;
            }
        }

        generateBtn.addEventListener("click", () => handleGenerate(generateBtn));
        generateMoreBtn.addEventListener("click", () => handleGenerate(generateMoreBtn));

        copyAllBtn.addEventListener("click", async () => {
            const data = await StorageHelper.getTestcases(problemSlug);
            const text = data.ai.map((tc, i) => `${i + 1}. input: ${tc.input}`).join("\n");
            await navigator.clipboard.writeText(text);
            const prev = copyAllBtn.textContent;
            copyAllBtn.textContent = "✅ Copied!";
            setTimeout(() => (copyAllBtn.textContent = prev), 1500);
        });

        aiSection.appendChild(aiListContainer);
        aiSection.appendChild(aiStatus);
        aiSection.appendChild(
            _el("div", { className: "tcp-btn-group" }, [generateBtn, generateMoreBtn, copyAllBtn])
        );
        panel.appendChild(aiSection);

        panel.appendChild(_el("hr", { className: "tcp-divider" }));

        // Custom Section
        const customSection = _el("div", { className: "tcp-section" });
        customSection.appendChild(
            _el("div", { className: "tcp-section-title", innerHTML: '<span class="tcp-icon">✏️</span> Custom Testcases' })
        );

        const customListContainer = _el("div", { id: "tcp-custom-list" });

        const inputLabel = _el("label", { className: "tcp-field-label", textContent: "Input" });
        const inputArea = _el("textarea", {
            className: "tcp-textarea",
            id: "tcp-custom-input",
            placeholder: 'e.g.  s="abc", p="*c"',
            rows: "3",
        });

        const outputLabel = _el("label", { className: "tcp-field-label", textContent: "Expected Output (optional)" });
        const outputArea = _el("textarea", {
            className: "tcp-textarea",
            id: "tcp-custom-output",
            placeholder: "e.g.  true",
            rows: "2",
        });

        const addBtn = _el("button", {
            className: "tcp-btn tcp-btn-primary",
            textContent: "➕ Add Testcase",
        });

        const clearBtn = _el("button", {
            className: "tcp-btn tcp-btn-danger",
            textContent: "🗑️ Clear",
        });

        const customStatus = _el("div", { className: "tcp-status", id: "tcp-custom-status" });

        addBtn.addEventListener("click", async () => {
            const input = inputArea.value.trim();
            if (!input) {
                customStatus.className = "tcp-status error";
                customStatus.textContent = "Please enter an input value.";
                return;
            }
            const tc = { input, expectedOutput: outputArea.value.trim() || "" };
            const data = await StorageHelper.addCustomTestcase(problemSlug, tc);
            _renderCustomList(customListContainer, data.custom);
            inputArea.value = "";
            outputArea.value = "";
            customStatus.className = "tcp-status success";
            customStatus.textContent = `✅ Testcase added (${data.custom.length} total).`;
        });

        clearBtn.addEventListener("click", async () => {
            const data = await StorageHelper.clearCustomTestcases(problemSlug);
            _renderCustomList(customListContainer, data.custom);
            customStatus.className = "tcp-status success";
            customStatus.textContent = "Cleared all custom testcases.";
        });

        customSection.appendChild(customListContainer);
        customSection.appendChild(inputLabel);
        customSection.appendChild(inputArea);
        customSection.appendChild(outputLabel);
        customSection.appendChild(outputArea);
        customSection.appendChild(customStatus);
        customSection.appendChild(_el("div", { className: "tcp-btn-group" }, [addBtn, clearBtn]));
        panel.appendChild(customSection);

        // Load saved testcases from storage
        StorageHelper.getTestcases(problemSlug).then((data) => {
            _renderAIList(aiListContainer, data.ai);
            _renderCustomList(customListContainer, data.custom);
            if (data.ai.length > 0) {
                generateMoreBtn.style.display = "";
                copyAllBtn.style.display = "";
                aiStatus.className = "tcp-status success";
                aiStatus.textContent = `${data.ai.length} testcases loaded from storage.`;
            }
        });

        return panel;
    }

    return { PANEL_ID, createPanel };
})();
