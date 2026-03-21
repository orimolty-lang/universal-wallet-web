"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9267],{54428:function(e,r,t){t.d(r,{Z:function(){return u}});var n=t(2265);let i=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),a=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,t)=>t?t.toUpperCase():r.toLowerCase()),o=e=>{let r=a(e);return r.charAt(0).toUpperCase()+r.slice(1)},s=function(){for(var e=arguments.length,r=Array(e),t=0;t<e;t++)r[t]=arguments[t];return r.filter((e,r,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===r).join(" ").trim()},l=e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0};var c={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let d=(0,n.forwardRef)((e,r)=>{let{color:t="currentColor",size:i=24,strokeWidth:a=2,absoluteStrokeWidth:o,className:d="",children:u,iconNode:p,...h}=e;return(0,n.createElement)("svg",{ref:r,...c,width:i,height:i,stroke:t,strokeWidth:o?24*Number(a)/Number(i):a,className:s("lucide",d),...!u&&!l(h)&&{"aria-hidden":"true"},...h},[...p.map(e=>{let[r,t]=e;return(0,n.createElement)(r,t)}),...Array.isArray(u)?u:[u]])}),u=(e,r)=>{let t=(0,n.forwardRef)((t,a)=>{let{className:l,...c}=t;return(0,n.createElement)(d,{ref:a,iconNode:r,className:s("lucide-".concat(i(o(e))),"lucide-".concat(e),l),...c})});return t.displayName=o(e),t}},86689:function(e,r,t){t.d(r,{Z:function(){return n}});let n=(0,t(54428).Z)("lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]])},8138:function(e,r,t){t.d(r,{Z:function(){return n}});let n=(0,t(54428).Z)("triangle-alert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]])},79267:function(e,r,t){t.r(r),t.d(r,{ErrorScreen:function(){return f},ErrorScreenView:function(){return g},default:function(){return f}});var n=t(57437),i=t(8138);let a=(0,t(54428).Z)("phone",[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]]);var o=t(86689),s=t(72361),l=t(95349),c=t(86518),d=t(71554),u=t(47685),p=t(89297),h=t(70737);t(2265),t(29155),t(1470),t(97048),t(64131),t(93142);let g=({error:e,allowlistConfig:r,onRetry:t,onCaptchaReset:s,onBack:l})=>{let u=((e,r)=>{if(e instanceof p.R)return{title:"Transaction failed",detail:(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("span",{children:e.message}),(0,n.jsxs)("span",{children:[" ","Check the"," ",(0,n.jsx)(v,{href:e.relayLink,target:"_blank",children:"refund status"}),"."]})]}),ctaText:"Try again",icon:i.Z};if(e instanceof d.a)switch(e.privyErrorCode){case d.b.CLIENT_REQUEST_TIMEOUT:return{title:"Timed out",detail:e.message,ctaText:"Try again",icon:i.Z};case d.b.INSUFFICIENT_BALANCE:return{title:"Insufficient balance",detail:e.message,ctaText:"Try again",icon:i.Z};case d.b.TRANSACTION_FAILURE:return{title:"Transaction failure",detail:e.message,ctaText:"Try again",icon:i.Z};default:return{title:"Something went wrong",detail:"Try again later",ctaText:"Try again",icon:i.Z}}else{if(e instanceof c.P&&"twilio_verification_failed"===e.type)return{title:"Something went wrong",detail:e.message,ctaText:"Try again",icon:a};if(!(e instanceof d.c))return e instanceof d.e&&e.status&&[400,422].includes(e.status)?{title:"Something went wrong",detail:e.message,ctaText:"Try again",icon:i.Z}:{title:"Something went wrong",detail:"Try again later",ctaText:"Try again",icon:i.Z};switch(e.privyErrorCode){case d.b.INVALID_CAPTCHA:return{title:"Something went wrong",detail:"Please try again.",ctaText:"Try again",icon:i.Z};case d.b.DISALLOWED_LOGIN_METHOD:return{title:"Not allowed",detail:e.message,ctaText:"Try another method",icon:i.Z};case d.b.ALLOWLIST_REJECTED:return{title:r.errorTitle||"You don't have access to this app",detail:r.errorDetail||"Have you been invited?",ctaText:r.errorCtaText||"Try another account",icon:o.Z};case d.b.CAPTCHA_FAILURE:return{title:"Something went wrong",detail:"You did not pass CAPTCHA. Please try again.",ctaText:"Try again",icon:null};case d.b.CAPTCHA_TIMEOUT:return{title:"Something went wrong",detail:"Something went wrong! Please try again later.",ctaText:"Try again",icon:null};case d.b.LINKED_TO_ANOTHER_USER:return{title:"Authentication failed",detail:"This account has already been linked to another user.",ctaText:"Try again",icon:i.Z};case d.b.NOT_SUPPORTED:return{title:"This region is not supported",detail:"SMS authentication from this region is not available",ctaText:"Try another method",icon:i.Z};case d.b.TOO_MANY_REQUESTS:return{title:"Request failed",detail:"Too many attempts.",ctaText:"Try again later",icon:i.Z};default:return{title:"Something went wrong",detail:"Try again later",ctaText:"Try again",icon:i.Z}}}})(e,r);return(0,n.jsx)(h.S,{title:u.title,subtitle:u.detail,icon:u.icon,onBack:l,iconVariant:"error",primaryCta:{label:u.ctaText,onClick:()=>{e instanceof d.c&&(e.privyErrorCode===d.b.INVALID_CAPTCHA&&s?.(),e.privyErrorCode===d.b.ALLOWLIST_REJECTED&&r.errorCtaLink)?window.location.href=r.errorCtaLink:t?.()},variant:"error"},watermark:!0})},f={component:()=>{let{navigate:e,data:r,lastScreen:t,currentScreen:i}=(0,u.a)(),a=(0,l.u)(),{reset:o}=(0,c.a)(),s=r?.errorModalData?.previousScreen||(t===i?void 0:t);return(0,n.jsx)(g,{error:r?.errorModalData?.error||Error(),allowlistConfig:a.allowlistConfig,onRetry:()=>{e(s||"LandingScreen",!1)},onCaptchaReset:o})}},v=s.zo.a`
  color: var(--privy-color-accent) !important;
  font-weight: 600;
`},74822:function(e,r,t){t.d(r,{S:function(){return T}});var n=t(57437),i=t(2265),a=t(72361),o=t(27574),s=t(4357),l=t(20278);let c=a.zo.div`
  /* spacing tokens */
  --screen-space: 16px; /* base 1x = 16 */
  --screen-space-lg: calc(var(--screen-space) * 1.5); /* 24px */

  position: relative;
  overflow: hidden;
  margin: 0 calc(-1 * var(--screen-space)); /* extends over modal padding */
  height: 100%;
  border-radius: var(--privy-border-radius-lg);
`,d=a.zo.div`
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) * 1.5);
  width: 100%;
  background: var(--privy-color-background);
  padding: 0 var(--screen-space-lg) var(--screen-space);
  height: 100%;
  border-radius: var(--privy-border-radius-lg);
