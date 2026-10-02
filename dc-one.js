// Wraps a TseCore component so a single template child reaches it as one element (for React.Children.only).
// Defined only once TseCore has loaded (the bundle is large and loads slowly on phones).
(function () {
  function define() {
    window.DCOne = function DCOne(props) {
      var R = window.React, rest = {}, k;
      for (k in props) if (k !== 'of' && k !== 'children') rest[k] = props[k];
      var kids = R.Children.toArray(props.children);
      if (props.of === 'TsMFormSection') {
        kids = [R.createElement('div', { key: 'col', style: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 } }, kids)];
      }
      return R.createElement(window.TseCore[props.of], rest, kids.length === 1 ? kids[0] : kids);
    };
  }
  if (window.TseCore && window.React) return define();
  var t = setInterval(function () {
    if (window.TseCore && window.React) { clearInterval(t); define(); }
  }, 50);
})();
