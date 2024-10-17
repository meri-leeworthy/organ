import React, { useState, useEffect } from 'react';

const MarkdownConverter = () => {
  const [markdownInput, setMarkdownInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [wasmModule, setWasmModule] = useState(null);

  // Load the WASM module asynchronously when the component mounts
  useEffect(() => {
    const loadWasm = async () => {
      try {
        console.log('Loading WASM module...');
        const module = await import('../wasm/markdown_to_html/markdown_to_html.js');
        setWasmModule(module);
        console.log('WASM module loaded:', module);
      } catch (e) {
        console.error('Failed to load WASM module:', e);
        setErrorMessage('Failed to load WASM module.');
      }
    };
    loadWasm();
  }, []);

  const handleConvert = () => {
    if (!wasmModule) {
      console.error('WASM module not loaded yet');
      setErrorMessage('WASM module not loaded yet. Please wait a moment and try again.');
      return;
    }
    try {
      console.log('Converting markdown:', markdownInput);
      const result = wasmModule.markdown_to_html(markdownInput);
      console.log('Conversion result:', result);
      setPreviewContent(result);
      setErrorMessage('');
    } catch (e) {
      console.error('Error during conversion:', e);
      setPreviewContent('');
      setErrorMessage(e.toString());
    }
  };

  return (
    <div>
      <h1>Markdown to HTML Converter</h1>
      <textarea
        id="markdown-input"
        rows="10"
        cols="60"
        placeholder="Enter your Markdown here"
        value={markdownInput}
        onChange={(e) => setMarkdownInput(e.target.value)}
      ></textarea>
      <br />
      <br />
      <button id="convert-button" onClick={handleConvert}>
        Convert to HTML
      </button>

      <h2>Preview</h2>
      <div
        id="preview-pane"
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          width: '60%',
          minHeight: '100px',
        }}
        dangerouslySetInnerHTML={{ __html: previewContent }}
      ></div>
      {errorMessage && (
        <p id="error-message" style={{ color: 'red' }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default MarkdownConverter;
