// ...existing code...

const addHighlight = (from, to, color, annotationId) => {
  if (!viewRef.current) return;
  const { state, dispatch } = viewRef.current;

  const docLength = state.doc.content.size;
  const safeFrom = Math.max(0, Math.min(from, docLength));
  const safeTo = Math.max(safeFrom, Math.min(to, docLength));

  const decoration = Decoration.inline(safeFrom, safeTo, {
    style: `
      background-color: ${color};
      border-radius: 3px;
      padding: 2px 1px;
      transition: background-color 0.2s ease;
    `,
  }, { annotationId });

  decorationsRef.current = decorationsRef.current.add(state.doc, [decoration]);
  dispatch(state.tr.setMeta(pluginKey, { type: 'addHighlight' }));
};

// ...existing code...
