// Storage helpers — persists AI and custom testcases per problem slug.
// Key format: "tc_<problemSlug>" → { ai: [...], custom: [...] }

const StorageHelper = (() => {
  const _key = (slug) => `tc_${slug}`;

  async function getTestcases(problemSlug) {
    const key = _key(problemSlug);
    const result = await chrome.storage.local.get(key);
    return result[key] || { ai: [], custom: [] };
  }

  // Appends AI testcases, deduplicating by input string.
  async function saveAITestcases(problemSlug, newTestcases) {
    const data = await getTestcases(problemSlug);
    const existingInputs = new Set(data.ai.map((t) => t.input));
    const unique = newTestcases.filter((t) => !existingInputs.has(t.input));
    data.ai = [...data.ai, ...unique];
    await chrome.storage.local.set({ [_key(problemSlug)]: data });
    return data;
  }

  async function addCustomTestcase(problemSlug, testcase) {
    const data = await getTestcases(problemSlug);
    data.custom.push(testcase);
    await chrome.storage.local.set({ [_key(problemSlug)]: data });
    return data;
  }

  async function clearCustomTestcases(problemSlug) {
    const data = await getTestcases(problemSlug);
    data.custom = [];
    await chrome.storage.local.set({ [_key(problemSlug)]: data });
    return data;
  }

  return {
    getTestcases,
    saveAITestcases,
    addCustomTestcase,
    clearCustomTestcases,
  };
})();
