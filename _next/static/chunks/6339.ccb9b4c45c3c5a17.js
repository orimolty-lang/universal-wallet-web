"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6339],{64796:function(e,t,r){r.d(t,{Z:function(){return s}});let s=(0,r(54428).Z)("copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},90834:function(e,t,r){r.d(t,{C:function(){return p},a:function(){return f}});var s=r(57437),o=r(42196),n=r(64796),a=r(2265),i=r(72361);let l=i.zo.button`
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 0.5rem;

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`,c=i.zo.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--privy-color-foreground-2);
`,u=(0,i.zo)(o.Z)`
  color: var(--privy-color-icon-success);
  flex-shrink: 0;
`,d=(0,i.zo)(n.Z)`
  color: var(--privy-color-icon-muted);
  flex-shrink: 0;
`;function p({children:e,iconOnly:t,value:r,hideCopyIcon:o,...n}){let[i,p]=(0,a.useState)(!1);return(0,s.jsxs)(l,{...n,onClick:()=>{navigator.clipboard.writeText(r||("string"==typeof e?e:"")).catch(console.error),p(!0),setTimeout(()=>p(!1),1500)},children:[e," ",i?(0,s.jsxs)(c,{children:[(0,s.jsx)(u,{})," ",!t&&"Copied"]}):!o&&(0,s.jsx)(d,{})]})}let f=({value:e,includeChildren:t,children:r,...o})=>{let[n,i]=(0,a.useState)(!1),p=()=>{navigator.clipboard.writeText(e).catch(console.error),i(!0),setTimeout(()=>i(!1),1500)};return(0,s.jsxs)(s.Fragment,{children:[t?(0,s.jsx)(l,{...o,onClick:p,children:r}):(0,s.jsx)(s.Fragment,{children:r}),(0,s.jsx)(l,{...o,onClick:p,children:n?(0,s.jsx)(c,{children:(0,s.jsx)(u,{})}):(0,s.jsx)(d,{})})]})}},76339:function(e,t,r){r.r(t),r.d(t,{FundWithBankDepositScreen:function(){return _},default:function(){return _}});var s=r(57437),o=r(2265),n=r(68879),a=r(4696),i=r(80714),l=r(97048),c=r(72361),u=r(90834),d=r(8969),p=r(7612),f=r(96835),m=r(54428);let h=(0,m.Z)("hourglass",[["path",{d:"M5 22h14",key:"ehvnwv"}],["path",{d:"M5 2h14",key:"pdyrp9"}],["path",{d:"M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22",key:"1d314k"}],["path",{d:"M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2",key:"1vvvr6"}]]),y=(0,m.Z)("user-check",[["path",{d:"m16 11 2 2 4-4",key:"9rsbq5"}],["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]]);var g=r(42196),v=r(71588);r(29155),r(87336),r(64131),r(41888);let k=({data:e,onClose:t})=>(0,s.jsx)(p.S,{showClose:!0,onClose:t,title:"Initiate bank transfer",subtitle:"Use the details below to complete a bank transfer from your bank.",primaryCta:{label:"Done",onClick:t},watermark:!1,footerText:"Exchange rates and fees are set when you authorize and determine the amount you receive. You'll see the applicable rates and fees for your transaction separately",children:(0,s.jsx)(x,{children:(d.J[e.deposit_instructions.asset]||[]).map(([t,r],o)=>{let n=e.deposit_instructions[t];if(!n||Array.isArray(n))return null;let a="asset"===t?n.toUpperCase():n,i=a.length>100?`${a.slice(0,9)}...${a.slice(-9)}`:a;return(0,s.jsxs)(C,{children:[(0,s.jsx)(w,{children:r}),(0,s.jsx)(u.a,{value:a,includeChildren:l.tq,children:(0,s.jsx)(b,{children:i})})]},o)})})}),x=c.zo.ol`
  border-color: var(--privy-color-border-default);
  border-width: 1px;
  border-radius: var(--privy-border-radius-mdlg);
  border-style: solid;
  display: flex;
  flex-direction: column;

  && {
    padding: 0 1rem;
  }
