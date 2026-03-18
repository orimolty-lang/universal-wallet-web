"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4808],{54428:function(e,r,i){i.d(r,{Z:function(){return p}});var t=i(2265);let o=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),n=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,i)=>i?i.toUpperCase():r.toLowerCase()),a=e=>{let r=n(e);return r.charAt(0).toUpperCase()+r.slice(1)},l=function(){for(var e=arguments.length,r=Array(e),i=0;i<e;i++)r[i]=arguments[i];return r.filter((e,r,i)=>!!e&&""!==e.trim()&&i.indexOf(e)===r).join(" ").trim()},d=e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0};var s={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let c=(0,t.forwardRef)((e,r)=>{let{color:i="currentColor",size:o=24,strokeWidth:n=2,absoluteStrokeWidth:a,className:c="",children:p,iconNode:u,...h}=e;return(0,t.createElement)("svg",{ref:r,...s,width:o,height:o,stroke:i,strokeWidth:a?24*Number(n)/Number(o):n,className:l("lucide",c),...!p&&!d(h)&&{"aria-hidden":"true"},...h},[...u.map(e=>{let[r,i]=e;return(0,t.createElement)(r,i)}),...Array.isArray(p)?p:[p]])}),p=(e,r)=>{let i=(0,t.forwardRef)((i,n)=>{let{className:d,...s}=i;return(0,t.createElement)(c,{ref:n,iconNode:r,className:l("lucide-".concat(o(a(e))),"lucide-".concat(e),d),...s})});return i.displayName=a(e),i}},75097:function(e,r,i){i.d(r,{Z:function(){return t}});let t=(0,i(54428).Z)("mail",[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]])},89399:function(e,r,i){var t=i(2265);let o=t.forwardRef(function(e,r){let{title:i,titleId:o,...n}=e;return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":o},n),i?t.createElement("title",{id:o},i):null,t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"}))});r.Z=o},14364:function(e,r,i){i.d(r,{E:function(){return a},I:function(){return d},a:function(){return l}});var t=i(72361),o=i(70547);let n=t.zo.label`
  display: block;
  position: relative;
  width: 100%;
  height: 56px;

  && > :first-child {
    position: absolute;
    left: 0.75em;
    top: 50%;
    transform: translate(0, -50%);
  }

  && > input {
    font-size: 16px;
    line-height: 24px;
    color: var(--privy-color-foreground);

    padding: 12px 88px 12px 52px;
    flex-grow: 1;
    background: var(--privy-color-background);
    border: 1px solid
      ${({$error:e})=>e?"var(--privy-color-error) !important":"var(--privy-color-foreground-4)"};
    border-radius: var(--privy-border-radius-md);
    width: 100%;
    height: 100%;

    /* Tablet and Up */
    @media (min-width: 441px) {
      font-size: 14px;
      padding-right: 78px;
    }

    :focus {
      outline: none;
      border-color: ${({$error:e})=>e?"var(--privy-color-error) !important":"var(--privy-color-accent-light)"};
      box-shadow: ${({$error:e})=>e?"none":"0 0 0 1px var(--privy-color-accent-light)"};
    }

    :autofill,
    :-webkit-autofill {
      background: var(--privy-color-background);
    }

    && > input::placeholder {
      color: var(--privy-color-foreground-3);
    }
    &:disabled {
      opacity: 0.4; /* Make it visually appear disabled */
      cursor: not-allowed; /* Change cursor to not-allowed */
    }
    &:disabled,
    &:disabled:hover,
    &:disabled > span {
      color: var(--privy-color-foreground-3); /* Change text color to grey */
    }
  }

  && > button:last-child {
    right: 0px;
    line-height: 24px;
    padding: 13px 17px;
    :focus {
      outline: none;
    }
    &:disabled {
      opacity: 0.4; /* Make it visually appear disabled */
      cursor: not-allowed; /* Change cursor to not-allowed */
    }
    &:disabled,
    &:disabled:hover,
    &:disabled > span {
      color: var(--privy-color-foreground-3); /* Change text color to grey */
    }
  }
`,a=(0,t.zo)(n)`
  background-color: var(--privy-color-background);
  transition: background-color 200ms ease;

  && > button {
    right: 0;
    line-height: 24px;
    position: absolute;
    padding: 13px 17px;
    background-color: #090;

    :focus {
      outline: none;
      border-color: var(--privy-color-accent);
    }
  }
