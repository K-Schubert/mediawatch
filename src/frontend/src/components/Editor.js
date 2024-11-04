import React, { useEffect, useImperativeHandle, useRef, useMemo } from 'react';
import { EditorState } from 'prosemirror-state';
import { DOMParser as ProseMirrorDOMParser, Schema } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, PluginKey } from 'prosemirror-state';
import 'prosemirror-view/style/prosemirror.css'; // Basic editor styling

const Editor = React.forwardRef(({ initialContent = '', onTextSelect }, ref) => {
  const editorContainerRef = useRef(null);
  const viewRef = useRef(null);
  const decorationsRef = useRef(DecorationSet.empty);

  const schema = useMemo(() => new Schema({
    nodes: {
      doc: { content: 'paragraph+' },
      paragraph: {
        content: 'text*',
        toDOM: () => ['p', 0],
        parseDOM: [{ tag: 'p' }],
      },
      text: { inline: true },
    },
    marks: {
      highlight: {
        toDOM: (mark) => ['span', { style: `background-color: ${mark.attrs.color}` }, 0],
        parseDOM: [
          {
            tag: 'span[style]',
            getAttrs: (dom) => {
              const style = dom.getAttribute('style') || '';
              const match = /background-color:\s*(#[0-9a-fA-F]{3,6}|\w+)/.exec(style);
              return match ? { color: match[1] } : false;
            },
          },
        ],
        attrs: { color: {} },
      },
    },
  }), []);

  useImperativeHandle(ref, () => ({
    addHighlight,
    removeHighlight,
    setContent,
  }));

  useEffect(() => {
    if (!editorContainerRef.current) return;

    // Create a document node from the initial content
    const contentElement = document.createElement('div');
    contentElement.textContent = initialContent; // Populate with initial content
    const doc = ProseMirrorDOMParser.fromSchema(schema).parse(contentElement);

    viewRef.current = new EditorView(editorContainerRef.current, {
      state: EditorState.create({
        doc,
        plugins: [
          createDecorationPlugin(),
        ],
      }),
      dispatchTransaction: (transaction) => {
        const newState = viewRef.current.state.apply(transaction);
        viewRef.current.updateState(newState);
      },
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [schema, initialContent]);

  const createDecorationPlugin = () => {
    return new Plugin({
      key: new PluginKey('decorations'),
      state: {
        init: () => decorationsRef.current || DecorationSet.empty,
        apply: (tr, set) => {
          if (!set) return DecorationSet.empty;
          return set.map(tr.mapping, tr.doc);
        },
      },
      props: {
        decorations: (state) => decorationsRef.current || DecorationSet.empty,
      },
    });
  };

  const handleSelection = () => {
    if (!viewRef.current) return;

    const { state } = viewRef.current;
    const { from, to } = state.selection;

    if (from !== to) {
      const selectedText = state.doc.textBetween(from, to, ' ');
      onTextSelect({ from, to, text: selectedText });
    }
  };

  const addHighlight = (from, to, color, annotationId) => {
    if (!viewRef.current) return;
    const { state, dispatch } = viewRef.current;

    const decoration = Decoration.inline(from, to, {
      style: `background-color: ${color};`,
    }, { annotationId });

    decorationsRef.current = decorationsRef.current.add(state.doc, [decoration]);
    const tr = state.tr.setMeta(new PluginKey('decorations'), null);
    dispatch(tr);
  };

  const removeHighlight = (annotationId) => {
    if (!viewRef.current) return;
    const { state, dispatch } = viewRef.current;

    const newDecorations = decorationsRef.current.find().filter(deco => deco.spec.annotationId !== annotationId);
    decorationsRef.current = DecorationSet.create(state.doc, newDecorations);
    const tr = state.tr.setMeta(new PluginKey('decorations'), null);
    dispatch(tr);
  };

  const setContent = (newContent) => {
    if (!viewRef.current) return;
    const { state, dispatch } = viewRef.current;

    // Parse the new content
    const contentElement = document.createElement('div');
    contentElement.textContent = newContent;
    const doc = ProseMirrorDOMParser.fromSchema(schema).parse(contentElement);

    // Create a transaction to replace the document
    const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content);
    dispatch(tr);

    // Clear any existing decorations (highlights)
    decorationsRef.current = DecorationSet.empty;
  };

  return (
    <div
      ref={editorContainerRef}
      onMouseUp={handleSelection}
      style={{
        border: '1px solid #ccc',
        padding: '10px',
        minHeight: '300px',
        maxHeight: '500px',
        overflowY: 'auto',
      }}
    />
  );
});

export default Editor;