`,u=a.zo.div`
  position: relative;
  display: flex;
  flex-direction: column;
`,p=(0,a.zo)(s.M)`
  margin: 0 -8px;
`,h=a.zo.div`
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
`,g=a.zo.div`
  display: flex;
  flex-direction: column;
  gap: var(--screen-space-lg);
  margin-top: 1.5rem;
`,f=a.zo.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--screen-space);
`,v=a.zo.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`,x=a.zo.h3`
  && {
    font-size: 20px;
    line-height: 32px;
    font-weight: 500;
    color: var(--privy-color-foreground);
    margin: 0;
  }
`,y=a.zo.p`
  && {
    margin: 0;
    font-size: 16px;
    font-weight: 300;
    line-height: 24px;
    color: var(--privy-color-foreground);
  }
`,m=a.zo.div`
  background: ${({$variant:e})=>{switch(e){case"success":return"var(--privy-color-success-bg, #EAFCEF)";case"warning":return"var(--privy-color-warn, #FEF3C7)";case"error":return"var(--privy-color-error-bg, #FEE2E2)";case"loading":case"logo":return"transparent";default:return"var(--privy-color-background-2)"}}};

  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
`,b=a.zo.div`
  display: flex;
  align-items: center;
  justify-content: center;

  img,
  svg {
    max-height: 90px;
    max-width: 180px;
  }