`,l=(0,t.zo)(n)`
  && > input {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    padding-right: ${e=>e.$stacked?"16px":"88px"};

    border: 1px solid
      ${({$error:e})=>e?"var(--privy-color-error) !important":"var(--privy-color-foreground-4)"};

    && > input::placeholder {
      color: var(--privy-color-foreground-3);
    }
  }

  && > :last-child {
    right: 16px;
    position: absolute;
    top: 50%;
    transform: translate(0, -50%);
  }

  && > button:last-child {
    right: 0px;
    line-height: 24px;
    padding: 13px 17px;

    :focus {
      outline: none;
    }
  }
`,d=t.zo.div`
  width: 100%;

  /* Add styling for the ErrorMessage within EmailInput */
  && > ${o.E} {
    display: block;
    text-align: left;
    padding-left: var(--privy-border-radius-md);
    padding-bottom: 5px;
  }
`},70547:function(e,r,i){i.d(r,{E:function(){return o}});var t=i(72361);let o=t.zo.span`
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.125rem; /* 150% */

  color: var(--privy-color-error);
`},60683:function(e,r,i){i.d(r,{B:function(){return o},C:function(){return l},F:function(){return s},H:function(){return a},R:function(){return h},S:function(){return p},a:function(){return c},b:function(){return u},c:function(){return d},d:function(){return g},e:function(){return n}});var t=i(72361);let o=t.zo.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  margin-top: auto;
  gap: 16px;
  flex-grow: 100;
`,n=t.zo.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  width: 100%;
`,a=t.zo.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`,l=(0,t.zo)(n)`
  padding: 20px 0;
`,d=(0,t.zo)(n)`
  gap: 16px;
`,s=t.zo.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`,c=t.zo.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;t.zo.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;let p=t.zo.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  text-align: left;
  gap: 8px;
  padding: 16px;
  margin-top: 16px;
  margin-bottom: 16px;
  width: 100%;
  background: var(--privy-color-background-2);
  border-radius: var(--privy-border-radius-md);
  && h4 {
    color: var(--privy-color-foreground-3);
    font-size: 14px;
    text-decoration: underline;
    font-weight: medium;
  }
  && p {
    color: var(--privy-color-foreground-3);
    font-size: 14px;
  }
`,u=t.zo.div`
  height: 16px;
`,h=t.zo.div`
  height: 12px;
`;t.zo.div`
  position: relative;
`;let g=t.zo.div`
  height: ${e=>e.height??"12"}px;
`;t.zo.div`
  background-color: var(--privy-color-accent);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  border-color: white;
  border-width: 2px !important;
`},74522:function(e,r,i){i.d(r,{S:function(){return k}});var t=i(57437),o=i(2265),n=i(72361),a=i(50640),l=i(15383),d=i(20278);let s=n.zo.div`
  /* spacing tokens */
  --screen-space: 16px; /* base 1x = 16 */
  --screen-space-lg: calc(var(--screen-space) * 1.5); /* 24px */

  position: relative;
  overflow: hidden;
  margin: 0 calc(-1 * var(--screen-space)); /* extends over modal padding */
  height: 100%;
  border-radius: var(--privy-border-radius-lg);
`,c=n.zo.div`
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
`,v=n.zo.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--screen-space);
`,x=n.zo.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`,f=n.zo.h3`
  && {
    font-size: 20px;
    line-height: 32px;
    font-weight: 500;
    color: var(--privy-color-foreground);
    margin: 0;
  }
`,m=n.zo.p`
  && {
    margin: 0;
    font-size: 16px;
    font-weight: 300;
    line-height: 24px;
    color: var(--privy-color-foreground);
  }
`,b=n.zo.div`
  background: ${({$variant:e})=>{switch(e){case"success":return"var(--privy-color-success-bg, #EAFCEF)";case"warning":return"var(--privy-color-warn, #FEF3C7)";case"error":return"var(--privy-color-error-bg, #FEE2E2)";case"loading":case"logo":return"transparent";default:return"var(--privy-color-background-2)"}}};

  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
`,y=n.zo.div`
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
`,k=({children:e,...r})=>(0,t.jsx)(s,{children:(0,t.jsx)(c,{...r,children:e})}),j=n.zo.div`
  position: absolute;
  top: 0;
  left: calc(-1 * var(--screen-space-lg));
  width: calc(100% + calc(var(--screen-space-lg) * 2));
  height: 4px;
  background: var(--privy-color-background-2);
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  overflow: hidden;
`,z=(0,n.zo)(l.B)`
  padding: 0;
  && a {
    padding: 0;
    color: var(--privy-color-foreground-3);
  }
`,E=n.zo.div`
  height: 100%;
  width: ${({pct:e})=>e}%;
  background: var(--privy-color-foreground-3);
  border-radius: 2px;
  transition: width 300ms ease-in-out;
`,S=({step:e})=>e?(0,t.jsx)(j,{children:(0,t.jsx)(E,{pct:Math.min(100,e.current/e.total*100)})}):null;k.Header=({title:e,subtitle:r,icon:i,iconVariant:o,iconLoadingStatus:n,showBack:a,onBack:l,showInfo:d,onInfo:s,showClose:c,onClose:h,step:g,headerTitle:b,...y})=>(0,t.jsxs)(p,{...y,children:[(0,t.jsx)(u,{backFn:a?l:void 0,infoFn:d?s:void 0,onClose:c?h:void 0,title:b,closeable:c}),(i||o||e||r)&&(0,t.jsxs)(v,{children:[i||o?(0,t.jsx)(k.Icon,{icon:i,variant:o,loadingStatus:n}):null,!(!e&&!r)&&(0,t.jsxs)(x,{children:[e&&(0,t.jsx)(f,{children:e}),r&&(0,t.jsx)(m,{children:r})]})]}),g&&(0,t.jsx)(S,{step:g})]}),(k.Body=o.forwardRef(({children:e,...r},i)=>(0,t.jsx)(h,{ref:i,...r,children:e}))).displayName="Screen.Body",k.Footer=({children:e,...r})=>(0,t.jsx)(g,{id:"privy-content-footer-container",...r,children:e}),k.Actions=({children:e,...r})=>(0,t.jsx)(C,{...r,children:e}),k.HelpText=({children:e,...r})=>(0,t.jsx)($,{...r,children:e}),k.FooterText=({children:e,...r})=>(0,t.jsx)(A,{...r,children:e}),k.Watermark=()=>(0,t.jsx)(z,{}),k.Icon=({icon:e,variant:r="subtle",loadingStatus:i})=>"logo"===r&&e?(0,t.jsx)(y,"string"==typeof e?{children:(0,t.jsx)("img",{src:e,alt:""})}:o.isValidElement(e)?{children:e}:{children:o.createElement(e)}):"loading"===r?e?(0,t.jsx)(w,{children:(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[(0,t.jsx)(a.N,{success:i?.success,fail:i?.fail}),"string"==typeof e?(0,t.jsx)("span",{style:{background:`url('${e}') 0 0 / contain`,height:"38px",width:"38px",borderRadius:"6px",margin:"auto",backgroundSize:"contain"}}):o.isValidElement(e)?o.cloneElement(e,{style:{width:"38px",height:"38px"}}):o.createElement(e,{style:{width:"38px",height:"38px"}})]})}):(0,t.jsx)(b,{$variant:r,children:(0,t.jsx)(d.N,{size:"64px"})}):(0,t.jsx)(b,{$variant:r,children:e&&("string"==typeof e?(0,t.jsx)("img",{src:e,alt:"",style:{width:"32px",height:"32px",borderRadius:"6px"}}):o.isValidElement(e)?e:o.createElement(e,{width:32,height:32,stroke:(()=>{switch(r){case"success":return"var(--privy-color-icon-success)";case"warning":return"var(--privy-color-icon-warning)";case"error":return"var(--privy-color-icon-error)";default:return"var(--privy-color-icon-muted)"}})(),strokeWidth:2}))});let C=n.zo.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) / 2);
`,$=n.zo.div`
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
`,A=n.zo.div`
  && {
    margin-top: -1rem;
    width: 100%;
    text-align: center;
    color: var(--privy-color-foreground-2);
    font-size: 0.6875rem; // 11px
    line-height: 1rem; // 16px
  }
