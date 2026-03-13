import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';

export default function TextEditor({ value, onChange, onOverflow, readOnly }) {
  return (
    <div className="ck-editor-document-container h-full w-full">
      <CKEditor
        editor={DecoupledEditor}
        data={value}
        disabled={readOnly}
        onReady={editor => {
          // 1. Relocate Toolbar to the Ribbon Header
          const toolbarContainer = document.querySelector('#toolbar-container');
          
          if (toolbarContainer) {
            toolbarContainer.innerHTML = '';
            toolbarContainer.appendChild(editor.ui.view.toolbar.element);
          }

          // 2. ⭐ Apply Strict A4 Limitations to the Editable Area
          editor.editing.view.change(writer => {
            const root = editor.editing.view.document.getRoot();

            // Set fixed height to fill the inner A4 sheet (1123px - margins)
            writer.setStyle('height', '931px', root);
            writer.setStyle('max-height', '931px', root);
            
            // ⭐ CRITICAL: Hide overflow to stop text from leaking
            writer.setStyle('overflow', 'hidden', root);

            // Clean up aesthetics for a seamless 'paper' look
            writer.setStyle('background', 'transparent', root);
            writer.setStyle('padding', '0', root);
            writer.setStyle('outline', 'none', root);
          });
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          
          // ⭐ OVERFLOW DETECTION LOGIC
          // We measure the actual DOM element height against our A4 limit
          const domElement = editor.ui.view.editable.element;
          if (domElement && domElement.scrollHeight > 931) {
            if (onOverflow) {
              onOverflow(); 
            }
          }

          onChange(data);
        }}
        config={{
          placeholder: 'Start typing your document content here...',
          toolbar: {
            items: [
              'heading', '|',
              'bold', 'italic', 'underline', 'strikethrough', '|',
              'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
              'alignment', '|',
              'numberedList', 'bulletedList', '|',
              'outdent', 'indent', '|',
              'link', 'insertTable', 'blockQuote', '|',
              'undo', 'redo'
            ],
            shouldNotGroupWhenFull: true
          },
          table: {
            contentToolbar: [
              'tableColumn',
              'tableRow',
              'mergeTableCells',
              'tableCellProperties',
              'tableProperties'
            ]
          },
          heading: {
            options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
            ]
          },
          fontSize: {
            options: [9, 11, 12, 14, 16, 18, 20, 24, 30],
            supportAllValues: true
          },
          width: '100%'
        }}
      />
    </div>
  );
}