`,w=a.zo.div`
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
`,T=({children:e,...r})=>(0,n.jsx)(c,{children:(0,n.jsx)(d,{...r,children:e})}),k=a.zo.div`
  position: absolute;
  top: 0;
  left: calc(-1 * var(--screen-space-lg));
  width: calc(100% + calc(var(--screen-space-lg) * 2));
  height: 4px;
  background: var(--privy-color-background-2);
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  overflow: hidden;
`,j=(0,a.zo)(s.B)`
  padding: 0;
  && a {
    padding: 0;
    color: var(--privy-color-foreground-3);
  }
`,E=a.zo.div`
  height: 100%;
  width: ${({pct:e})=>e}%;
  background: var(--privy-color-foreground-3);
  border-radius: 2px;
  transition: width 300ms ease-in-out;
`,C=({step:e})=>e?(0,n.jsx)(k,{children:(0,n.jsx)(E,{pct:Math.min(100,e.current/e.total*100)})}):null;T.Header=({title:e,subtitle:r,icon:t,iconVariant:i,iconLoadingStatus:a,showBack:o,onBack:s,showInfo:l,onInfo:c,showClose:d,onClose:h,step:g,headerTitle:m,...b})=>(0,n.jsxs)(u,{...b,children:[(0,n.jsx)(p,{backFn:o?s:void 0,infoFn:l?c:void 0,onClose:d?h:void 0,title:m,closeable:d}),(t||i||e||r)&&(0,n.jsxs)(f,{children:[t||i?(0,n.jsx)(T.Icon,{icon:t,variant:i,loadingStatus:a}):null,!(!e&&!r)&&(0,n.jsxs)(v,{children:[e&&(0,n.jsx)(x,{children:e}),r&&(0,n.jsx)(y,{children:r})]})]}),g&&(0,n.jsx)(C,{step:g})]}),(T.Body=i.forwardRef(({children:e,...r},t)=>(0,n.jsx)(h,{ref:t,...r,children:e}))).displayName="Screen.Body",T.Footer=({children:e,...r})=>(0,n.jsx)(g,{id:"privy-content-footer-container",...r,children:e}),T.Actions=({children:e,...r})=>(0,n.jsx)(S,{...r,children:e}),T.HelpText=({children:e,...r})=>(0,n.jsx)(z,{...r,children:e}),T.FooterText=({children:e,...r})=>(0,n.jsx)(A,{...r,children:e}),T.Watermark=()=>(0,n.jsx)(j,{}),T.Icon=({icon:e,variant:r="subtle",loadingStatus:t})=>"logo"===r&&e?(0,n.jsx)(b,"string"==typeof e?{children:(0,n.jsx)("img",{src:e,alt:""})}:i.isValidElement(e)?{children:e}:{children:i.createElement(e)}):"loading"===r?e?(0,n.jsx)(w,{children:(0,n.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[(0,n.jsx)(o.N,{success:t?.success,fail:t?.fail}),"string"==typeof e?(0,n.jsx)("span",{style:{background:`url('${e}') 0 0 / contain`,height:"38px",width:"38px",borderRadius:"6px",margin:"auto",backgroundSize:"contain"}}):i.isValidElement(e)?i.cloneElement(e,{style:{width:"38px",height:"38px"}}):i.createElement(e,{style:{width:"38px",height:"38px"}})]})}):(0,n.jsx)(m,{$variant:r,children:(0,n.jsx)(l.N,{size:"64px"})}):(0,n.jsx)(m,{$variant:r,children:e&&("string"==typeof e?(0,n.jsx)("img",{src:e,alt:"",style:{width:"32px",height:"32px",borderRadius:"6px"}}):i.isValidElement(e)?e:i.createElement(e,{width:32,height:32,stroke:(()=>{switch(r){case"success":return"var(--privy-color-icon-success)";case"warning":return"var(--privy-color-icon-warning)";case"error":return"var(--privy-color-icon-error)";default:return"var(--privy-color-icon-muted)"}})(),strokeWidth:2}))});let S=a.zo.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) / 2);
`,z=a.zo.div`
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
`,A=a.zo.div`
  && {
    margin-top: -1rem;
    width: 100%;
    text-align: center;
    color: var(--privy-color-foreground-2);
    font-size: 0.6875rem; // 11px
    line-height: 1rem; // 16px
  }
`},70737:function(e,r,t){t.d(r,{S:function(){return o}});var n=t(57437),i=t(4357),a=t(74822);let o=({primaryCta:e,secondaryCta:r,helpText:t,footerText:o,watermark:s=!0,children:l,...c})=>{let d=e||r?(0,n.jsxs)(n.Fragment,{children:[e&&(()=>{let{label:r,...t}=e,a=t.variant||"primary";return(0,n.jsx)(i.a,{...t,variant:a,style:{width:"100%",...t.style},children:r})})(),r&&(()=>{let{label:e,...t}=r,a=t.variant||"secondary";return(0,n.jsx)(i.a,{...t,variant:a,style:{width:"100%",...t.style},children:e})})()]}):null;return(0,n.jsxs)(a.S,{id:c.id,className:c.className,children:[(0,n.jsx)(a.S.Header,{...c}),l?(0,n.jsx)(a.S.Body,{children:l}):null,t||d||s?(0,n.jsxs)(a.S.Footer,{children:[t?(0,n.jsx)(a.S.HelpText,{children:t}):null,d?(0,n.jsx)(a.S.Actions,{children:d}):null,s?(0,n.jsx)(a.S.Watermark,{}):null]}):null,o?(0,n.jsx)(a.S.FooterText,{children:o}):null]})}},20278:function(e,r,t){t.d(r,{N:function(){return a}});var n=t(57437),i=t(72361);let a=({size:e,centerIcon:r})=>(0,n.jsx)(o,{$size:e,children:(0,n.jsxs)(s,{children:[(0,n.jsx)(c,{}),(0,n.jsx)(d,{}),r?(0,n.jsx)(l,{children:r}):null]})}),o=i.zo.div`
  --spinner-size: ${e=>e.$size?e.$size:"96px"};

  display: inline-flex;
  justify-content: center;
  align-items: center;

  @media all and (display-mode: standalone) {
    margin-bottom: 30px;
  }
`,s=i.zo.div`
  position: relative;
  height: var(--spinner-size);
  width: var(--spinner-size);

  opacity: 1;
  animation: fadein 200ms ease;
`,l=i.zo.div`
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
`,c=i.zo.div`
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
`,d=i.zo.div`
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
`},89297:function(e,r,t){t.d(r,{R:function(){return v},a:function(){return o},b:function(){return a},c:function(){return h},d:function(){return s},g:function(){return p},t:function(){return c},u:function(){return f}});var n=t(2265),i=t(71554);let a=792703809,o="11111111111111111111111111111111",s="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",l="0x0000000000000000000000000000000000000000",c=({appId:e,originCurrency:r,destinationCurrency:t,...n})=>({tradeType:"EXPECTED_OUTPUT",originCurrency:r??l,destinationCurrency:t??l,referrer:`privy|${e}`,...n}),d="https://api.relay.link",u="https://api.testnets.relay.link",p=async({input:e,isTestnet:r})=>{let t=await fetch((r?u:d)+"/quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),n=await t.json();if(!(t.ok||"string"==typeof n.message&&n.message.startsWith("Invalid address")))throw console.error("Relay error:",n),Error(n.message??"Error fetching quote from relay");return n},h=e=>{let r=e.steps[0]?.items?.[0];if(r)return{from:r.data.from,to:r.data.to,value:Number(r.data.value),chainId:Number(r.data.chainId),data:r.data.data}};async function g({transactionHash:e,isTestnet:r}){let t=await fetch((r?u:d)+"/requests/v2?hash="+e),n=await t.json();if(!t.ok){if("message"in n&&"string"==typeof n.message)throw Error(n.message);throw Error("Error fetching request from relay")}return n.requests.at(0)?.status??"pending"}function f({transactionHash:e,isTestnet:r,bridgingStatus:t,setBridgingStatus:i,onSuccess:a,onFailure:o}){(0,n.useEffect)(()=>{if(e&&t){if(["delayed","waiting","pending"].includes(t)){let t=setInterval(async()=>{try{let t=await g({transactionHash:e,isTestnet:r});i(t)}catch(e){console.error(e)}},1e3);return()=>clearInterval(t)}"success"===t?a({transactionHash:e}):["refund","failure"].includes(t)&&o({error:new v(e,r)})}},[t,e,r])}class v extends i.a{constructor(e,r){super("We were unable to complete the bridging transaction. Funds will be refunded on your wallet.",void 0,i.b.TRANSACTION_FAILURE),this.relayLink=r?`https://testnets.relay.link/transaction/${e}`:`https://relay.link/transaction/${e}`}}}}]);