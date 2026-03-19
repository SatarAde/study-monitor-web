// src/components/PDFManager.js
import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { T, font, Btn, Card, Label, Input } from '../utils/design';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function PDFManager({ books, onUpload, onExtract }) {
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState('');
  const [selected, setSelected]     = useState(null);
  const [fromPage, setFromPage]     = useState('');
  const [toPage, setToPage]         = useState('');
  const [preview, setPreview]       = useState('');
  const fileRef                     = useRef();

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setProgress('Reading PDF...');
    try {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const total = pdf.numPages;
      const pages = [];
      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim());
        if (i % 10 === 0) setProgress(`Extracted ${i}/${total} pages...`);
      }
      await onUpload(file.name, total, pages);
      setProgress('');
    } catch (err) {
      setProgress('Could not read this PDF. Try another file.');
    }
    setLoading(false);
    e.target.value = '';
  };

  const doPreview = () => {
    if (!selected || !fromPage || !toPage) return;
    const f = parseInt(fromPage) - 1;
    const t = parseInt(toPage);
    const text = selected.pages.slice(f, t).join('\n\n');
    setPreview(text.slice(0, 600) + (text.length > 600 ? '...' : ''));
  };

  const doExtract = () => {
    if (!selected || !fromPage || !toPage) return;
    const f = parseInt(fromPage) - 1;
    const t = parseInt(toPage);
    const text = selected.pages.slice(f, t).join('\n\n');
    onExtract(text, `${selected.name} pp.${fromPage}–${toPage}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Upload zone */}
      <Card>
        <Label>Upload Textbook (PDF)</Label>
        <div
          onClick={() => !loading && fileRef.current.click()}
          style={{
            border: `2px dashed ${T.accent}40`, borderRadius: 10,
            padding: '28px 20px', textAlign: 'center',
            cursor: loading ? 'wait' : 'pointer',
            background: T.accentLo, transition: 'border-color .2s',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
          <div style={{ fontFamily: font.display, color: T.sub, fontSize: 14 }}>
            {loading ? progress : 'Click to upload any WAEC textbook as PDF'}
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted, marginTop: 4 }}>
            All pages extracted & stored — assign any page range later
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} style={{ display: 'none' }} />
      </Card>

      {/* Book list */}
      {books.length > 0 && (
        <div>
          <Label>Uploaded Textbooks — click to select</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {books.map(b => (
              <Card
                key={b.id}
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  borderColor: selected?.id === b.id ? T.accent : T.border,
                  background: selected?.id === b.id ? T.accentLo : T.s1,
                }}
                onClick={() => { setSelected(b); setFromPage(''); setToPage(''); setPreview(''); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: font.display, fontWeight: 600, color: T.text, fontSize: 14 }}>
                      {b.name}
                    </div>
                    <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted, marginTop: 2 }}>
                      {b.totalPages} pages
                    </div>
                  </div>
                  {selected?.id === b.id && (
                    <span style={{ fontFamily: font.mono, fontSize: 10, color: T.accent }}>SELECTED ✓</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Page range */}
      {selected && (
        <Card style={{ borderColor: T.accent + '40' }}>
          <Label>Select Page Range — "{selected.name}"</Label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Label>From Page</Label>
              <Input value={fromPage} onChange={e => setFromPage(e.target.value)} placeholder="1" />
            </div>
            <div style={{ paddingBottom: 9, color: T.muted, fontFamily: font.mono }}>→</div>
            <div style={{ flex: 1 }}>
              <Label>To Page</Label>
              <Input value={toPage} onChange={e => setToPage(e.target.value)} placeholder={selected.totalPages} />
            </div>
          </div>

          {preview && (
            <div style={{
              background: T.s2, borderRadius: 8, padding: '10px 13px',
              marginBottom: 12, maxHeight: 130, overflowY: 'auto',
            }}>
              <div style={{ fontFamily: font.mono, fontSize: 9, color: T.muted, marginBottom: 4 }}>PREVIEW</div>
              <div style={{ fontFamily: font.display, fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{preview}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" sm onClick={doPreview} disabled={!fromPage || !toPage}>
              Preview Pages
            </Btn>
            <Btn sm onClick={doExtract} disabled={!fromPage || !toPage}>
              Use These Pages →
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
