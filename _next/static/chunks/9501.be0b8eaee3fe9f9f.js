"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9501],{54428:function(e,r,t){t.d(r,{Z:function(){return p}});var i=t(2265);let o=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),n=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,t)=>t?t.toUpperCase():r.toLowerCase()),a=e=>{let r=n(e);return r.charAt(0).toUpperCase()+r.slice(1)},l=function(){for(var e=arguments.length,r=Array(e),t=0;t<e;t++)r[t]=arguments[t];return r.filter((e,r,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===r).join(" ").trim()},s=e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0};var c={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let d=(0,i.forwardRef)((e,r)=>{let{color:t="currentColor",size:o=24,strokeWidth:n=2,absoluteStrokeWidth:a,className:d="",children:p,iconNode:u,...h}=e;return(0,i.createElement)("svg",{ref:r,...c,width:o,height:o,stroke:t,strokeWidth:a?24*Number(n)/Number(o):n,className:l("lucide",d),...!p&&!s(h)&&{"aria-hidden":"true"},...h},[...u.map(e=>{let[r,t]=e;return(0,i.createElement)(r,t)}),...Array.isArray(p)?p:[p]])}),p=(e,r)=>{let t=(0,i.forwardRef)((t,n)=>{let{className:s,...c}=t;return(0,i.createElement)(d,{ref:n,iconNode:r,className:l("lucide-".concat(o(a(e))),"lucide-".concat(e),s),...c})});return t.displayName=a(e),t}},42196:function(e,r,t){t.d(r,{Z:function(){return i}});let i=(0,t(54428).Z)("check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},64796:function(e,r,t){t.d(r,{Z:function(){return i}});let i=(0,t(54428).Z)("copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},47842:function(e,r,t){var i=t(2265);let o=i.forwardRef(function(e,r){let{title:t,titleId:o,...n}=e;return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":o},n),t?i.createElement("title",{id:o},t):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"}))});r.Z=o},87333:function(e,r,t){t.d(r,{A:function(){return d}});var i=t(57437),o=t(42196),n=t(64796),a=t(2265),l=t(99379),s=t(58314),c=t(15383);let d=({address:e,showCopyIcon:r,url:t,className:l})=>{let[d,g]=(0,a.useState)(!1);function f(r){r.stopPropagation(),navigator.clipboard.writeText(e).then(()=>g(!0)).catch(console.error)}return(0,a.useEffect)(()=>{if(d){let e=setTimeout(()=>g(!1),3e3);return()=>clearTimeout(e)}},[d]),(0,i.jsxs)(p,t?{children:[(0,i.jsx)(h,{title:e,className:l,href:`${t}/address/${e}`,target:"_blank",children:(0,s.v)(e)}),r&&(0,i.jsx)(c.S,{onClick:f,size:"sm",style:{gap:"0.375rem"},children:(0,i.jsxs)(i.Fragment,d?{children:["Copied",(0,i.jsx)(o.Z,{size:16})]}:{children:["Copy",(0,i.jsx)(n.Z,{size:16})]})})]}:{children:[(0,i.jsx)(u,{title:e,className:l,children:(0,s.v)(e)}),r&&(0,i.jsx)(c.S,{onClick:f,size:"sm",style:{gap:"0.375rem",fontSize:"14px"},children:(0,i.jsxs)(i.Fragment,d?{children:["Copied",(0,i.jsx)(o.Z,{size:14})]}:{children:["Copy",(0,i.jsx)(n.Z,{size:14})]})})]})},p=l.zo.span`
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
`},49501:function(e,r,t){t.r(r),t.d(r,{EmbeddedWalletKeyExportScreen:function(){return m},EmbeddedWalletKeyExportView:function(){return h},default:function(){return m}});var i=t(57437),o=t(2265),n=t(99379),a=t(30404),l=t(7454),s=t(21914),c=t(72172),d=t(71554),p=t(4696),u=t(7612);t(97048),t(87336),t(29155);let h=({address:e,accessToken:r,appConfigTheme:t,onClose:o,isLoading:n=!1,exportButtonProps:a,onBack:c})=>(0,i.jsx)(u.S,{title:"Export wallet",subtitle:(0,i.jsxs)(i.Fragment,{children:["Copy either your private key or seed phrase to export your wallet."," ",(0,i.jsx)("a",{href:"https://privy-io.notion.site/Transferring-your-account-9dab9e16c6034a7ab1ff7fa479b02828",target:"blank",rel:"noopener noreferrer",children:"Learn more"})]}),onClose:o,onBack:c,showBack:!!c,watermark:!0,children:(0,i.jsxs)(g,{children:[(0,i.jsx)(l.W,{theme:t,children:"Never share your private key or seed phrase with anyone."}),(0,i.jsx)(s.W,{title:"Your wallet",address:e,showCopyButton:!0}),(0,i.jsx)("div",{style:{width:"100%"},children:n?(0,i.jsx)(f,{}):r&&a&&(0,i.jsx)(y,{accessToken:r,dimensions:{height:"44px"},...a})})]})}),g=n.zo.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
`,f=()=>(0,i.jsx)(x,{children:(0,i.jsx)(v,{children:"Loading..."})}),x=n.zo.div`
  display: flex;
  gap: 12px;
  height: 44px;
`,v=n.zo.div`
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
`;function y(e){let[r,t]=(0,o.useState)(e.dimensions.width),[n,l]=(0,o.useState)(void 0),s=(0,o.useRef)(null);(0,o.useEffect)(()=>{if(s.current&&void 0===r){let{width:e}=s.current.getBoundingClientRect();t(e)}let e=getComputedStyle(document.documentElement);l({background:e.getPropertyValue("--privy-color-background"),background2:e.getPropertyValue("--privy-color-background-2"),foreground3:e.getPropertyValue("--privy-color-foreground-3"),foregroundAccent:e.getPropertyValue("--privy-color-foreground-accent"),accent:e.getPropertyValue("--privy-color-accent"),accentDark:e.getPropertyValue("--privy-color-accent-dark"),success:e.getPropertyValue("--privy-color-success"),colorScheme:e.getPropertyValue("color-scheme")})},[]);let c="ethereum"===e.chainType&&!e.imported&&!e.isUnifiedWallet;return(0,i.jsx)("div",{ref:s,children:r&&(0,i.jsxs)(b,{children:[(0,i.jsx)("iframe",{style:{position:"absolute",zIndex:1},width:r,height:e.dimensions.height,allow:"clipboard-write self *",src:(0,a.v)({origin:e.origin,path:`/apps/${e.appId}/embedded-wallets/export`,query:e.isUnifiedWallet?{v:"1-unified",wallet_id:e.walletId,client_id:e.appClientId,width:`${r}px`,caid:e.clientAnalyticsId,phrase_export:c,...n}:{v:"1",entropy_id:e.entropyId,entropy_id_verifier:e.entropyIdVerifier,hd_wallet_index:e.hdWalletIndex,chain_type:e.chainType,client_id:e.appClientId,width:`${r}px`,caid:e.clientAnalyticsId,phrase_export:c,...n},hash:{token:e.accessToken}})}),(0,i.jsx)(w,{children:"Loading..."}),c&&(0,i.jsx)(w,{children:"Loading..."})]})})}let m={component:()=>{let[e,r]=(0,o.useState)(null),{authenticated:t,user:n}=(0,p.u)(),{closePrivyModal:a,createAnalyticsEvent:l,clientAnalyticsId:s,client:u}=(0,d.u)(),g=(0,c.u)(),{data:f,onUserCloseViaDialogOrKeybindRef:x}=(0,p.a)(),{onFailure:v,onSuccess:y,origin:m,appId:b,appClientId:w,entropyId:j,entropyIdVerifier:z,walletId:k,hdWalletIndex:C,chainType:E,address:S,isUnifiedWallet:I,imported:$,showBackButton:T}=f.keyExport,A=e=>{a({shouldCallAuthOnSuccess:!1}),v("string"==typeof e?Error(e):e)},N=()=>{a({shouldCallAuthOnSuccess:!1}),y(),l({eventName:"embedded_wallet_key_export_completed",payload:{walletAddress:S}})};return(0,o.useEffect)(()=>{if(!t)return A("User must be authenticated before exporting their wallet");u.getAccessToken().then(r).catch(A)},[t,n]),x.current=N,(0,i.jsx)(h,{address:S,accessToken:e,appConfigTheme:g.appearance.palette.colorScheme,onClose:N,isLoading:!e,onBack:T?N:void 0,exportButtonProps:e?{origin:m,appId:b,appClientId:w,clientAnalyticsId:s,entropyId:j,entropyIdVerifier:z,walletId:k,hdWalletIndex:C,isUnifiedWallet:I,imported:$,chainType:E}:void 0})}},b=n.zo.div`
  overflow: visible;
  position: relative;
  overflow: none;
  height: 44px;
  display: flex;
  gap: 12px;
`,w=n.zo.div`
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
`},70547:function(e,r,t){t.d(r,{E:function(){return o}});var i=t(99379);let o=i.zo.span`
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.125rem; /* 150% */

  color: var(--privy-color-error);
`},28642:function(e,r,t){t.d(r,{L:function(){return o}});var i=t(99379);let o=i.zo.span`
  color: var(--privy-color-foreground-3);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.125rem; /* 150% */
`},74522:function(e,r,t){t.d(r,{S:function(){return j}});var i=t(57437),o=t(2265),n=t(99379),a=t(50640),l=t(15383),s=t(20278);let c=n.zo.div`
  /* spacing tokens */
  --screen-space: 16px; /* base 1x = 16 */
  --screen-space-lg: calc(var(--screen-space) * 1.5); /* 24px */

  position: relative;
  overflow: hidden;
  margin: 0 calc(-1 * var(--screen-space)); /* extends over modal padding */
  height: 100%;
  border-radius: var(--privy-border-radius-lg);
`,d=n.zo.div`
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) * 1.5);
  width: 100%;
  background: var(--privy-color-background);
  padding: 0 var(--screen-space-lg) var(--screen-space);
  height: 100%;
  border-radius: var(--privy-border-radius-lg);
`,p=n.zo.div`
  position: relative;
  display: flex;
  flex-direction: column;
`,u=(0,n.zo)(l.M)`
  margin: 0 -8px;
`,h=n.zo.div`
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
`,g=n.zo.div`
  display: flex;
  flex-direction: column;
  gap: var(--screen-space-lg);
  margin-top: 1.5rem;
`,f=n.zo.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--screen-space);
`,x=n.zo.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`,v=n.zo.h3`
  && {
    font-size: 20px;
    line-height: 32px;
    font-weight: 500;
    color: var(--privy-color-foreground);
    margin: 0;
  }
`,y=n.zo.p`
  && {
    margin: 0;
    font-size: 16px;
    font-weight: 300;
    line-height: 24px;
    color: var(--privy-color-foreground);
  }
`,m=n.zo.div`
  background: ${({$variant:e})=>{switch(e){case"success":return"var(--privy-color-success-bg, #EAFCEF)";case"warning":return"var(--privy-color-warn, #FEF3C7)";case"error":return"var(--privy-color-error-bg, #FEE2E2)";case"loading":case"logo":return"transparent";default:return"var(--privy-color-background-2)"}}};

  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
`,b=n.zo.div`
  display: flex;
  align-items: center;
  justify-content: center;

  img,
  svg {
    max-height: 90px;
    max-width: 180px;
  }
`,w=n.zo.div`
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
`,j=({children:e,...r})=>(0,i.jsx)(c,{children:(0,i.jsx)(d,{...r,children:e})}),z=n.zo.div`
  position: absolute;
  top: 0;
  left: calc(-1 * var(--screen-space-lg));
  width: calc(100% + calc(var(--screen-space-lg) * 2));
  height: 4px;
  background: var(--privy-color-background-2);
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  overflow: hidden;
`,k=(0,n.zo)(l.B)`
  padding: 0;
  && a {
    padding: 0;
    color: var(--privy-color-foreground-3);
  }
`,C=n.zo.div`
  height: 100%;
  width: ${({pct:e})=>e}%;
  background: var(--privy-color-foreground-3);
  border-radius: 2px;
  transition: width 300ms ease-in-out;
`,E=({step:e})=>e?(0,i.jsx)(z,{children:(0,i.jsx)(C,{pct:Math.min(100,e.current/e.total*100)})}):null;j.Header=({title:e,subtitle:r,icon:t,iconVariant:o,iconLoadingStatus:n,showBack:a,onBack:l,showInfo:s,onInfo:c,showClose:d,onClose:h,step:g,headerTitle:m,...b})=>(0,i.jsxs)(p,{...b,children:[(0,i.jsx)(u,{backFn:a?l:void 0,infoFn:s?c:void 0,onClose:d?h:void 0,title:m,closeable:d}),(t||o||e||r)&&(0,i.jsxs)(f,{children:[t||o?(0,i.jsx)(j.Icon,{icon:t,variant:o,loadingStatus:n}):null,!(!e&&!r)&&(0,i.jsxs)(x,{children:[e&&(0,i.jsx)(v,{children:e}),r&&(0,i.jsx)(y,{children:r})]})]}),g&&(0,i.jsx)(E,{step:g})]}),(j.Body=o.forwardRef(({children:e,...r},t)=>(0,i.jsx)(h,{ref:t,...r,children:e}))).displayName="Screen.Body",j.Footer=({children:e,...r})=>(0,i.jsx)(g,{id:"privy-content-footer-container",...r,children:e}),j.Actions=({children:e,...r})=>(0,i.jsx)(S,{...r,children:e}),j.HelpText=({children:e,...r})=>(0,i.jsx)(I,{...r,children:e}),j.FooterText=({children:e,...r})=>(0,i.jsx)($,{...r,children:e}),j.Watermark=()=>(0,i.jsx)(k,{}),j.Icon=({icon:e,variant:r="subtle",loadingStatus:t})=>"logo"===r&&e?(0,i.jsx)(b,"string"==typeof e?{children:(0,i.jsx)("img",{src:e,alt:""})}:o.isValidElement(e)?{children:e}:{children:o.createElement(e)}):"loading"===r?e?(0,i.jsx)(w,{children:(0,i.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[(0,i.jsx)(a.N,{success:t?.success,fail:t?.fail}),"string"==typeof e?(0,i.jsx)("span",{style:{background:`url('${e}') 0 0 / contain`,height:"38px",width:"38px",borderRadius:"6px",margin:"auto",backgroundSize:"contain"}}):o.isValidElement(e)?o.cloneElement(e,{style:{width:"38px",height:"38px"}}):o.createElement(e,{style:{width:"38px",height:"38px"}})]})}):(0,i.jsx)(m,{$variant:r,children:(0,i.jsx)(s.N,{size:"64px"})}):(0,i.jsx)(m,{$variant:r,children:e&&("string"==typeof e?(0,i.jsx)("img",{src:e,alt:"",style:{width:"32px",height:"32px",borderRadius:"6px"}}):o.isValidElement(e)?e:o.createElement(e,{width:32,height:32,stroke:(()=>{switch(r){case"success":return"var(--privy-color-icon-success)";case"warning":return"var(--privy-color-icon-warning)";case"error":return"var(--privy-color-icon-error)";default:return"var(--privy-color-icon-muted)"}})(),strokeWidth:2}))});let S=n.zo.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) / 2);
`,I=n.zo.div`
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
`,$=n.zo.div`
  && {
    margin-top: -1rem;
    width: 100%;
    text-align: center;
    color: var(--privy-color-foreground-2);
    font-size: 0.6875rem; // 11px
    line-height: 1rem; // 16px
  }