`,C=c.zo.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;

  &:not(:first-of-type) {
    border-top: 1px solid var(--privy-color-border-default);
  }

  & > {
    :nth-child(1) {
      flex-basis: 30%;
    }

    :nth-child(2) {
      flex-basis: 60%;
    }
  }
`,w=c.zo.span`
  color: var(--privy-color-foreground);
  font-kerning: none;
  font-variant-numeric: lining-nums proportional-nums;
  font-feature-settings: 'calt' off;

  /* text-xs/font-regular */
  font-size: 0.75rem;
  font-style: normal;
  font-weight: 400;
  line-height: 1.125rem; /* 150% */

  text-align: left;
  flex-shrink: 0;
`,b=c.zo.span`
  color: var(--privy-color-foreground);
  font-kerning: none;
  font-feature-settings: 'calt' off;

  /* text-sm/font-medium */
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 500;
  line-height: 1.375rem; /* 157.143% */

  text-align: right;
  word-break: break-all;
`,j=({onClose:e})=>(0,s.jsx)(p.S,{showClose:!0,onClose:e,icon:f.Z,iconVariant:"error",title:"Something went wrong",subtitle:"We couldn't complete account setup. This isn't caused by anything you did.",primaryCta:{label:"Close",onClick:e},watermark:!0}),S=({onClose:e,reason:t})=>{let r=t?t.charAt(0).toLowerCase()+t.slice(1):void 0;return(0,s.jsx)(p.S,{showClose:!0,onClose:e,icon:f.Z,iconVariant:"error",title:"Identity verification failed",subtitle:r?`We can't complete identity verification because ${r}. Please try again or contact support for assistance.`:"We couldn't verify your identity. Please try again or contact support for assistance.",primaryCta:{label:"Close",onClick:e},watermark:!0})},A=({onClose:e,email:t})=>(0,s.jsx)(p.S,{showClose:!0,onClose:e,icon:h,title:"Identity verification in progress",subtitle:"We're waiting for Persona to approve your identity verification. This usually takes a few minutes, but may take up to 24 hours.",primaryCta:{label:"Done",onClick:e},watermark:!0,children:(0,s.jsxs)(v.I,{theme:"light",children:["You'll receive an email at ",t," once approved with instructions for completing your deposit."]})}),E=({onClose:e,onAcceptTerms:t,isLoading:r})=>(0,s.jsx)(p.S,{showClose:!0,onClose:e,icon:y,title:"Verify your identity to continue",subtitle:"Finish verification with Persona — it takes just a few minutes and requires a government ID.",helpText:(0,s.jsxs)(s.Fragment,{children:['This app uses Bridge to securely connect accounts and move funds. By clicking "Accept," you agree to Bridge\'s'," ",(0,s.jsx)("a",{href:"https://www.bridge.xyz/legal",target:"_blank",rel:"noopener noreferrer",children:"Terms of Service"})," ","and"," ",(0,s.jsx)("a",{href:"https://www.bridge.xyz/legal/row-privacy-policy/bridge-building-limited",target:"_blank",rel:"noopener noreferrer",children:"Privacy Policy"}),"."]}),primaryCta:{label:"Accept and continue",onClick:t,loading:r},watermark:!0}),z=({onClose:e})=>(0,s.jsx)(p.S,{showClose:!0,onClose:e,icon:g.Z,iconVariant:"success",title:"Identity verified successfully",subtitle:"We've successfully verified your identity. Now initiate a bank transfer to view instructions.",primaryCta:{label:"Initiate bank transfer",onClick:()=>{},loading:!0},watermark:!0}),T=({opts:e,onClose:t,onEditSourceAsset:r,onSelectAmount:o,isLoading:n})=>(0,s.jsxs)(p.S,{showClose:!0,onClose:t,headerTitle:`Buy ${e.destination.asset.toLocaleUpperCase()}`,primaryCta:{label:"Continue",onClick:o,loading:n},watermark:!0,children:[(0,s.jsx)(i.A,{currency:e.source.selectedAsset,inputMode:"decimal",autoFocus:!0}),(0,s.jsx)(i.C,{selectedAsset:e.source.selectedAsset,onEditSourceAsset:r})]}),U=({onClose:e,onAcceptTerms:t,onSelectAmount:r,onSelectSource:o,onEditSourceAsset:n,opts:a,state:l,email:c,isLoading:u})=>"select-amount"===l.status?(0,s.jsx)(T,{onClose:e,onSelectAmount:r,onEditSourceAsset:n,opts:a,isLoading:u}):"select-source-asset"===l.status?(0,s.jsx)(i.S,{onSelectSource:o,opts:a,isLoading:u}):"kyc-prompt"===l.status?(0,s.jsx)(E,{onClose:e,onAcceptTerms:t,opts:a,isLoading:u}):"kyc-incomplete"===l.status?(0,s.jsx)(A,{onClose:e,email:c}):"kyc-success"===l.status?(0,s.jsx)(z,{onClose:e}):"kyc-error"===l.status?(0,s.jsx)(S,{onClose:e,reason:l.reason}):"account-details"===l.status?(0,s.jsx)(k,{onClose:e,data:l.data}):"create-customer-error"===l.status||"get-customer-error"===l.status?(0,s.jsx)(j,{onClose:e}):null,_={component:()=>{let{user:e}=(0,a.u)(),t=(0,a.a)().data;if(!t?.FundWithBankDepositScreen)throw Error("Missing data");let{onSuccess:r,onFailure:l,opts:c,createOrUpdateCustomer:u,getCustomer:d,getOrCreateVirtualAccount:p}=t.FundWithBankDepositScreen,[f,m]=(0,o.useState)(c),[h,y]=(0,o.useState)({status:"select-amount"}),[g,v]=(0,o.useState)(null),[k,x]=(0,o.useState)(!1),C=(0,o.useRef)(null),w=(0,o.useCallback)(async()=>{let e;x(!0),v(null);try{e=await d({kycRedirectUrl:window.location.origin})}catch(e){if(!e||"object"!=typeof e||!("status"in e)||404!==e.status)return y({status:"get-customer-error"}),v(e),void x(!1)}if(!e)try{e=await u({hasAcceptedTerms:!1,kycRedirectUrl:window.location.origin})}catch(e){return y({status:"create-customer-error"}),v(e),void x(!1)}if(!e)return y({status:"create-customer-error"}),v(Error("Unable to create customer")),void x(!1);if("not_started"===e.status&&e.kyc_url)return y({status:"kyc-prompt",kycUrl:e.kyc_url}),void x(!1);if("not_started"===e.status)return y({status:"get-customer-error"}),v(Error("Unexpected user state")),void x(!1);if("rejected"===e.status)return y({status:"kyc-error",reason:e.rejection_reasons?.[0]?.reason}),v(Error("User KYC rejected.")),void x(!1);if("incomplete"===e.status)return y({status:"kyc-incomplete"}),void x(!1);if("active"!==e.status)return y({status:"get-customer-error"}),v(Error("Unexpected user state")),void x(!1);e.status;try{let e=await p({destination:f.destination,provider:f.provider,source:{asset:f.source.selectedAsset}});y({status:"account-details",data:e})}catch(e){return y({status:"create-customer-error"}),v(e),void x(!1)}},[f]),b=(0,o.useCallback)(async()=>{if(v(null),x(!0),"kyc-prompt"!==h.status)return v(Error("Unexpected state")),void x(!1);let e=(0,n.X)({location:h.kycUrl});if(await u({hasAcceptedTerms:!0}),!e)return v(Error("Unable to begin kyc flow.")),x(!1),void y({status:"create-customer-error"});C.current=new AbortController;let t=await (0,i.p)(e,C.current.signal);if("aborted"===t.status)return;if("closed"===t.status)return void x(!1);t.status;let r=await (0,i.a)({operation:()=>d({}),until:e=>"active"===e.status||"rejected"===e.status,delay:0,interval:2e3,attempts:60,signal:C.current.signal});if("aborted"!==r.status){if("max_attempts"===r.status)return y({status:"kyc-incomplete"}),void x(!1);if(r.status,"rejected"===r.result.status)return y({status:"kyc-error",reason:r.result.rejection_reasons?.[0]?.reason}),v(Error("User KYC rejected.")),void x(!1);if("active"!==r.result.status)return y({status:"kyc-incomplete"}),void x(!1);e.closed||e.close(),r.result.status;try{y({status:"kyc-success"});let e=await p({destination:f.destination,provider:f.provider,source:{asset:f.source.selectedAsset}});y({status:"account-details",data:e})}catch(e){y({status:"create-customer-error"}),v(e)}finally{x(!1)}}},[y,v,x,u,p,h,f,C]),j=(0,o.useCallback)(e=>{y({status:"select-amount"}),m({...f,source:{...f.source,selectedAsset:e}})},[y,m]),S=(0,o.useCallback)(()=>{y({status:"select-source-asset"})},[y]);return(0,s.jsx)(U,{onClose:(0,o.useCallback)(async()=>{C.current?.abort(),g?l(g):await r()},[g,C]),opts:f,state:h,isLoading:k,email:e.email.address,onAcceptTerms:b,onSelectAmount:w,onSelectSource:j,onEditSourceAsset:S})}}},71588:function(e,t,r){r.d(t,{I:function(){return i}});var s=r(57437),o=r(2265);let n=o.forwardRef(function(e,t){let{title:r,titleId:s,...n}=e;return o.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:t,"aria-labelledby":s},n),r?o.createElement("title",{id:s},r):null,o.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"}))});var a=r(72361);let i=({children:e,theme:t})=>(0,s.jsxs)(l,{$theme:t,children:[(0,s.jsx)(n,{width:"20px",height:"20px",color:"var(--privy-color-icon-muted)",strokeWidth:1.5,style:{flexShrink:0}}),(0,s.jsx)(c,{$theme:t,children:e})]}),l=a.zo.div`
  display: flex;
  gap: 0.75rem;
  background-color: var(--privy-color-background-2);
  align-items: flex-start;
  padding: 1rem;
  border-radius: 0.75rem;
`,c=a.zo.div`
  color: ${e=>"dark"===e.$theme?"var(--privy-color-foreground-2)":"var(--privy-color-foreground)"};
  flex: 1;
  text-align: left;

  /* text-sm/font-regular */
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 400;
  line-height: 1.375rem; /* 157.143% */
`}}]);