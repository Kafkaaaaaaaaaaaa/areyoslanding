(function(){
  'use strict';
  var d=document,root=d.documentElement,$=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
  var nav=$('#nav'),prog=$('#prog'),last=0;
  function onScroll(){
    var y=window.scrollY||0,h=root.scrollHeight-window.innerHeight;
    if(nav){nav.classList.toggle('is-scrolled',y>8);nav.classList.toggle('is-hidden',y>last&&y>400);}
    last=y;
    var art=$('#prose');
    if(prog){var p=0;
      if(art){var r=art.getBoundingClientRect(),t=r.height-window.innerHeight*.5;p=Math.min(1,Math.max(0,(-r.top+window.innerHeight*.2)/Math.max(t,1)));}
      else p=h>0?y/h:0;
      prog.style.transform='scaleX('+p+')';}
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  /* reveal */
  var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if('IntersectionObserver' in window&&!rm){
    root.classList.add('b-js');
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}})},{rootMargin:'0px 0px -8% 0px'});
    $$('.b-card,.b-feature,.b-key,.b-note,.b-calc,.b-table').forEach(function(el){el.classList.add('b-rev');io.observe(el);});
    setTimeout(function(){$$('.b-rev').forEach(function(el){el.classList.add('is-in')})},3500);
  }
  /* filter + search */
  var grid=$('#grid');
  if(grid){
    var cards=$$('.b-card',grid),chips=$$('.b-chip[data-f]'),q=$('#q'),empty=$('#empty'),cat='All';
    function apply(){
      var s=(q.value||'').trim().toLowerCase(),n=0;
      cards.forEach(function(c){var ok=(cat==='All'||c.dataset.cat===cat)&&(!s||c.dataset.text.indexOf(s)>-1);c.hidden=!ok;if(ok)n++;});
      empty.hidden=n>0;
    }
    chips.forEach(function(b){b.addEventListener('click',function(){cat=b.dataset.f;chips.forEach(function(x){var on=x===b;x.classList.toggle('is-on',on);x.setAttribute('aria-pressed',on)});apply();});});
    q.addEventListener('input',apply);
  }
  /* toc */
  var prose=$('#prose'),toc=$('#toc');
  if(prose&&toc){
    var hs=$$('h2',prose).filter(function(h){return !h.closest('.b-key')});
    hs.forEach(function(h,i){h.id=h.id||('s'+(i+1));var li=d.createElement('li'),a=d.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;li.appendChild(a);toc.appendChild(li);});
    var links=$$('a',toc);
    function spy(){var cur=0;hs.forEach(function(h,i){if(h.getBoundingClientRect().top<140)cur=i;});links.forEach(function(a,i){a.classList.toggle('is-on',i===cur)});}
    window.addEventListener('scroll',spy,{passive:true});spy();
  }
  var cp=$('#copy');
  if(cp)cp.addEventListener('click',function(){var u=location.href;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){cp.textContent='Copied'},function(){cp.textContent='Press Ctrl+C'});setTimeout(function(){cp.textContent='Copy link'},2000);});
  /* calculator */
  var cv=$('#c-v');
  if(cv){
    var ids=['c-v','c-s','c-m','c-h'].map(function(i){return $('#'+i)});
    function fmt(n){return new Intl.NumberFormat('en-IN').format(Math.round(n))}
    function calc(){
      var v=+ids[0].value||0,s=Math.min(100,Math.max(0,+ids[1].value||0))/100,m=+ids[2].value||0,h=+ids[3].value||0;
      var hrs=v*s*m*30/60;
      $('#o-hrs').textContent=fmt(hrs);$('#o-inr').textContent='₹'+fmt(hrs*h);
    }
    ids.forEach(function(i){i.addEventListener('input',calc)});calc();
  }
})();