`},7612:function(e,r,t){t.d(r,{S:function(){return a}});var i=t(57437),o=t(15383),n=t(74522);let a=({primaryCta:e,secondaryCta:r,helpText:t,footerText:a,watermark:l=!0,children:s,...c})=>{let d=e||r?(0,i.jsxs)(i.Fragment,{children:[e&&(()=>{let{label:r,...t}=e,n=t.variant||"primary";return(0,i.jsx)(o.a,{...t,variant:n,style:{width:"100%",...t.style},children:r})})(),r&&(()=>{let{label:e,...t}=r,n=t.variant||"secondary";return(0,i.jsx)(o.a,{...t,variant:n,style:{width:"100%",...t.style},children:e})})()]}):null;return(0,i.jsxs)(n.S,{id:c.id,className:c.className,children:[(0,i.jsx)(n.S.Header,{...c}),s?(0,i.jsx)(n.S.Body,{children:s}):null,t||d||l?(0,i.jsxs)(n.S.Footer,{children:[t?(0,i.jsx)(n.S.HelpText,{children:t}):null,d?(0,i.jsx)(n.S.Actions,{children:d}):null,l?(0,i.jsx)(n.S.Watermark,{}):null]}):null,a?(0,i.jsx)(n.S.FooterText,{children:a}):null]})}},21914:function(e,r,t){t.d(r,{W:function(){return b}});var i=t(57437),o=t(42196),n=t(64796),a=t(2265),l=t(99379),s=t(15383),c=t(70547),d=t(28642),p=t(87333),u=t(41618);let h=(0,l.zo)(u.B)`
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
`,x=l.zo.div`
  font-size: 12px;
  line-height: 1rem;
  color: var(--privy-color-foreground-3);
