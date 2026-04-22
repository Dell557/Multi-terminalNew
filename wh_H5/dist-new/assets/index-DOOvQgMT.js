const o=(t,i=300)=>{let e=null;return function(...n){e&&clearTimeout(e),e=setTimeout(()=>{t.apply(this,n)},i)}};export{o as d};
