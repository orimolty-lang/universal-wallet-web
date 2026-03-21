"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2963],{54428:function(r,e,i){i.d(e,{Z:function(){return u}});var o=i(2265);let t=r=>r.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),n=r=>r.replace(/^([A-Z])|[\s-_]+(\w)/g,(r,e,i)=>i?i.toUpperCase():e.toLowerCase()),a=r=>{let e=n(r);return e.charAt(0).toUpperCase()+e.slice(1)},l=function(){for(var r=arguments.length,e=Array(r),i=0;i<r;i++)e[i]=arguments[i];return e.filter((r,e,i)=>!!r&&""!==r.trim()&&i.indexOf(r)===e).join(" ").trim()},c=r=>{for(let e in r)if(e.startsWith("aria-")||"role"===e||"title"===e)return!0};var d={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let s=(0,o.forwardRef)((r,e)=>{let{color:i="currentColor",size:t=24,strokeWidth:n=2,absoluteStrokeWidth:a,className:s="",children:u,iconNode:p,...g}=r;return(0,o.createElement)("svg",{ref:e,...d,width:t,height:t,stroke:i,strokeWidth:a?24*Number(n)/Number(t):n,className:l("lucide",s),...!u&&!c(g)&&{"aria-hidden":"true"},...g},[...p.map(r=>{let[e,i]=r;return(0,o.createElement)(e,i)}),...Array.isArray(u)?u:[u]])}),u=(r,e)=>{let i=(0,o.forwardRef)((i,n)=>{let{className:c,...d}=i;return(0,o.createElement)(s,{ref:n,iconNode:e,className:l("lucide-".concat(t(a(r))),"lucide-".concat(r),c),...d})});return i.displayName=a(r),i}},75097:function(r,e,i){i.d(e,{Z:function(){return o}});let o=(0,i(54428).Z)("mail",[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]])},89399:function(r,e,i){var o=i(2265);let t=o.forwardRef(function(r,e){let{title:i,titleId:t,...n}=r;return o.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:e,"aria-labelledby":t},n),i?o.createElement("title",{id:t},i):null,o.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"}))});e.Z=t},43867:function(r,e,i){i.d(e,{C:function(){return a}});var o=i(57437),t=i(72361),n=i(29872);let a=({children:r,color:e,isLoading:i,isPulsing:t,...n})=>(0,o.jsx)(l,{$color:e,$isLoading:i,$isPulsing:t,...n,children:r}),l=t.zo.span`
  padding: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem; /* 150% */
  border-radius: var(--privy-border-radius-xs);
  display: flex;
  align-items: center;
  ${r=>{let e,i;"green"===r.$color&&(e="var(--privy-color-success-dark)",i="var(--privy-color-success-light)"),"red"===r.$color&&(e="var(--privy-color-error)",i="var(--privy-color-error-light)"),"gray"===r.$color&&(e="var(--privy-color-foreground-2)",i="var(--privy-color-background-2)");let o=(0,t.F4)`
      from, to {
        background-color: ${i};
      }

      50% {
        background-color: rgba(${i}, 0.8);
      }
    `;return(0,t.iv)`
      color: ${e};
      background-color: ${i};
      ${r.$isPulsing&&(0,t.iv)`
        animation: ${o} 3s linear infinite;
      `};
    `}}

  ${n.L}
`},6796:function(r,e,i){i.d(e,{C:function(){return x}});var o=i(57437),t=i(75097),n=i(2265),a=i(72361),l=i(95349),c=i(71554),d=i(86518),s=i(47685),u=i(27574),p=i(7718),g=i(4357),h=i(43867),v=i(14364),f=i(70547);let x=(0,n.forwardRef)((r,e)=>{let[i,a]=(0,n.useState)(r.defaultValue||""),[v,x]=(0,n.useState)(""),[w,k]=(0,n.useState)(!1),{authenticated:j}=(0,s.u)(),{initLoginWithEmail:z}=(0,c.u)(),{navigate:$,setModalData:E,currentScreen:S,data:C}=(0,s.a)(),{enabled:L,token:A}=(0,d.a)(),[F,N]=(0,n.useState)(!1),{accountType:T}=(0,u.r)(),I=(0,l.u)();(0,n.useEffect)(()=>{!i&&I.disablePlusEmails&&C?.inlineError?.error instanceof c.c&&C?.inlineError?.error.privyErrorCode===c.b.DISALLOWED_PLUS_EMAIL&&!v&&x("Please enter a valid email address without a '+'."),v&&x("")},[i]);let B=(0,p.B)(i),P=w||!B,M=()=>{E({login:C?.login,inlineError:void 0}),!L||A||j?(k(!0),z({email:i,captchaToken:A,disableSignup:C?.login?.disableSignup,withPrivyUi:!0}).then(()=>{$("AwaitingPasswordlessCodeScreen")}).catch(r=>{E({errorModalData:{error:r,previousScreen:S||"LandingScreen"}}),$("ErrorScreen")}).finally(()=>{k(!1)})):(E({captchaModalData:{callback:r=>z({email:i,captchaToken:r,withPrivyUi:!0}),userIntentRequired:!1,onSuccessNavigateTo:"AwaitingPasswordlessCodeScreen",onErrorNavigateTo:"ErrorScreen"}}),$("CaptchaScreen"))};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)(m,{children:[v&&(0,o.jsx)(f.E,{style:{display:"block",marginTop:"0.25rem",textAlign:"left"},children:v}),(0,o.jsxs)(y,{stacked:r.stacked,$error:!!v,children:[(0,o.jsx)(b,{children:(0,o.jsx)(t.Z,{})}),(0,o.jsx)("input",{ref:e,id:"email-input",className:"login-method-button",type:"email",placeholder:"your@email.com",onFocus:()=>N(!0),onChange:r=>a(r.target.value),onKeyUp:r=>{"Enter"===r.key&&M()},value:i,autoComplete:"email"}),"email"!==T||F?r.stacked?(0,o.jsx)("span",{}):(0,o.jsx)(g.E,{isSubmitting:w,onClick:M,disabled:P,children:"Submit"}):(0,o.jsx)(h.C,{color:"gray",children:"Recent"})]})]}),r.stacked?(0,o.jsx)(g.P,{loadingText:null,loading:w,disabled:P,onClick:M,style:{width:"100%"},children:"Submit"}):null]})}),m=v.I,y=v.a,b=(0,a.zo)(u.C)`
  display: inline-flex;
`},14364:function(r,e,i){i.d(e,{E:function(){return a},I:function(){return c},a:function(){return l}});var o=i(72361),t=i(70547);let n=o.zo.label`
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
      ${({$error:r})=>r?"var(--privy-color-error) !important":"var(--privy-color-foreground-4)"};
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
      border-color: ${({$error:r})=>r?"var(--privy-color-error) !important":"var(--privy-color-accent-light)"};
      box-shadow: ${({$error:r})=>r?"none":"0 0 0 1px var(--privy-color-accent-light)"};
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
`,a=(0,o.zo)(n)`
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
`,l=(0,o.zo)(n)`
  && > input {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    padding-right: ${r=>r.$stacked?"16px":"88px"};

    border: 1px solid
      ${({$error:r})=>r?"var(--privy-color-error) !important":"var(--privy-color-foreground-4)"};

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
`,c=o.zo.div`
  width: 100%;

  /* Add styling for the ErrorMessage within EmailInput */
  && > ${t.E} {
    display: block;
    text-align: left;
    padding-left: var(--privy-border-radius-md);
    padding-bottom: 5px;
  }
`},70547:function(r,e,i){i.d(e,{E:function(){return t}});var o=i(72361);let t=o.zo.span`
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.125rem; /* 150% */

  color: var(--privy-color-error);
`},60683:function(r,e,i){i.d(e,{B:function(){return t},C:function(){return l},F:function(){return d},H:function(){return a},R:function(){return g},S:function(){return u},a:function(){return s},b:function(){return p},c:function(){return c},d:function(){return h},e:function(){return n}});var o=i(72361);let t=o.zo.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  margin-top: auto;
  gap: 16px;
  flex-grow: 100;
`,n=o.zo.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  width: 100%;
`,a=o.zo.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`,l=(0,o.zo)(n)`
  padding: 20px 0;
`,c=(0,o.zo)(n)`
  gap: 16px;
`,d=o.zo.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`,s=o.zo.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;o.zo.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;let u=o.zo.div`
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
`,p=o.zo.div`
  height: 16px;
`,g=o.zo.div`
  height: 12px;
`;o.zo.div`
  position: relative;
`;let h=o.zo.div`
  height: ${r=>r.height??"12"}px;
`;o.zo.div`
  background-color: var(--privy-color-accent);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  border-color: white;
  border-width: 2px !important;
`},72963:function(r,e,i){i.r(e),i.d(e,{LinkEmailScreen:function(){return s},LinkEmailScreenView:function(){return d},default:function(){return s}});var o=i(57437),t=i(89399),n=i(6796),a=i(60683),l=i(95349),c=i(70737);i(2265),i(1470),i(97048),i(64131),i(93142),i(29155);let d=({title:r="Connect your email",subtitle:e="Add your email to your account"})=>(0,o.jsx)(c.S,{title:r,subtitle:e,icon:t.Z,watermark:!0,children:(0,o.jsx)(a.B,{children:(0,o.jsx)(n.C,{stacked:!0})})}),s={component:()=>{let r=(0,l.u)();return(0,o.jsx)(d,{subtitle:`Add your email to your ${r?.name} account`})}}},29872:function(r,e,i){i.d(e,{L:function(){return n}});var o=i(72361);let t=(0,o.F4)`
  from, to {
    background: var(--privy-color-foreground-4);
    color: var(--privy-color-foreground-4);
  }

  50% {
    background: var(--privy-color-foreground-accent);
    color: var(--privy-color-foreground-accent);
  }
`,n=(0,o.iv)`
  ${r=>r.$isLoading?(0,o.iv)`
          width: 35%;
          animation: ${t} 2s linear infinite;
          border-radius: var(--privy-border-radius-sm);
        `:""}
`},74822:function(r,e,i){i.d(e,{S:function(){return k}});var o=i(57437),t=i(2265),n=i(72361),a=i(27574),l=i(4357),c=i(20278);let d=n.zo.div`
  /* spacing tokens */
  --screen-space: 16px; /* base 1x = 16 */
  --screen-space-lg: calc(var(--screen-space) * 1.5); /* 24px */

  position: relative;
  overflow: hidden;
  margin: 0 calc(-1 * var(--screen-space)); /* extends over modal padding */
  height: 100%;
  border-radius: var(--privy-border-radius-lg);
`,s=n.zo.div`
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) * 1.5);
  width: 100%;
  background: var(--privy-color-background);
  padding: 0 var(--screen-space-lg) var(--screen-space);
  height: 100%;
  border-radius: var(--privy-border-radius-lg);
`,u=n.zo.div`
  position: relative;
  display: flex;
  flex-direction: column;
`,p=(0,n.zo)(l.M)`
  margin: 0 -8px;
`,g=n.zo.div`
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
  ${({$colorScheme:r})=>"light"===r?"background: linear-gradient(var(--privy-color-background), var(--privy-color-background) 70%) bottom, linear-gradient(rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0.06)) bottom;":"dark"===r?"background: linear-gradient(var(--privy-color-background), var(--privy-color-background) 70%) bottom, linear-gradient(rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0.06)) bottom;":void 0}

  background-repeat: no-repeat;
  background-size:
    100% 32px,
    100% 16px;
  background-attachment: local, scroll;
`,h=n.zo.div`
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
`,f=n.zo.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`,x=n.zo.h3`
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
`,y=n.zo.div`
  background: ${({$variant:r})=>{switch(r){case"success":return"var(--privy-color-success-bg, #EAFCEF)";case"warning":return"var(--privy-color-warn, #FEF3C7)";case"error":return"var(--privy-color-error-bg, #FEE2E2)";case"loading":case"logo":return"transparent";default:return"var(--privy-color-background-2)"}}};

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
`,k=({children:r,...e})=>(0,o.jsx)(d,{children:(0,o.jsx)(s,{...e,children:r})}),j=n.zo.div`
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
`,$=n.zo.div`
  height: 100%;
  width: ${({pct:r})=>r}%;
  background: var(--privy-color-foreground-3);
  border-radius: 2px;
  transition: width 300ms ease-in-out;
`,E=({step:r})=>r?(0,o.jsx)(j,{children:(0,o.jsx)($,{pct:Math.min(100,r.current/r.total*100)})}):null;k.Header=({title:r,subtitle:e,icon:i,iconVariant:t,iconLoadingStatus:n,showBack:a,onBack:l,showInfo:c,onInfo:d,showClose:s,onClose:g,step:h,headerTitle:y,...b})=>(0,o.jsxs)(u,{...b,children:[(0,o.jsx)(p,{backFn:a?l:void 0,infoFn:c?d:void 0,onClose:s?g:void 0,title:y,closeable:s}),(i||t||r||e)&&(0,o.jsxs)(v,{children:[i||t?(0,o.jsx)(k.Icon,{icon:i,variant:t,loadingStatus:n}):null,!(!r&&!e)&&(0,o.jsxs)(f,{children:[r&&(0,o.jsx)(x,{children:r}),e&&(0,o.jsx)(m,{children:e})]})]}),h&&(0,o.jsx)(E,{step:h})]}),(k.Body=t.forwardRef(({children:r,...e},i)=>(0,o.jsx)(g,{ref:i,...e,children:r}))).displayName="Screen.Body",k.Footer=({children:r,...e})=>(0,o.jsx)(h,{id:"privy-content-footer-container",...e,children:r}),k.Actions=({children:r,...e})=>(0,o.jsx)(S,{...e,children:r}),k.HelpText=({children:r,...e})=>(0,o.jsx)(C,{...e,children:r}),k.FooterText=({children:r,...e})=>(0,o.jsx)(L,{...e,children:r}),k.Watermark=()=>(0,o.jsx)(z,{}),k.Icon=({icon:r,variant:e="subtle",loadingStatus:i})=>"logo"===e&&r?(0,o.jsx)(b,"string"==typeof r?{children:(0,o.jsx)("img",{src:r,alt:""})}:t.isValidElement(r)?{children:r}:{children:t.createElement(r)}):"loading"===e?r?(0,o.jsx)(w,{children:(0,o.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[(0,o.jsx)(a.N,{success:i?.success,fail:i?.fail}),"string"==typeof r?(0,o.jsx)("span",{style:{background:`url('${r}') 0 0 / contain`,height:"38px",width:"38px",borderRadius:"6px",margin:"auto",backgroundSize:"contain"}}):t.isValidElement(r)?t.cloneElement(r,{style:{width:"38px",height:"38px"}}):t.createElement(r,{style:{width:"38px",height:"38px"}})]})}):(0,o.jsx)(y,{$variant:e,children:(0,o.jsx)(c.N,{size:"64px"})}):(0,o.jsx)(y,{$variant:e,children:r&&("string"==typeof r?(0,o.jsx)("img",{src:r,alt:"",style:{width:"32px",height:"32px",borderRadius:"6px"}}):t.isValidElement(r)?r:t.createElement(r,{width:32,height:32,stroke:(()=>{switch(e){case"success":return"var(--privy-color-icon-success)";case"warning":return"var(--privy-color-icon-warning)";case"error":return"var(--privy-color-icon-error)";default:return"var(--privy-color-icon-muted)"}})(),strokeWidth:2}))});let S=n.zo.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(var(--screen-space) / 2);
`,C=n.zo.div`
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
`,L=n.zo.div`
  && {
    margin-top: -1rem;
    width: 100%;
    text-align: center;
    color: var(--privy-color-foreground-2);
    font-size: 0.6875rem; // 11px
    line-height: 1rem; // 16px
  }
`},70737:function(r,e,i){i.d(e,{S:function(){return a}});var o=i(57437),t=i(4357),n=i(74822);let a=({primaryCta:r,secondaryCta:e,helpText:i,footerText:a,watermark:l=!0,children:c,...d})=>{let s=r||e?(0,o.jsxs)(o.Fragment,{children:[r&&(()=>{let{label:e,...i}=r,n=i.variant||"primary";return(0,o.jsx)(t.a,{...i,variant:n,style:{width:"100%",...i.style},children:e})})(),e&&(()=>{let{label:r,...i}=e,n=i.variant||"secondary";return(0,o.jsx)(t.a,{...i,variant:n,style:{width:"100%",...i.style},children:r})})()]}):null;return(0,o.jsxs)(n.S,{id:d.id,className:d.className,children:[(0,o.jsx)(n.S.Header,{...d}),c?(0,o.jsx)(n.S.Body,{children:c}):null,i||s||l?(0,o.jsxs)(n.S.Footer,{children:[i?(0,o.jsx)(n.S.HelpText,{children:i}):null,s?(0,o.jsx)(n.S.Actions,{children:s}):null,l?(0,o.jsx)(n.S.Watermark,{}):null]}):null,a?(0,o.jsx)(n.S.FooterText,{children:a}):null]})}},20278:function(r,e,i){i.d(e,{N:function(){return n}});var o=i(57437),t=i(72361);let n=({size:r,centerIcon:e})=>(0,o.jsx)(a,{$size:r,children:(0,o.jsxs)(l,{children:[(0,o.jsx)(d,{}),(0,o.jsx)(s,{}),e?(0,o.jsx)(c,{children:e}):null]})}),a=t.zo.div`
  --spinner-size: ${r=>r.$size?r.$size:"96px"};

  display: inline-flex;
  justify-content: center;
  align-items: center;

  @media all and (display-mode: standalone) {
    margin-bottom: 30px;
  }
`,l=t.zo.div`
  position: relative;
  height: var(--spinner-size);
  width: var(--spinner-size);

  opacity: 1;
  animation: fadein 200ms ease;
`,c=t.zo.div`
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
`,d=t.zo.div`
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
`,s=t.zo.div`
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