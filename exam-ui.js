/* APEX EXAM UI — stubbed. Replaced by exam-config.js. */
console.log("[apex-exam-ui] stubbed — replaced by exam-config.js");

/* Hide the duplicate exam dropdown in the toolbar — the exam bar is the single source */
(function(){
  var st = document.createElement("style");
  st.textContent = "#syl-exam{display:none!important}";
  document.head.appendChild(st);
})();
