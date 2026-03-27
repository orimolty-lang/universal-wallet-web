"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2014],{21021:function(e,t,o){o.d(t,{Z:function(){return r}});let r=(0,o(54428).Z)("smartphone",[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]])},8138:function(e,t,o){o.d(t,{Z:function(){return r}});let r=(0,o(54428).Z)("triangle-alert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]])},86132:function(e,t,o){o.d(t,{Z:function(){return r}});let r=(0,o(54428).Z)("wallet",[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",key:"18etb6"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",key:"xoc0q4"}]])},22014:function(e,t,o){o.r(t),o.d(t,{FiatOnrampScreen:function(){return G},default:function(){return G}});var r=o(57437),n=o(2265),s=o(68879),a=o(4696),i=o(80714),l=o(54428);let u=(0,l.Z)("loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);var d=o(96835),c=o(42196);let h=(0,l.Z)("credit-card",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);var p=o(21021);let m=(0,l.Z)("building",[["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M12 6h.01",key:"1vi96p"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M16 6h.01",key:"1x0f13"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M8 6h.01",key:"1dz90k"}],["path",{d:"M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",key:"cabbwy"}],["rect",{x:"4",y:"2",width:"16",height:"20",rx:"2",key:"1uxh74"}]]);var y=o(86132),g=o(8138);let f=(0,l.Z)("chevron-right",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);var v=o(7612),C=o(99379);o(29155),o(87336),o(97048),o(64131),o(14145);let x=({onClose:e})=>(0,r.jsx)(v.S,{showClose:!0,onClose:e,icon:u,iconVariant:"loading",title:"Waiting for confirmation",subtitle:"Your payment is being processed. This may take a few moments.",watermark:!0}),b=({onClose:e,onRetry:t})=>(0,r.jsx)(v.S,{showClose:!0,onClose:e,icon:d.Z,iconVariant:"error",title:"Something went wrong",subtitle:"We couldn't complete your transaction. Please try again.",primaryCta:{label:"Try again",onClick:t},secondaryCta:{label:"Close",onClick:e},watermark:!0}),w=({onClose:e})=>(0,r.jsx)(v.S,{showClose:!0,onClose:e,icon:c.Z,iconVariant:"success",title:"Transaction initiated",subtitle:"Your purchase is being processed. It may take a few minutes for the funds to arrive in your wallet.",primaryCta:{label:"Done",onClick:e},watermark:!0}),k={CREDIT_DEBIT_CARD:"card",APPLE_PAY:"Apple Pay",GOOGLE_PAY:"Google Pay",BANK_TRANSFER:"bank deposit",ACH:"bank deposit",SEPA:"bank deposit",PIX:"PIX"},_={CREDIT_DEBIT_CARD:(0,r.jsx)(h,{size:14}),APPLE_PAY:(0,r.jsx)(p.Z,{size:14}),GOOGLE_PAY:(0,r.jsx)(p.Z,{size:14}),BANK_TRANSFER:(0,r.jsx)(m,{size:14}),ACH:(0,r.jsx)(m,{size:14}),SEPA:(0,r.jsx)(m,{size:14}),PIX:(0,r.jsx)(y.Z,{size:14})},A=({opts:e,onClose:t,onEditSourceAsset:o,onEditPaymentMethod:n,onContinue:s,onAmountChange:a,amount:l,selectedQuote:u,quotesWarning:d,quotesCount:c,isLoading:p})=>{var m;return(0,r.jsxs)(v.S,{showClose:!0,onClose:t,headerTitle:`Buy ${e.destination.asset.toLocaleUpperCase()}`,primaryCta:{label:"Continue",onClick:s,loading:p||!u,disabled:!u},helpText:d?(0,r.jsxs)(j,{children:[(0,r.jsx)(g.Z,{size:16,strokeWidth:2}),(0,r.jsx)(S,{children:(0,r.jsxs)(r.Fragment,"amount_too_low"===d?{children:[(0,r.jsx)(P,{children:"Amount too low"}),(0,r.jsx)(E,{children:"Please choose a higher amount to continue."})]}:{children:[(0,r.jsx)(P,{children:"Currency not available"}),(0,r.jsx)(E,{children:"Please choose another currency to continue."})]})})]}):u&&c>1?(0,r.jsxs)(z,{onClick:n,children:[_[u.payment_method]??(0,r.jsx)(h,{size:14}),(0,r.jsxs)("span",{children:["Pay with ",k[m=u.payment_method]??m.replace(/_/g," ").toLowerCase().replace(/^\w/,e=>e.toUpperCase())]}),(0,r.jsx)(f,{size:14})]}):null,watermark:!0,children:[(0,r.jsx)(i.A,{currency:e.source.selectedAsset,value:l,onChange:a,inputMode:"decimal",autoFocus:!0}),(0,r.jsx)(i.C,{selectedAsset:e.source.selectedAsset,onEditSourceAsset:o})]})},j=C.zo.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: var(--privy-color-warn-bg, #fffbbb);
  border: 1px solid var(--privy-color-border-warning, #facd63);
  overflow: clip;
  width: 100%;

  svg {
    flex-shrink: 0;
    color: var(--privy-color-icon-warning, #facd63);
  }
`,S=C.zo.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
  font-size: 0.75rem;
  line-height: 1.125rem;
  color: var(--privy-color-foreground);
  font-feature-settings:
    'calt' 0,
    'kern' 0;
  text-align: left;
`,P=C.zo.span`
  font-weight: 600;
`,E=C.zo.span`
  font-weight: 400;
`,z=C.zo.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;

  && {
    padding: 0;
    color: var(--privy-color-accent);
    font-size: 0.875rem;
    font-style: normal;
    font-weight: 500;
    line-height: 1.375rem;
  }
`,M={CREDIT_DEBIT_CARD:"Credit / debit card",APPLE_PAY:"Apple Pay",GOOGLE_PAY:"Google Pay",BANK_TRANSFER:"Bank transfer",ACH:"ACH",SEPA:"SEPA",PIX:"PIX"},T=e=>M[e]??e.replace(/_/g," ").toLowerCase().replace(/^\w/,e=>e.toUpperCase()),R=({onClose:e,onSelectPaymentMethod:t,quotes:o,isLoading:n})=>(0,r.jsx)(v.S,{showClose:!0,onClose:e,title:"Select payment method",subtitle:"Choose how you'd like to pay",watermark:!0,children:(0,r.jsx)(q,{children:o.map((e,o)=>(0,r.jsx)(L,{onClick:()=>t(e),disabled:n,children:(0,r.jsxs)(Z,{children:[(0,r.jsx)(I,{children:(0,r.jsx)(h,{size:20})}),(0,r.jsxs)(U,{children:[(0,r.jsx)(D,{children:T(e.payment_method)}),e.sub_provider&&(0,r.jsxs)(F,{children:["via ",e.sub_provider]})]}),null!=e.source_amount&&e.source_currency_code&&(0,r.jsxs)(O,{children:[e.source_amount," ",e.source_currency_code]})]})},`${e.provider}-${e.payment_method}-${o}`))})}),q=C.zo.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
`,L=C.zo.button`
  border-color: var(--privy-color-border-default);
  border-width: 1px;
  border-radius: var(--privy-border-radius-mdlg);
  border-style: solid;
  display: flex;

  && {
    padding: 0.75rem 1rem;
  }
`,Z=C.zo.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
`,I=C.zo.div`
  color: var(--privy-color-foreground-3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,U=C.zo.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  flex: 1;
`,D=C.zo.span`
  color: var(--privy-color-foreground);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
`,F=C.zo.span`
  color: var(--privy-color-foreground-3);
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.125rem;
`,O=C.zo.span`
  color: var(--privy-color-foreground-3);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.375rem;
  flex-shrink: 0;
`,B=({onClose:e,onContinue:t,onAmountChange:o,onSelectSource:n,onEditSourceAsset:s,onEditPaymentMethod:a,onSelectPaymentMethod:l,onRetry:u,opts:d,state:c,amount:h,selectedQuote:p,quotesWarning:m,quotesCount:y,isLoading:g})=>"select-amount"===c.status?(0,r.jsx)(A,{onClose:e,onContinue:t,onAmountChange:o,onEditSourceAsset:s,onEditPaymentMethod:a,opts:d,amount:h,selectedQuote:p,quotesWarning:m,quotesCount:y,isLoading:g}):"select-source-asset"===c.status?(0,r.jsx)(i.S,{onSelectSource:n,opts:d,isLoading:g}):"select-payment-method"===c.status?(0,r.jsx)(R,{onClose:e,onSelectPaymentMethod:l,quotes:c.quotes,isLoading:g}):"provider-confirming"===c.status?(0,r.jsx)(x,{onClose:e}):"provider-error"===c.status?(0,r.jsx)(b,{onClose:e,onRetry:u}):"provider-success"===c.status?(0,r.jsx)(w,{onClose:e}):null,G={component:()=>{let e=(0,a.a)().data;if(!e?.FiatOnrampScreen)throw Error("Missing data");let{onSuccess:t,onFailure:o,getQuotes:l,getProviderUrl:u,getStatus:d,opts:c,initialQuotes:h,initialSelectedQuote:p}=e.FiatOnrampScreen,[m,y]=(0,n.useState)(c),[g,f]=(0,n.useState)({status:"select-amount"}),[v,C]=(0,n.useState)(null),[x,b]=(0,n.useState)(!1),[w,k]=(0,n.useState)(null),[_,A]=(0,n.useState)(c.defaultAmount??"0"),[j,S]=(0,n.useState)(null),[P,E]=(0,n.useState)(null),z=j??h,M=P??p,T=(0,n.useRef)(null),R=(0,n.useRef)(null),q=(0,n.useCallback)(async(e,t)=>{b(!0);try{let o=(await l({source:{asset:t.source.selectedAsset.toUpperCase(),amount:e},destination:{asset:t.destination.asset.toUpperCase(),chain:t.destination.chain,address:t.destination.address},environment:t.environment})).quotes??[];S(o),E(e=>{let t=e??p;return(t?o.find(e=>e.provider===t.provider&&e.payment_method===t.payment_method):void 0)??o[0]??null}),0===o.length?k(e&&"0"!==e?"currency_not_available":"amount_too_low"):k(null)}catch{S([]),E(null),k(null)}finally{b(!1)}},[l]),L=(0,n.useCallback)((e,t)=>{T.current&&clearTimeout(T.current),T.current=setTimeout(()=>{q(e,t)},750)},[q]),Z=(0,n.useCallback)(e=>{A(e),L(e,m)},[m,L]),I=(0,n.useCallback)(async()=>{let e;if(!M)return;let t=(0,s.X)();if(!t)return f({status:"provider-error"}),void C(Error("Unable to open payment window"));b(!0),R.current=new AbortController;try{let o=await u({source:{asset:m.source.selectedAsset.toUpperCase(),amount:_||"0"},destination:{asset:m.destination.asset.toUpperCase(),chain:m.destination.chain,address:m.destination.address},environment:m.environment,provider:M.provider,sub_provider:M.sub_provider,payment_method:M.payment_method,redirect_url:window.location.origin});t.location.href=o.url,e=o.session_id}catch{return t.close(),f({status:"provider-error"}),b(!1),void C(Error("Unable to start payment session"))}let o=await (0,i.p)(t,R.current.signal);if("aborted"===o.status||(b(!1),"closed"===o.status))return;o.status,f({status:"provider-confirming"});let r=await (0,i.a)({operation:()=>d({session_id:e,provider:M.provider}),until:e=>"completed"===e.status||"failed"===e.status||"cancelled"===e.status,delay:0,interval:2e3,attempts:60,signal:R.current.signal});if("aborted"!==r.status){if("max_attempts"===r.status)return f({status:"provider-error"}),void C(Error("Timed out waiting for response"));"completed"===r.result?.status?f({status:"provider-success"}):(f({status:"provider-error"}),C(Error(`Transaction ${r.result?.status??"failed"}`)))}},[M,m,_,u,d]),U=(0,n.useCallback)(e=>{let t={...m,source:{...m.source,selectedAsset:e}};y(t),f({status:"select-amount"}),q(_,t)},[m,_,q]),D=(0,n.useCallback)(()=>{f({status:"select-source-asset"})},[]),F=(0,n.useCallback)(()=>{z&&z.length>0&&f({status:"select-payment-method",quotes:z})},[z]),O=(0,n.useCallback)(e=>{E(e),f({status:"select-amount"})},[]),G=(0,n.useCallback)(()=>{C(null),f({status:"select-amount"})},[]);return(0,r.jsx)(B,{onClose:(0,n.useCallback)(async()=>{R.current?.abort(),T.current&&clearTimeout(T.current),v?o(v):"provider-success"!==g.status?o(Error("User exited flow")):await t()},[v,t,o]),opts:m,state:g,isLoading:x,amount:_,selectedQuote:M,quotesWarning:w,quotesCount:z?.length??0,onAmountChange:Z,onContinue:I,onSelectSource:U,onEditSourceAsset:D,onEditPaymentMethod:F,onSelectPaymentMethod:O,onRetry:G})}}}}]);