`,v=(0,l.zo)(d.L)`
  text-align: left;
  margin-bottom: 0.5rem;
`,y=(0,l.zo)(c.E)`
  margin-top: 0.25rem;
`,m=(0,l.zo)(s.S)`
  && {
    gap: 0.375rem;
    font-size: 14px;
  }
`,b=({errMsg:e,balance:r,address:t,className:l,title:s,showCopyButton:c=!1})=>{let[d,u]=(0,a.useState)(!1);return(0,a.useEffect)(()=>{if(d){let e=setTimeout(()=>u(!1),3e3);return()=>clearTimeout(e)}},[d]),(0,i.jsxs)("div",{children:[s&&(0,i.jsx)(v,{children:s}),(0,i.jsx)(h,{className:l,$state:e?"error":void 0,children:(0,i.jsxs)(g,{children:[(0,i.jsxs)(f,{children:[(0,i.jsx)(p.A,{address:t,showCopyIcon:!1}),void 0!==r&&(0,i.jsx)(x,{children:r})]}),c&&(0,i.jsx)(m,{onClick:function(e){e.stopPropagation(),navigator.clipboard.writeText(t).then(()=>u(!0)).catch(console.error)},size:"sm",children:(0,i.jsxs)(i.Fragment,d?{children:["Copied",(0,i.jsx)(o.Z,{size:14})]}:{children:["Copy",(0,i.jsx)(n.Z,{size:14})]})})]})}),e&&(0,i.jsx)(y,{children:e})]})}},7454:function(e,r,t){t.d(r,{W:function(){return a}});var i=t(57437),o=t(47842),n=t(99379);let a=({children:e,theme:r,className:t})=>(0,i.jsxs)(l,{$theme:r,className:t,children:[(0,i.jsx)(o.Z,{width:"20px",height:"20px",color:"var(--privy-color-icon-warning)",strokeWidth:2,style:{flexShrink:0}}),(0,i.jsx)(s,{$theme:r,children:e})]}),l=n.zo.div`
  display: flex;
  gap: 0.75rem;
  background-color: var(--privy-color-warn-bg);
  align-items: flex-start;
  padding: 1rem;
  border-radius: 0.75rem;
