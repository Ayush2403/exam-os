/* ============================================================
   APEX NO-PILL-CHURN — stop the 60fps pill rebuild loop
   - Intercept .apex-cfg-pri removal: hide instead of remove
   - Intercept .apex-cfg-pri append: if content matches, restore hidden node
   - Net effect: repaintPills produces zero childList mutations when
     content is unchanged, so exam-config's observer goes idle.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexNoPillChurn) return;
  window._apexNoPillChurn = true;

  var cache = new Map(); /* parent -> { node, content } */

  var _origRemove = Element.prototype.remove;
  Element.prototype.remove = function(){
    if (this.classList && this.classList.contains('apex-cfg-pri') && this.parentNode) {
      var content = this.textContent + '|' + this.style.background + '|' + this.style.color;
      cache.set(this.parentNode, { node: this, content: content });
      this.dataset.apexHidden = '1';
      this.style.display = 'none';
      return;
    }
    return _origRemove.apply(this, arguments);
  };

  var _origAppend = Node.prototype.appendChild;
  Node.prototype.appendChild = function(child){
    if (child && child.classList && child.classList.contains('apex-cfg-pri')) {
      var content = child.textContent + '|' + child.style.background + '|' + child.style.color;
      var hit = cache.get(this);
      if (hit && hit.content === content) {
        /* Same content — unhide the old node, drop the new one */
        if (hit.node.dataset.apexHidden === '1') {
          hit.node.style.display = '';
          delete hit.node.dataset.apexHidden;
        }
        cache.delete(this);
        return hit.node;
      }
      /* Content changed — actually remove the stale hidden pill, then append */
      if (hit && hit.node.parentNode === this) {
        _origRemove.call(hit.node);
      }
      cache.delete(this);
    }
    return _origAppend.apply(this, arguments);
  };

  /* Cleanup: if a parent is removed from the DOM, drop its cache entry */
  var _origRemove2 = Element.prototype.remove;
  /* (already wrapped above, this is a no-op reference for clarity) */

  console.log('[apex-nopillchurn] installed');
})();
