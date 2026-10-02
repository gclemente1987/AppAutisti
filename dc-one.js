// Wraps a TseCore component so a single template child reaches it as one element (for React.Children.only).
(function () {
  window.DCOne = function DCOne(props) {
    var R = window.React, rest = {}, k;
    for (k in props) if (k !== 'of' && k !== 'children') rest[k] = props[k];
    var kids = R.Children.toArray(props.children);
    if (props.of === 'TsMFormSection') {
      kids = [R.createElement('div', { key: 'col', style: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 } }, kids)];
    }
    return R.createElement(window.TseCore[props.of], rest, kids.length === 1 ? kids[0] : kids);
  };
})();