`,s=n.zo.div`
  color: ${e=>"dark"===e.$theme?"var(--privy-color-foreground-2)":"var(--privy-color-foreground)"};
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  flex: 1;
  text-align: left;
`},20278:function(e,r,t){t.d(r,{N:function(){return n}});var i=t(57437),o=t(99379);let n=({size:e,centerIcon:r})=>(0,i.jsx)(a,{$size:e,children:(0,i.jsxs)(l,{children:[(0,i.jsx)(c,{}),(0,i.jsx)(d,{}),r?(0,i.jsx)(s,{children:r}):null]})}),a=o.zo.div`
  --spinner-size: ${e=>e.$size?e.$size:"96px"};

  display: inline-flex;
  justify-content: center;
  align-items: center;

  @media all and (display-mode: standalone) {
    margin-bottom: 30px;
  }
`,l=o.zo.div`
  position: relative;
  height: var(--spinner-size);
  width: var(--spinner-size);

  opacity: 1;
  animation: fadein 200ms ease;
`,s=o.zo.div`
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
`,c=o.zo.div`
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
`,d=o.zo.div`
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
`},41618:function(e,r,t){t.d(r,{B:function(){return n},a:function(){return o}});var i=t(99379);let o=(0,i.iv)`
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
`,n=i.zo.div`
  ${o}
`}}]);