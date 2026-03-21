"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6372],{54428:function(e,r,t){t.d(r,{Z:function(){return p}});var i=t(2265);let n=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),o=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,t)=>t?t.toUpperCase():r.toLowerCase()),a=e=>{let r=o(e);return r.charAt(0).toUpperCase()+r.slice(1)},l=function(){for(var e=arguments.length,r=Array(e),t=0;t<e;t++)r[t]=arguments[t];return r.filter((e,r,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===r).join(" ").trim()},s=e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0};var c={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let d=(0,i.forwardRef)((e,r)=>{let{color:t="currentColor",size:n=24,strokeWidth:o=2,absoluteStrokeWidth:a,className:d="",children:p,iconNode:u,...h}=e;return(0,i.createElement)("svg",{ref:r,...c,width:n,height:n,stroke:t,strokeWidth:a?24*Number(o)/Number(n):o,className:l("lucide",d),...!p&&!s(h)&&{"aria-hidden":"true"},...h},[...u.map(e=>{let[r,t]=e;return(0,i.createElement)(r,t)}),...Array.isArray(p)?p:[p]])}),p=(e,r)=>{let t=(0,i.forwardRef)((t,o)=>{let{className:s,...c}=t;return(0,i.createElement)(d,{ref:o,iconNode:r,className:l("lucide-".concat(n(a(e))),"lucide-".concat(e),s),...c})});return t.displayName=a(e),t}},42196:function(e,r,t){t.d(r,{Z:function(){return i}});let i=(0,t(54428).Z)("check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},64796:function(e,r,t){t.d(r,{Z:function(){return i}});let i=(0,t(54428).Z)("copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},47842:function(e,r,t){var i=t(2265);let n=i.forwardRef(function(e,r){let{title:t,titleId:n,...o}=e;return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":n},o),t?i.createElement("title",{id:n},t):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"}))});r.Z=n},49605:function(e,r,t){t.d(r,{A:function(){return d}});var i=t(57437),n=t(42196),o=t(64796),a=t(2265),l=t(72361),s=t(7718),c=t(4357);let d=({address:e,showCopyIcon:r,url:t,className:l})=>{let[d,g]=(0,a.useState)(!1);function f(r){r.stopPropagation(),navigator.clipboard.writeText(e).then(()=>g(!0)).catch(console.error)}return(0,a.useEffect)(()=>{if(d){let e=setTimeout(()=>g(!1),3e3);return()=>clearTimeout(e)}},[d]),(0,i.jsxs)(p,t?{children:[(0,i.jsx)(h,{title:e,className:l,href:`${t}/address/${e}`,target:"_blank",children:(0,s.v)(e)}),r&&(0,i.jsx)(c.S,{onClick:f,size:"sm",style:{gap:"0.375rem"},children:(0,i.jsxs)(i.Fragment,d?{children:["Copied",(0,i.jsx)(n.Z,{size:16})]}:{children:["Copy",(0,i.jsx)(o.Z,{size:16})]})})]}:{children:[(0,i.jsx)(u,{title:e,className:l,children:(0,s.v)(e)}),r&&(0,i.jsx)(c.S,{onClick:f,size:"sm",style:{gap:"0.375rem",fontSize:"14px"},children:(0,i.jsxs)(i.Fragment,d?{children:["Copied",(0,i.jsx)(n.Z,{size:14})]}:{children:["Copy",(0,i.jsx)(o.Z,{size:14})]})})]})},p=l.zo.span`
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
`},26372:function(e,r,t){t.r(r),t.d(r,{EmbeddedWalletKeyExportScreen:function(){return v},EmbeddedWalletKeyExportView:function(){return h},default:function(){return v}});var i=t(57437),n=t(2265),o=t(72361),a=t(30404),l=t(7454),s=t(73480),c=t(95349),d=t(71554),p=t(47685),u=t(70737);t(97048),t(1470),t(29155);let h=({address:e,accessToken:r,appConfigTheme:t,onClose:n,exportButtonProps:o,onBack:a})=>(0,i.jsx)(u.S,{title:"Export wallet",subtitle:(0,i.jsxs)(i.Fragment,{children:["Copy either your private key or seed phrase to export your wallet."," ",(0,i.jsx)("a",{href:"https://privy-io.notion.site/Transferring-your-account-9dab9e16c6034a7ab1ff7fa479b02828",target:"blank",rel:"noopener noreferrer",children:"Learn more"})]}),onClose:n,onBack:a,showBack:!!a,watermark:!0,children:(0,i.jsxs)(g,{children:[(0,i.jsx)(l.W,{theme:t,children:"Never share your private key or seed phrase with anyone."}),(0,i.jsx)(s.W,{title:"Your wallet",address:e,showCopyButton:!0}),(0,i.jsx)("div",{style:{width:"100%"},children:r&&o&&(0,i.jsx)(f,{accessToken:r,dimensions:{height:"44px"},...o})})]})}),g=o.zo.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
`;function f(e){let[r,t]=(0,n.useState)(e.dimensions.width),[o,l]=(0,n.useState)(!1),[s,c]=(0,n.useState)(void 0),d=(0,n.useRef)(null);(0,n.useEffect)(()=>{if(d.current&&void 0===r){let{width:e}=d.current.getBoundingClientRect();t(e)}let e=getComputedStyle(document.documentElement);c({background:e.getPropertyValue("--privy-color-background"),background2:e.getPropertyValue("--privy-color-background-2"),foreground3:e.getPropertyValue("--privy-color-foreground-3"),foregroundAccent:e.getPropertyValue("--privy-color-foreground-accent"),accent:e.getPropertyValue("--privy-color-accent"),accentDark:e.getPropertyValue("--privy-color-accent-dark"),success:e.getPropertyValue("--privy-color-success"),colorScheme:e.getPropertyValue("color-scheme")})},[]);let p="ethereum"===e.chainType&&!e.imported&&!e.isUnifiedWallet;return(0,i.jsx)("div",{ref:d,children:r&&(0,i.jsxs)(x,{children:[(0,i.jsx)("iframe",{style:{position:"absolute",zIndex:1,opacity:o?1:0,transition:"opacity 50ms ease-in-out",pointerEvents:o?"auto":"none"},onLoad:()=>setTimeout(()=>l(!0),1500),width:r,height:e.dimensions.height,allow:"clipboard-write self *",src:(0,a.v)({origin:e.origin,path:`/apps/${e.appId}/embedded-wallets/export`,query:e.isUnifiedWallet?{v:"1-unified",wallet_id:e.walletId,client_id:e.appClientId,width:`${r}px`,caid:e.clientAnalyticsId,phrase_export:p,...s}:{v:"1",entropy_id:e.entropyId,entropy_id_verifier:e.entropyIdVerifier,hd_wallet_index:e.hdWalletIndex,chain_type:e.chainType,client_id:e.appClientId,width:`${r}px`,caid:e.clientAnalyticsId,phrase_export:p,...s},hash:{token:e.accessToken}})}),(0,i.jsx)(m,{children:"Loading..."}),p&&(0,i.jsx)(m,{children:"Loading..."})]})})}let v={component:()=>{let[e,r]=(0,n.useState)(null),{authenticated:t,user:o}=(0,p.u)(),{closePrivyModal:a,createAnalyticsEvent:l,clientAnalyticsId:s,client:u}=(0,d.u)(),g=(0,c.u)(),{data:f,onUserCloseViaDialogOrKeybindRef:v}=(0,p.a)(),{onFailure:x,onSuccess:m,origin:y,appId:b,appClientId:w,entropyId:j,entropyIdVerifier:k,walletId:z,hdWalletIndex:C,chainType:E,address:S,isUnifiedWallet:I,imported:$,showBackButton:T}=f.keyExport,A=e=>{a({shouldCallAuthOnSuccess:!1}),x("string"==typeof e?Error(e):e)},N=()=>{a({shouldCallAuthOnSuccess:!1}),m(),l({eventName:"embedded_wallet_key_export_completed",payload:{walletAddress:S}})};return(0,n.useEffect)(()=>{if(!t)return A("User must be authenticated before exporting their wallet");u.getAccessToken().then(r).catch(A)},[t,o]),v.current=N,(0,i.jsx)(h,{address:S,accessToken:e,appConfigTheme:g.appearance.palette.colorScheme,onClose:N,isLoading:!e,onBack:T?N:void 0,exportButtonProps:e?{origin:y,appId:b,appClientId:w,clientAnalyticsId:s,entropyId:j,entropyIdVerifier:k,walletId:z,hdWalletIndex:C,isUnifiedWallet:I,imported:$,chainType:E}:void 0})}},x=o.zo.div`
  overflow: visible;
  position: relative;
  overflow: none;
  height: 44px;
  display: flex;
  gap: 12px;
`,m=o.zo.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 16px;
  font-weight: 500;
  border-radius: var(--privy-border-radius-md);
  background-color: var(--privy-color-background-2);
  color: var(--privy-color-foreground-3);
