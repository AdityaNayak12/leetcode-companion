// Content script entry point — extracts problem info and injects the Testcase Playground panel.

(() => {
    function getProblemSlug() {
        const match = window.location.pathname.match(/\/problems\/([^/]+)/);
        return match ? match[1] : null;
    }

    function extractProblemInfo() {
        const info = { title: "", description: "", examples: "", constraints: "" };

        const titleEl =
            document.querySelector('[data-cy="question-title"]') ||
            document.querySelector(".text-title-large") ||
            document.querySelector("div[class*='title']");
        if (titleEl) info.title = titleEl.textContent.trim();

        const descContainer =
            document.querySelector('[data-cy="question-content"]') ||
            document.querySelector("div.elfjS") ||
            document.querySelector("div[class*='description']");

        if (descContainer) {
            const fullText = descContainer.innerText;
            info.description = fullText;

            const exampleMatches = fullText.match(
                /Example\s*\d[\s\S]*?(?=Example\s*\d|Constraints|$)/gi
            );
            if (exampleMatches) info.examples = exampleMatches.join("\n\n");

            const constraintMatch = fullText.match(/Constraints[\s\S]*/i);
            if (constraintMatch) info.constraints = constraintMatch[0];
        }

        return info;
    }

    function findInjectionPoint() {
        return (
            document.querySelector('[data-cy="question-content"]') ||
            document.querySelector("div.elfjS") ||
            document.querySelector("div[class*='description__']") ||
            document.querySelector("div[class*='content__']")
        );
    }

    function inject() {
        if (document.getElementById(TestcasePanel.PANEL_ID)) return;

        const slug = getProblemSlug();
        if (!slug) return;

        const anchor = findInjectionPoint();
        if (!anchor) return;

        const problemInfo = extractProblemInfo();
        const panel = TestcasePanel.createPanel(slug, problemInfo);
        if (!panel) return;

        if (anchor.parentNode) {
            anchor.parentNode.insertBefore(panel, anchor.nextSibling);
        }

        console.log("[TCP] Testcase Playground injected for:", slug);
    }

    // Handle SPA navigation — LeetCode uses pushState, not full reloads.
    let lastUrl = location.href;

    function onUrlChange() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            const old = document.getElementById(TestcasePanel.PANEL_ID);
            if (old) old.remove();
            setTimeout(tryInject, 1500);
        }
    }

    setInterval(onUrlChange, 1000);

    // Retry injection — LeetCode loads content lazily.
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    function tryInject() {
        attempts = 0;
        const timer = setInterval(() => {
            if (document.getElementById(TestcasePanel.PANEL_ID) || attempts >= MAX_ATTEMPTS) {
                clearInterval(timer);
                return;
            }
            inject();
            attempts++;
        }, 500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", tryInject);
    } else {
        tryInject();
    }
})();
