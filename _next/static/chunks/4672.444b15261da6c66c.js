"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4672],{54428:function(e,r,t){t.d(r,{Z:function(){return p}});var i=t(2265);let n=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),o=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,t)=>t?t.toUpperCase():r.toLowerCase()),a=e=>{let r=o(e);return r.charAt(0).toUpperCase()+r.slice(1)},l=function(){for(var e=arguments.length,r=Array(e),t=0;t<e;t++)r[t]=arguments[t];return r.filter((e,r,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===r).join(" ").trim()},s=e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0};var c={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let d=(0,i.forwardRef)((e,r)=>{let{color:t="currentColor",size:n=24,strokeWidth:o=2,absoluteStrokeWidth:a,className:d="",children:p,iconNode:u,...h}=e;return(0,i.createElement)("svg",{ref:r,...c,width:n,height:n,stroke:t,strokeWidth:a?24*Number(o)/Number(n):o,className:l("lucide",d),...!p&&!s(h)&&{"aria-hidden":"true"},...h},[...u.map(e=>{let[r,t]=e;return(0,i.createElement)(r,t)}),...Array.isArray(p)?p:[p]])}),p=(e,r)=>{let t=(0,i.forwardRef)((t,o)=>{let{className:s,...c}=t;return(0,i.createElement)(d,{ref:o,iconNode:r,className:l("lucide-".concat(n(a(e))),"lucide-".concat(e),s),...c})});return t.displayName=a(e),t}},42196:function(e,r,t){t.d(r,{Z:function(){return i}});let i=(0,t(54428).Z)("check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},91803:function(e,r,t){t.d(r,{Z:function(){return i}});let i=(0,t(54428).Z)("circle-alert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},40702:function(e,r,t){t.d(r,{Z:function(){return i}});let i=(0,t(54428).Z)("circle-check-big",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]])},64796:function(e,r,t){t.d(r,{Z:function(){return i}});let i=(0,t(54428).Z)("copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},49605:function(e,r,t){t.d(r,{A:function(){return d}});var i=t(57437),n=t(42196),o=t(64796),a=t(2265),l=t(72361),s=t(7718),c=t(4357);let d=({address:e,showCopyIcon:r,url:t,className:l})=>{let[d,g]=(0,a.useState)(!1);function x(r){r.stopPropagation(),navigator.clipboard.writeText(e).then(()=>g(!0)).catch(console.error)}return(0,a.useEffect)(()=>{if(d){let e=setTimeout(()=>g(!1),3e3);return()=>clearTimeout(e)}},[d]),(0,i.jsxs)(p,t?{children:[(0,i.jsx)(h,{title:e,className:l,href:`${t}/address/${e}`,target:"_blank",children:(0,s.v)(e)}),r&&(0,i.jsx)(c.S,{onClick:x,size:"sm",style:{gap:"0.375rem"},children:(0,i.jsxs)(i.Fragment,d?{children:["Copied",(0,i.jsx)(n.Z,{size:16})]}:{children:["Copy",(0,i.jsx)(o.Z,{size:16})]})})]}:{children:[(0,i.jsx)(u,{title:e,className:l,children:(0,s.v)(e)}),r&&(0,i.jsx)(c.S,{onClick:x,size:"sm",style:{gap:"0.375rem",fontSize:"14px"},children:(0,i.jsxs)(i.Fragment,d?{children:["Copied",(0,i.jsx)(n.Z,{size:14})]}:{children:["Copy",(0,i.jsx)(o.Z,{size:14})]})})]})},p=l.zo.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`,u=l.zo.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--privy-color-foreground);
`,h=l.zo.a`
  font-size: 14px;
  color: var(--privy-color-foreground);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`},14672:function(e,r,t){t.r(r),t.d(r,{DelegatedActionsConsentScreen:function(){return g},DelegatedActionsConsentScreenView:function(){return h},default:function(){return g}});var i=t(57437),n=t(91803),o=t(40702);let a=(0,t(54428).Z)("cloud-upload",[["path",{d:"M12 13v8",key:"1l5pq0"}],["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"m8 17 4-4 4 4",key:"1quai1"}]]);var l=t(2265),s=t(73480),c=t(95349),d=t(71554),p=t(47685),u=t(70737);t(97048),t(1470),t(29155);let h=({appName:e,address:r,success:t,error:l,onAccept:c,onDecline:d,onClose:p})=>(0,i.jsx)(u.S,t||l?{title:l?"Something went wrong":"Success!",subtitle:l?"Please try again.":`You've successfully granted delegated action permissions to ${e}.`,icon:l?n.Z:o.Z,iconVariant:l?"error":"success",onBack:p,watermark:!0}:{title:"Enable offline access",subtitle:`By confirming, ${e} will be able to use your wallet for you even when you're not around. You can revoke this later.`,icon:a,primaryCta:{label:"Accept",onClick:c},secondaryCta:{label:"Not now",onClick:d},onBack:p,watermark:!0,children:(0,i.jsx)(s.W,{address:r,title:"Wallet"})}),g={component:()=>{let{data:e}=(0,p.a)(),r=(0,c.u)(),{closePrivyModal:t}=(0,d.u)(),[n,o]=(0,l.useState)(!1),[a,s]=(0,l.useState)(),{address:u,onDelegate:g,onSuccess:x,onError:f}=e.delegatedActions.consent,v=async()=>{n?x():f(a??new d.a("User declined delegating actions.")),t({shouldCallAuthOnSuccess:!1})};return(0,l.useEffect)(()=>{if(!n&&!a)return;let e=setTimeout(v,c.r);return()=>clearTimeout(e)},[n,a]),(0,i.jsx)(h,{appName:r.name,address:u,success:n,error:a,onAccept:async()=>{try{await g(),o(!0)}catch(e){s(e)}},onDecline:()=>{v()},onClose:v})}}},70547:function(e,r,t){t.d(r,{E:function(){return n}});var i=t(72361);let n=i.zo.span`
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.125rem; /* 150% */

  color: var(--privy-color-error);
`},28642:function(e,r,t){t.d(r,{L:function(){return n}});var i=t(72361);let n=i.zo.span`
  color: var(--privy-color-foreground-3);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.125rem; /* 150% */
`},74822:function(e,r,t){t.d(r,{S:function(){return w}});var i=t(57437),n=t(2265),o=t(72361),a=t(27574),l=t(4357),s=t(20278);let c=o.zo.div`
  /* spacing tokens */
  --screen-space: 16px; /* base 1x = 16 */
  --screen-space-lg: calc(var(--screen-space) * 1.5); /* 24px */

  position: relative;
  overflow: hidden;
  margin: 0 calc(-1 * var(--screen-space)); /* extends over modal padding */
  height: 100%;
  border-radius: var(--privy-border-radius-lg);
`,d=o.zo.div`
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) * 1.5);
  width: 100%;
  background: var(--privy-color-background);
  padding: 0 var(--screen-space-lg) var(--screen-space);
  height: 100%;
  border-radius: var(--privy-border-radius-lg);
`,p=o.zo.div`
  position: relative;
  display: flex;
  flex-direction: column;
`,u=(0,o.zo)(l.M)`
  margin: 0 -8px;
`,h=o.zo.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;

  /* Enable scrolling */
  overflow-y: auto;

  /* Hide scrollbar but keep functionality when scrollable */
  /* Add padding for focus outline space, offset with negative margin */
  padding: 3px;
  margin: -3px;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-gutter: stable both-edges;
  scrollbar-width: none;
  -ms-overflow-style: none;

  /* Gradient effect for scroll indication */
  ${({$colorScheme:e})=>"light"===e?"background: linear-gradient(var(--privy-color-background), var(--privy-color-background) 70%) bottom, linear-gradient(rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0.06)) bottom;":"dark"===e?"background: linear-gradient(var(--privy-color-background), var(--privy-color-background) 70%) bottom, linear-gradient(rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.06)) bottom;":void 0}

  background-repeat: no-repeat;
  background-size:
    100% 32px,
    100% 16px;
  background-attachment: local, scroll;
`,g=o.zo.div`
  display: flex;
  flex-direction: column;
  gap: var(--screen-space-lg);
  margin-top: 1.5rem;
`,x=o.zo.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--screen-space);
`,f=o.zo.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`,v=o.zo.h3`
  && {
    font-size: 20px;
    line-height: 32px;
    font-weight: 500;
    color: var(--privy-color-foreground);
    margin: 0;
  }
`,m=o.zo.p`
  && {
    margin: 0;
    font-size: 16px;
    font-weight: 300;
    line-height: 24px;
    color: var(--privy-color-foreground);
  }
`,y=o.zo.div`
  background: ${({$variant:e})=>{switch(e){case"success":return"var(--privy-color-success-bg, #EAFCEF)";case"warning":return"var(--privy-color-warn, #FEF3C7)";case"error":return"var(--privy-color-error-bg, #FEE2E2)";case"loading":case"logo":return"transparent";default:return"var(--privy-color-background-2)"}}};

  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
`,b=o.zo.div`
  display: flex;
  align-items: center;
  justify-content: center;

  img,
  svg {
    max-height: 90px;
    max-width: 180px;
  }
`,j=o.zo.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 82px;

  > div {
    position: relative;
  }

  > div > :first-child {
    position: relative;
  }

  > div > :last-child {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
`,w=({children:e,...r})=>(0,i.jsx)(c,{children:(0,i.jsx)(d,{...r,children:e})}),z=o.zo.div`
  position: absolute;
  top: 0;
  left: calc(-1 * var(--screen-space-lg));
  width: calc(100% + calc(var(--screen-space-lg) * 2));
  height: 4px;
  background: var(--privy-color-background-2);
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  overflow: hidden;
`,k=(0,o.zo)(l.B)`
  padding: 0;
  && a {
    padding: 0;
    color: var(--privy-color-foreground-3);
  }
`,C=o.zo.div`
  height: 100%;
  width: ${({pct:e})=>e}%;
  background: var(--privy-color-foreground-3);
  border-radius: 2px;
  transition: width 300ms ease-in-out;
`,S=({step:e})=>e?(0,i.jsx)(z,{children:(0,i.jsx)(C,{pct:Math.min(100,e.current/e.total*100)})}):null;w.Header=({title:e,subtitle:r,icon:t,iconVariant:n,iconLoadingStatus:o,showBack:a,onBack:l,showInfo:s,onInfo:c,showClose:d,onClose:h,step:g,headerTitle:y,...b})=>(0,i.jsxs)(p,{...b,children:[(0,i.jsx)(u,{backFn:a?l:void 0,infoFn:s?c:void 0,onClose:d?h:void 0,title:y,closeable:d}),(t||n||e||r)&&(0,i.jsxs)(x,{children:[t||n?(0,i.jsx)(w.Icon,{icon:t,variant:n,loadingStatus:o}):null,!(!e&&!r)&&(0,i.jsxs)(f,{children:[e&&(0,i.jsx)(v,{children:e}),r&&(0,i.jsx)(m,{children:r})]})]}),g&&(0,i.jsx)(S,{step:g})]}),(w.Body=n.forwardRef(({children:e,...r},t)=>(0,i.jsx)(h,{ref:t,...r,children:e}))).displayName="Screen.Body",w.Footer=({children:e,...r})=>(0,i.jsx)(g,{id:"privy-content-footer-container",...r,children:e}),w.Actions=({children:e,...r})=>(0,i.jsx)(E,{...r,children:e}),w.HelpText=({children:e,...r})=>(0,i.jsx)($,{...r,children:e}),w.FooterText=({children:e,...r})=>(0,i.jsx)(A,{...r,children:e}),w.Watermark=()=>(0,i.jsx)(k,{}),w.Icon=({icon:e,variant:r="subtle",loadingStatus:t})=>"logo"===r&&e?(0,i.jsx)(b,"string"==typeof e?{children:(0,i.jsx)("img",{src:e,alt:""})}:n.isValidElement(e)?{children:e}:{children:n.createElement(e)}):"loading"===r?e?(0,i.jsx)(j,{children:(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[(0,i.jsx)(a.N,{success:t?.success,fail:t?.fail}),"string"==typeof e?(0,i.jsx)("span",{style:{background:`url('${e}') 0 0 / contain`,height:"38px",width:"38px",borderRadius:"6px",margin:"auto",backgroundSize:"contain"}}):n.isValidElement(e)?n.cloneElement(e,{style:{width:"38px",height:"38px"}}):n.createElement(e,{style:{width:"38px",height:"38px"}})]})}):(0,i.jsx)(y,{$variant:r,children:(0,i.jsx)(s.N,{size:"64px"})}):(0,i.jsx)(y,{$variant:r,children:e&&("string"==typeof e?(0,i.jsx)("img",{src:e,alt:"",style:{width:"32px",height:"32px",borderRadius:"6px"}}):n.isValidElement(e)?e:n.createElement(e,{width:32,height:32,stroke:(()=>{switch(r){case"success":return"var(--privy-color-icon-success)";case"warning":return"var(--privy-color-icon-warning)";case"error":return"var(--privy-color-icon-error)";default:return"var(--privy-color-icon-muted)"}})(),strokeWidth:2}))});let E=o.zo.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) / 2);
`,$=o.zo.div`
  && {
    margin: 0;
    width: 100%;
    text-align: center;
    color: var(--privy-color-foreground-2);
    font-size: 13px;
    line-height: 20px;

    & a {
      text-decoration: underline;
    }
  }
`,A=o.zo.div`
  && {
    margin-top: -1rem;
    width: 100%;
    text-align: center;
    color: var(--privy-color-foreground-2);
    font-size: 0.6875rem; // 11px
    line-height: 1rem; // 16px
  }
`},70737:function(e,r,t){t.d(r,{S:function(){return a}});var i=t(57437),n=t(4357),o=t(74822);let a=({primaryCta:e,secondaryCta:r,helpText:t,footerText:a,watermark:l=!0,children:s,...c})=>{let d=e||r?(0,i.jsxs)(i.Fragment,{children:[e&&(()=>{let{label:r,...t}=e,o=t.variant||"primary";return(0,i.jsx)(n.a,{...t,variant:o,style:{width:"100%",...t.style},children:r})})(),r&&(()=>{let{label:e,...t}=r,o=t.variant||"secondary";return(0,i.jsx)(n.a,{...t,variant:o,style:{width:"100%",...t.style},children:e})})()]}):null;return(0,i.jsxs)(o.S,{id:c.id,className:c.className,children:[(0,i.jsx)(o.S.Header,{...c}),s?(0,i.jsx)(o.S.Body,{children:s}):null,t||d||l?(0,i.jsxs)(o.S.Footer,{children:[t?(0,i.jsx)(o.S.HelpText,{children:t}):null,d?(0,i.jsx)(o.S.Actions,{children:d}):null,l?(0,i.jsx)(o.S.Watermark,{}):null]}):null,a?(0,i.jsx)(o.S.FooterText,{children:a}):null]})}},73480:function(e,r,t){t.d(r,{W:function(){return b}});var i=t(57437),n=t(42196),o=t(64796),a=t(2265),l=t(72361),s=t(4357),c=t(70547),d=t(28642),p=t(49605),u=t(41618);let h=(0,l.zo)(u.B)`
  && {
    padding: 0.75rem;
    height: 56px;
  }
`,g=l.zo.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`,x=l.zo.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`,f=l.zo.div`
  font-size: 12px;
  line-height: 1rem;
  color: var(--privy-color-foreground-3);
`,v=(0,l.zo)(d.L)`
  text-align: left;
  margin-bottom: 0.5rem;
`,m=(0,l.zo)(c.E)`
  margin-top: 0.25rem;
`,y=(0,l.zo)(s.S)`
  && {
    gap: 0.375rem;
    font-size: 14px;
  }
`,b=({errMsg:e,balance:r,address:t,className:l,title:s,showCopyButton:c=!1})=>{let[d,u]=(0,a.useState)(!1);return(0,a.useEffect)(()=>{if(d){let e=setTimeout(()=>u(!1),3e3);return()=>clearTimeout(e)}},[d]),(0,i.jsxs)("div",{children:[s&&(0,i.jsx)(v,{children:s}),(0,i.jsx)(h,{className:l,$state:e?"error":void 0,children:(0,i.jsxs)(g,{children:[(0,i.jsxs)(x,{children:[(0,i.jsx)(p.A,{address:t,showCopyIcon:!1}),void 0!==r&&(0,i.jsx)(f,{children:r})]}),c&&(0,i.jsx)(y,{onClick:function(e){e.stopPropagation(),navigator.clipboard.writeText(t).then(()=>u(!0)).catch(console.error)},size:"sm",children:(0,i.jsxs)(i.Fragment,d?{children:["Copied",(0,i.jsx)(n.Z,{size:14})]}:{children:["Copy",(0,i.jsx)(o.Z,{size:14})]})})]})}),e&&(0,i.jsx)(m,{children:e})]})}},20278:function(e,r,t){t.d(r,{N:function(){return o}});var i=t(57437),n=t(72361);let o=({size:e,centerIcon:r})=>(0,i.jsx)(a,{$size:e,children:(0,i.jsxs)(l,{children:[(0,i.jsx)(c,{}),(0,i.jsx)(d,{}),r?(0,i.jsx)(s,{children:r}):null]})}),a=n.zo.div`
  --spinner-size: ${e=>e.$size?e.$size:"96px"};

  display: inline-flex;
  justify-content: center;
  align-items: center;

  @media all and (display-mode: standalone) {
    margin-bottom: 30px;
  }
`,l=n.zo.div`
  position: relative;
  height: var(--spinner-size);
  width: var(--spinner-size);

  opacity: 1;
  animation: fadein 200ms ease;
`,s=n.zo.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  svg,
  img {
    width: calc(var(--spinner-size) * 0.4);
    height: calc(var(--spinner-size) * 0.4);
    border-radius: var(--privy-border-radius-full);
  }
`,c=n.zo.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: var(--spinner-size);
  height: var(--spinner-size);

  && {
    border: 4px solid var(--privy-color-border-default);
    border-radius: 50%;
  }
`,d=n.zo.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: var(--spinner-size);
  height: var(--spinner-size);
  animation: spin 1200ms linear infinite;

  && {
    border: 4px solid;
    border-color: var(--privy-color-icon-subtle) transparent transparent transparent;
    border-radius: 50%;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`},41618:function(e,r,t){t.d(r,{B:function(){return o},a:function(){return n}});var i=t(72361);let n=(0,i.iv)`
  && {
    border-width: 1px;
    padding: 0.5rem 1rem;
  }

  width: 100%;
  text-align: left;
  border: solid 1px var(--privy-color-foreground-4);
  border-radius: var(--privy-border-radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;

  ${e=>"error"===e.$state?"\n        border-color: var(--privy-color-error);\n        background: var(--privy-color-error-bg);\n      ":""}
`,o=i.zo.div`
  ${n}
`}}]);