`},70547:function(e,r,t){t.d(r,{E:function(){return n}});var i=t(72361);let n=i.zo.span`
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
`},74822:function(e,r,t){t.d(r,{S:function(){return j}});var i=t(57437),n=t(2265),o=t(72361),a=t(27574),l=t(4357),s=t(20278);let c=o.zo.div`
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
`,f=o.zo.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--screen-space);
`,v=o.zo.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`,x=o.zo.h3`
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
`,w=o.zo.div`
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
`,j=({children:e,...r})=>(0,i.jsx)(c,{children:(0,i.jsx)(d,{...r,children:e})}),k=o.zo.div`
  position: absolute;
  top: 0;
  left: calc(-1 * var(--screen-space-lg));
  width: calc(100% + calc(var(--screen-space-lg) * 2));
  height: 4px;
  background: var(--privy-color-background-2);
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  overflow: hidden;
`,z=(0,o.zo)(l.B)`
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
`,E=({step:e})=>e?(0,i.jsx)(k,{children:(0,i.jsx)(C,{pct:Math.min(100,e.current/e.total*100)})}):null;j.Header=({title:e,subtitle:r,icon:t,iconVariant:n,iconLoadingStatus:o,showBack:a,onBack:l,showInfo:s,onInfo:c,showClose:d,onClose:h,step:g,headerTitle:y,...b})=>(0,i.jsxs)(p,{...b,children:[(0,i.jsx)(u,{backFn:a?l:void 0,infoFn:s?c:void 0,onClose:d?h:void 0,title:y,closeable:d}),(t||n||e||r)&&(0,i.jsxs)(f,{children:[t||n?(0,i.jsx)(j.Icon,{icon:t,variant:n,loadingStatus:o}):null,!(!e&&!r)&&(0,i.jsxs)(v,{children:[e&&(0,i.jsx)(x,{children:e}),r&&(0,i.jsx)(m,{children:r})]})]}),g&&(0,i.jsx)(E,{step:g})]}),(j.Body=n.forwardRef(({children:e,...r},t)=>(0,i.jsx)(h,{ref:t,...r,children:e}))).displayName="Screen.Body",j.Footer=({children:e,...r})=>(0,i.jsx)(g,{id:"privy-content-footer-container",...r,children:e}),j.Actions=({children:e,...r})=>(0,i.jsx)(S,{...r,children:e}),j.HelpText=({children:e,...r})=>(0,i.jsx)(I,{...r,children:e}),j.FooterText=({children:e,...r})=>(0,i.jsx)($,{...r,children:e}),j.Watermark=()=>(0,i.jsx)(z,{}),j.Icon=({icon:e,variant:r="subtle",loadingStatus:t})=>"logo"===r&&e?(0,i.jsx)(b,"string"==typeof e?{children:(0,i.jsx)("img",{src:e,alt:""})}:n.isValidElement(e)?{children:e}:{children:n.createElement(e)}):"loading"===r?e?(0,i.jsx)(w,{children:(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[(0,i.jsx)(a.N,{success:t?.success,fail:t?.fail}),"string"==typeof e?(0,i.jsx)("span",{style:{background:`url('${e}') 0 0 / contain`,height:"38px",width:"38px",borderRadius:"6px",margin:"auto",backgroundSize:"contain"}}):n.isValidElement(e)?n.cloneElement(e,{style:{width:"38px",height:"38px"}}):n.createElement(e,{style:{width:"38px",height:"38px"}})]})}):(0,i.jsx)(y,{$variant:r,children:(0,i.jsx)(s.N,{size:"64px"})}):(0,i.jsx)(y,{$variant:r,children:e&&("string"==typeof e?(0,i.jsx)("img",{src:e,alt:"",style:{width:"32px",height:"32px",borderRadius:"6px"}}):n.isValidElement(e)?e:n.createElement(e,{width:32,height:32,stroke:(()=>{switch(r){case"success":return"var(--privy-color-icon-success)";case"warning":return"var(--privy-color-icon-warning)";case"error":return"var(--privy-color-icon-error)";default:return"var(--privy-color-icon-muted)"}})(),strokeWidth:2}))});let S=o.zo.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) / 2);
`,I=o.zo.div`
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
`,$=o.zo.div`
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
`,f=l.zo.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`,v=l.zo.div`
  font-size: 12px;
  line-height: 1rem;
  color: var(--privy-color-foreground-3);
