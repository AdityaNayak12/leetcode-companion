# LeetCode Testcase Playground — Chrome Extension

A Chrome Extension that injects a **Testcase Playground** panel into LeetCode problem pages, letting you generate AI-powered testcases and add custom ones.

## Features

- 🤖 **AI Testcase Generation** — Uses the Groq API (Llama 3.3 70B) to generate 20 valid testcases (edge cases, boundary cases, tricky inputs)
- ✏️ **Custom Testcases** — Add your own inputs and expected outputs manually
- 💾 **Persistent Storage** — All testcases are saved per-problem via `chrome.storage.local`
- 🎨 **Dark Mode** — Seamlessly matches LeetCode's dark theme

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/AdityaNayak12/leetcode-companion.git
cd leetcode-companion
```

### 2. Add your Groq API key

Get a free API key from [console.groq.com](https://console.groq.com). Then open `extension/config.js` and replace the placeholder:

```javascript
const CONFIG = Object.freeze({
  GROQ_API_KEY: "your_actual_key_here"
});
```

> **Note:** `config.js` is `.gitignore`d — your key won't be committed.

### 3. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked** → select the `extension/` folder
4. Navigate to any LeetCode problem (e.g. [Two Sum](https://leetcode.com/problems/two-sum/))
5. The **Testcase Playground** panel appears below the problem description

## File Structure

```
extension/
├── manifest.json      # Manifest V3 config
├── config.js          # Your Groq API key (not committed)
├── storage.js         # Chrome storage helpers
├── gemini.js          # Groq API integration
├── panel.js           # Panel UI construction & events
├── panel.css          # Dark-mode styling
├── content.js         # Content script entry point
├── .gitignore         # Ignores config.js
└── icons/
    ├── icon48.png
    └── icon128.png
```

## Usage

1. Open any LeetCode problem page
2. Scroll to the **Testcase Playground** panel below the description
3. Click **✨ Generate Testcases** to get 20 AI-generated testcases
4. Click **Generate More** to append more
5. Click **📋 Copy All** to copy all AI testcases to clipboard
6. Use the **Custom Testcases** section to add your own inputs