`},7612:function(e,r,i){i.d(r,{S:function(){return a}});var t=i(57437),o=i(15383),n=i(74522);let a=({primaryCta:e,secondaryCta:r,helpText:i,footerText:a,watermark:l=!0,children:d,...s})=>{let c=e||r?(0,t.jsxs)(t.Fragment,{children:[e&&(()=>{let{label:r,...i}=e,n=i.variant||"primary";return(0,t.jsx)(o.a,{...i,variant:n,style:{width:"100%",...i.style},children:r})})(),r&&(()=>{let{label:e,...i}=r,n=i.variant||"secondary";return(0,t.jsx)(o.a,{...i,variant:n,style:{width:"100%",...i.style},children:e})})()]}):null;return(0,t.jsxs)(n.S,{id:s.id,className:s.className,children:[(0,t.jsx)(n.S.Header,{...s}),d?(0,t.jsx)(n.S.Body,{children:d}):null,i||c||l?(0,t.jsxs)(n.S.Footer,{children:[i?(0,t.jsx)(n.S.HelpText,{children:i}):null,c?(0,t.jsx)(n.S.Actions,{children:c}):null,l?(0,t.jsx)(n.S.Watermark,{}):null]}):null,a?(0,t.jsx)(n.S.FooterText,{children:a}):null]})}},44808:function(e,r,i){i.r(r),i.d(r,{UpdateEmailScreen:function(){return k},UpdateEmailScreenView:function(){return w},default:function(){return k}});var t=i(57437),o=i(89399),n=i(60683),a=i(75097),l=i(2265),d=i(72172),s=i(8969),c=i(71554),p=i(4696),u=i(50640),h=i(58314),g=i(15383),v=i(14364),x=i(70547),f=i(7612);i(29155),i(87336),i(97048),i(64131),i(41888);let m=(0,l.forwardRef)((e,r)=>{let[i,o]=(0,l.useState)(""),[n,v]=(0,l.useState)(""),[f,m]=(0,l.useState)(!1),{authenticated:w,user:k}=(0,p.u)(),{initUpdateEmail:j}=(0,c.u)(),{navigate:z,setModalData:E,currentScreen:S}=(0,p.a)(),{enabled:C,token:$}=(0,s.a)(),A=(0,d.u)(),N=(0,h.B)(i)&&(A.disablePlusEmails&&i.includes("+")?(n||v("Please enter a valid email address without a '+'."),!1):(n&&v(""),!0)),F=f||!N,T=()=>{!C||$||w?(async e=>{if(!k?.email)throw Error("User is required to have an email address to update it.");m(!0);try{await j({oldAddress:k.email.address,newAddress:i,captchaToken:e}),z("AwaitingPasswordlessCodeScreen")}catch(e){E({errorModalData:{error:e,previousScreen:S||"LandingScreen"}}),z("ErrorScreen")}m(!1)})($):(E({captchaModalData:{callback:e=>{if(!k?.email)throw Error("User is required to have an email address to update it.");return j({oldAddress:k.email.address,newAddress:i,captchaToken:e})},userIntentRequired:!1,onSuccessNavigateTo:"AwaitingPasswordlessCodeScreen",onErrorNavigateTo:"ErrorScreen"}}),z("CaptchaScreen"))};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(b,{children:[n&&(0,t.jsx)(x.E,{style:{marginTop:"0.25rem",textAlign:"left"},children:n}),(0,t.jsxs)(y,{$error:!!n,children:[(0,t.jsx)(u.C,{children:(0,t.jsx)(a.Z,{})}),(0,t.jsx)("input",{ref:r,id:"email-input",type:"email",placeholder:"your@email.com",onChange:e=>o(e.target.value),onKeyUp:e=>{"Enter"===e.key&&T()},value:i,autoComplete:"email"}),e.stacked?null:(0,t.jsx)(g.E,{isSubmitting:f,onClick:T,disabled:F,children:"Submit"})]})]}),e.stacked?(0,t.jsx)(g.P,{loadingText:null,loading:f,disabled:F,onClick:T,style:{width:"100%"},children:"Submit"}):null]})}),b=v.I,y=v.E,w=({title:e="Update your email",subtitle:r="Add the email address you'd like to use going forward. We'll send you a confirmation code"})=>(0,t.jsx)(f.S,{title:e,subtitle:r,icon:o.Z,watermark:!0,children:(0,t.jsx)(n.B,{children:(0,t.jsx)(m,{stacked:!0})})}),k={component:()=>(0,t.jsx)(w,{})}},20278:function(e,r,i){i.d(r,{N:function(){return n}});var t=i(57437),o=i(72361);let n=({size:e,centerIcon:r})=>(0,t.jsx)(a,{$size:e,children:(0,t.jsxs)(l,{children:[(0,t.jsx)(s,{}),(0,t.jsx)(c,{}),r?(0,t.jsx)(d,{children:r}):null]})}),a=o.zo.div`
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
`,d=o.zo.div`
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
`,s=o.zo.div`
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
`,c=o.zo.div`
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
`}}]);