`,x=(0,l.zo)(d.L)`
  text-align: left;
  margin-bottom: 0.5rem;
`,m=(0,l.zo)(c.E)`
  margin-top: 0.25rem;
`,y=(0,l.zo)(s.S)`
  && {
    gap: 0.375rem;
    font-size: 14px;
  }
`,b=({errMsg:e,balance:r,address:t,className:l,title:s,showCopyButton:c=!1})=>{let[d,u]=(0,a.useState)(!1);return(0,a.useEffect)(()=>{if(d){let e=setTimeout(()=>u(!1),3e3);return()=>clearTimeout(e)}},[d]),(0,i.jsxs)("div",{children:[s&&(0,i.jsx)(x,{children:s}),(0,i.jsx)(h,{className:l,$state:e?"error":void 0,children:(0,i.jsxs)(g,{children:[(0,i.jsxs)(f,{children:[(0,i.jsx)(p.A,{address:t,showCopyIcon:!1}),void 0!==r&&(0,i.jsx)(v,{children:r})]}),c&&(0,i.jsx)(y,{onClick:function(e){e.stopPropagation(),navigator.clipboard.writeText(t).then(()=>u(!0)).catch(console.error)},size:"sm",children:(0,i.jsxs)(i.Fragment,d?{children:["Copied",(0,i.jsx)(n.Z,{size:14})]}:{children:["Copy",(0,i.jsx)(o.Z,{size:14})]})})]})}),e&&(0,i.jsx)(m,{children:e})]})}},7454:function(e,r,t){t.d(r,{W:function(){return a}});var i=t(57437),n=t(47842),o=t(72361);let a=({children:e,theme:r,className:t})=>(0,i.jsxs)(l,{$theme:r,className:t,children:[(0,i.jsx)(n.Z,{width:"20px",height:"20px",color:"var(--privy-color-icon-warning)",strokeWidth:2,style:{flexShrink:0}}),(0,i.jsx)(s,{$theme:r,children:e})]}),l=o.zo.div`
  display: flex;
  gap: 0.75rem;
  background-color: var(--privy-color-warn-bg);
  align-items: flex-start;
  padding: 1rem;
  border-radius: 0.75rem;
`,s=o.zo.div`
  color: ${e=>"dark"===e.$theme?"var(--privy-color-foreground-2)":"var(--privy-color-foreground)"};
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  flex: 1;
  text-align: left;
`},20278:function(e,r,t){t.d(r,{N:function(){return o}});var i=t(57437),n=t(72361);let o=({size:e,centerIcon:r})=>(0,i.jsx)(a,{$size:e,children:(0,i.jsxs)(l,{children:[(0,i.jsx)(c,{}),(0,i.jsx)(d,{}),r?(0,i.jsx)(s,{children:r}):null]})}),a=n.zo.div`
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