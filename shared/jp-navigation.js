/* CECP-JP-NAVIGATION-BEGIN
   与 youth / musictool / musiclib 同步。此块在编辑器 srcdoc 中，禁止反斜杠及反引号。
   反复圆点不参与导航记号的中心计算；上方记号为经过它的连音线留出空间。 */
function jpNoteArcTop(atom){
  var box=atom.getBoundingClientRect();
  if(!atom.querySelector('.jp-navmark'))return box.top;
  var top=Infinity,scale=atom.offsetWidth?box.width/atom.offsetWidth:1;
  [].forEach.call(atom.querySelectorAll('.jp-num,.jp-plain-sym,.jp-dot-top > span'),function(note){var r=note.getBoundingClientRect();if(r.height)top=Math.min(top,r.top);});
  return top===Infinity?box.top:top-4*(scale||1);
}
function jpResetNavigation(scope){
  if(!scope)return;
  [].forEach.call(scope.querySelectorAll('[data-jp-nav],.jp-navmark'),function(el){
    var mark=el.classList.contains('jp-navmark')?el:el.querySelector('.jp-bar-top,.jp-bar-bot');
    if(!mark)return;
    mark.style.transform='';mark.style.paddingBottom='';
    if(el.hasAttribute('data-jp-nav')){
      mark=el.querySelector(el.getAttribute('data-jp-nav-above')==='1'?'.jp-bar-top':'.jp-bar-bot');
      if(mark){mark.style.transform='';mark.style.paddingBottom='';if(el.getAttribute('data-jp-nav-above')==='1')mark.style.height=el.getAttribute('data-jp-nav-base-height')||'22px';}
    }
  });
  [].forEach.call(scope.querySelectorAll('.jp-slur,.jp-slur-open,.jp-slur-close'),function(group){group.style.removeProperty('--jp-nav-arc-top');});
}
function jpPrepareLegacyNavigation(scope){
  if(!scope)return;
  [].forEach.call(scope.querySelectorAll('.jp-slur,.jp-slur-open,.jp-slur-close'),function(group){
    if(!group.querySelector('[data-jp-nav],.jp-navmark'))return;
    var gr=group.getBoundingClientRect(),scale=group.offsetWidth?gr.width/group.offsetWidth:1;
    if(!gr.width||!scale)return;
    var noteTop=Infinity;
    [].forEach.call(group.querySelectorAll('.jp-num,.jp-dot-top:not(:empty)'),function(note){var r=note.getBoundingClientRect();if(r.height)noteTop=Math.min(noteTop,r.top);});
    if(noteTop===Infinity)return;
    var ps=getComputedStyle(group,'::before');
    var height=parseFloat(ps.height)||8;
    var layer=Math.max(0,(parseFloat(getComputedStyle(group).paddingTop)||12)-12);
    group.style.setProperty('--jp-nav-arc-top',((noteTop-gr.top)/scale-height-3-layer).toFixed(3)+'px');
  });
}
function jpLayoutNavigation(scope){
  if(!scope)return false;
  var changed=false;
  [].forEach.call(scope.querySelectorAll('[data-jp-nav],.jp-navmark'),function(el){
    var attached=el.classList.contains('jp-navmark');
    var above=attached||el.getAttribute('data-jp-nav-above')==='1';
    var mark=attached?el:el.querySelector(above?'.jp-bar-top':'.jp-bar-bot');
    if(!mark)return;
    var paint=mark.querySelector('svg')||mark,mr=paint.getBoundingClientRect();
    if(!mr.width||!mr.height)return;
    var natural=parseFloat(getComputedStyle(paint).height)||paint.offsetHeight;
    var scale=natural?mr.height/natural:1;if(!scale||!isFinite(scale))scale=1;
    if(!attached){
      var strokes=[].slice.call(el.querySelectorAll('.jp-bar-stroke'));
      if(strokes.length){
        var left=Infinity,right=-Infinity;
        strokes.forEach(function(stroke){var r=stroke.getBoundingClientRect();left=Math.min(left,r.left);right=Math.max(right,r.right);});
        mark.style.transform='translateX('+(((left+right-mr.left-mr.right)/2)/scale).toFixed(3)+'px)';
        mr=paint.getBoundingClientRect();
      }
    }
    if(!above)return;
    var row=el.closest('.prev-row')||el.closest('.sw-lrow')||el.closest('.p-notes');if(!row)return;
    var ceiling=Infinity;
    [].forEach.call(row.querySelectorAll('.strict-arc-svg > div,.strict-arc-svg path,.strict-arc-tup text'),function(arc){
      var r=arc.getBoundingClientRect();
      if(r.width&&r.height&&r.left<mr.right&&r.right>mr.left)ceiling=Math.min(ceiling,r.top);
    });
    [].forEach.call(row.querySelectorAll('.jp-slur,.jp-slur-open,.jp-slur-close,.jp-tie'),function(group){
      var gr=group.getBoundingClientRect(),gs=group.offsetWidth?gr.width/group.offsetWidth:scale;
      var ps=getComputedStyle(group,'::before'),top=parseFloat(ps.top),left=parseFloat(ps.left)||0,right=parseFloat(ps.right)||0;
      if(String(ps.left).indexOf('%')>=0)left=group.offsetWidth*left/100;
      if(String(ps.right).indexOf('%')>=0)right=group.offsetWidth*right/100;
      var width=parseFloat(ps.width)||0;
      var arcRight=group.classList.contains('jp-tie')?gr.left+(left+width)*gs:gr.right-right*gs;
      if((gr.width||width)&&isFinite(top)&&gr.left+left*gs<mr.right&&arcRight>mr.left)ceiling=Math.min(ceiling,gr.top+top*gs);
    });
    if(ceiling===Infinity)return;
    var lift=Math.max(0,(mr.bottom-ceiling)/scale+4);
    if(lift<0.25)return;
    mark.style.paddingBottom=lift.toFixed(3)+'px';
    if(!attached){mark.style.boxSizing='border-box';mark.style.height=((parseFloat(getComputedStyle(mark).height)||22)+lift).toFixed(3)+'px';}
    changed=true;
  });
  return changed;
}
var jpBaseLayoutArcs=layoutStrictArcs;
layoutStrictArcs=function(row){jpResetNavigation(row);jpBaseLayoutArcs(row);jpPrepareLegacyNavigation(row);if(jpLayoutNavigation(row)){jpBaseLayoutArcs(row);jpPrepareLegacyNavigation(row);}};
var jpBaseLayoutArcsAll=layoutStrictArcsAll;
layoutStrictArcsAll=function(scope){jpResetNavigation(scope);jpBaseLayoutArcsAll(scope);jpPrepareLegacyNavigation(scope);if(jpLayoutNavigation(scope)){jpBaseLayoutArcsAll(scope);jpPrepareLegacyNavigation(scope);}};
var jpBaseLayoutNoteArcs=layoutJpArcs;
layoutJpArcs=function(lane){jpResetNavigation(lane);jpBaseLayoutNoteArcs(lane);jpPrepareLegacyNavigation(lane);if(jpLayoutNavigation(lane)){jpBaseLayoutNoteArcs(lane);jpPrepareLegacyNavigation(lane);}};
/* CECP-JP-NAVIGATION-END */
