"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5243],{21021:function(e,t,o){o.d(t,{Z:function(){return s}});let s=(0,o(54428).Z)("smartphone",[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]])},8138:function(e,t,o){o.d(t,{Z:function(){return s}});let s=(0,o(54428).Z)("triangle-alert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]])},86132:function(e,t,o){o.d(t,{Z:function(){return s}});let s=(0,o(54428).Z)("wallet",[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",key:"18etb6"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",key:"xoc0q4"}]])},65243:function(e,t,o){o.r(t),o.d(t,{FiatOnrampScreen:function(){return $},default:function(){return $}});var s=o(57437),r=o(47685),n=o(86518),a=o(68879),i=o(93633),l=o(70737),c=o(96835),d=o(42196),u=o(54428);let h=(0,u.Z)("credit-card",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);var p=o(21021);let m=(0,u.Z)("building",[["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M12 6h.01",key:"1vi96p"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M16 6h.01",key:"1x0f13"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M8 6h.01",key:"1dz90k"}],["path",{d:"M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",key:"cabbwy"}],["rect",{x:"4",y:"2",width:"16",height:"20",rx:"2",key:"1uxh74"}]]);var y=o(86132),g=o(8138);let v=(0,u.Z)("chevron-right",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]),x=(0,u.Z)("landmark",[["path",{d:"M10 18v-7",key:"wt116b"}],["path",{d:"M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z",key:"1m329m"}],["path",{d:"M14 18v-7",key:"vav6t3"}],["path",{d:"M18 18v-7",key:"aexdmj"}],["path",{d:"M3 22h18",key:"8prr45"}],["path",{d:"M6 18v-7",key:"1ivflk"}]]);var C=o(72361),f=o(2506);o(2265),o(29155),o(87336),o(97048),o(64131),o(41888);let[w,j]=((e,t=750)=>{let o;return[(...s)=>{o&&clearTimeout(o),o=setTimeout(()=>{e(...s)},t)},()=>{o&&clearTimeout(o)}]})(async(e,t)=>{(0,n.L)({isLoading:!0});try{let{getQuotes:o}=(0,n.M)(),s=(await o({source:{asset:t.source.selectedAsset.toUpperCase(),amount:e},destination:{asset:t.destination.asset.toUpperCase(),chain:t.destination.chain,address:t.destination.address},environment:t.environment})).quotes??[];(0,n.L)({localQuotes:s,localSelectedQuote:s[0],isLoading:!1,quotesWarning:s.length>0?null:10>parseFloat(e)?"amount_too_low":"currency_not_available"})}catch{(0,n.L)({localQuotes:[],localSelectedQuote:null,quotesWarning:"currency_not_available"})}}),A=e=>{(0,n.L)({amount:e});let{opts:t}=(0,n.M)();w(e,t)},k=async()=>{let{error:e,state:t,onFailure:o,onSuccess:s}=(0,n.M)();j(),e?o(e):"provider-success"===t.status?await s({status:"confirmed"}):"provider-confirming"===t.status?await s({status:"submitted"}):o(Error("User exited flow"))},b=async()=>{let e,t=(0,n.N)();if(!t)return;let o=(0,a.X)();if(!o)return void(0,n.L)({state:{status:"provider-error"},error:Error("Unable to open payment window")});(0,n.L)({isLoading:!0});let{opts:s,amount:r,getProviderUrl:l,getStatus:c,controller:d}=(0,n.M)();d.current=new AbortController;try{let n=await l({source:{asset:s.source.selectedAsset.toUpperCase(),amount:r||"0"},destination:{asset:s.destination.asset.toUpperCase(),chain:s.destination.chain,address:s.destination.address},provider:t.provider,sub_provider:t.sub_provider??void 0,payment_method:t.payment_method,redirect_url:window.location.origin});o.location.href=n.url,e=n.session_id}catch{return o.close(),void(0,n.L)({state:{status:"provider-error"},isLoading:!1,error:Error("Unable to start payment session")})}let u=await (0,i.p)(o,d.current.signal);if("aborted"===u.status||((0,n.L)({isLoading:!1}),"closed"===u.status))return;u.status,(0,n.L)({state:{status:"provider-confirming"}});let h=await (0,i.a)({operation:()=>c({session_id:e,provider:t.provider}),until:e=>"completed"===e.status||"failed"===e.status||"cancelled"===e.status,delay:0,interval:2e3,attempts:60,signal:d.current.signal});if("aborted"!==h.status){if("max_attempts"===h.status)return void(0,n.L)({state:{status:"provider-error"},error:Error("Timed out waiting for response")});"completed"===h.result?.status?(0,n.L)({state:{status:"provider-success"}}):(0,n.L)({state:{status:"provider-error"},error:Error(`Transaction ${h.result?.status??"failed"}`)})}},M=()=>{let e=(0,n.O)();e&&e.length>0&&(0,n.L)({state:{status:"select-payment-method",quotes:e}})},z=()=>{(0,n.L)({state:{status:"select-source-asset"}})},L=()=>{(0,n.L)({error:null,state:{status:"select-amount"}})},_=e=>{(0,n.L)({localSelectedQuote:e,state:{status:"select-amount"}})},P=e=>{let{opts:t,amount:o}=(0,n.M)(),s={...t,source:{...t.source,selectedAsset:e}};(0,n.L)({opts:s,state:{status:"select-amount"}}),w(o,s)},E=({onClose:e})=>(0,s.jsx)(l.S,{showClose:!0,onClose:e,iconVariant:"loading",title:"Processing transaction",subtitle:"Your purchase is in progress. You can leave this screen — we’ll notify you when it’s complete.",primaryCta:{label:"Done",onClick:e},watermark:!0}),S=({onClose:e,onRetry:t})=>(0,s.jsx)(l.S,{showClose:!0,onClose:e,icon:c.Z,iconVariant:"error",title:"Something went wrong",subtitle:"We couldn't complete your transaction. Please try again.",primaryCta:{label:"Try again",onClick:t},secondaryCta:{label:"Close",onClick:e},watermark:!0}),R=({onClose:e})=>(0,s.jsx)(l.S,{showClose:!0,onClose:e,icon:d.Z,iconVariant:"success",title:"Transaction confirmed",subtitle:"Your purchase is processing. Funds should arrive in your wallet within a few minutes.",primaryCta:{label:"Done",onClick:e},watermark:!0}),T={CREDIT_DEBIT_CARD:"card",APPLE_PAY:"Apple Pay",GOOGLE_PAY:"Google Pay",BANK_TRANSFER:"bank deposit",ACH:"bank deposit",SEPA:"bank deposit",PIX:"PIX"},q={CREDIT_DEBIT_CARD:(0,s.jsx)(h,{size:14}),APPLE_PAY:(0,s.jsx)(p.Z,{size:14}),GOOGLE_PAY:(0,s.jsx)(p.Z,{size:14}),BANK_TRANSFER:(0,s.jsx)(m,{size:14}),ACH:(0,s.jsx)(m,{size:14}),SEPA:(0,s.jsx)(m,{size:14}),PIX:(0,s.jsx)(y.Z,{size:14})},Z=({opts:e,onClose:t,onEditSourceAsset:o,onEditPaymentMethod:r,onContinue:n,onAmountChange:a,amount:c,selectedQuote:d,quotesWarning:u,quotesCount:p,isLoading:m})=>{var y;return(0,s.jsxs)(l.S,{showClose:!0,onClose:t,headerTitle:`Buy ${e.destination.asset.toLocaleUpperCase()}`,primaryCta:{label:"Continue",onClick:n,loading:m,disabled:!d},helpText:u?(0,s.jsxs)(D,{children:[(0,s.jsx)(g.Z,{size:16,strokeWidth:2}),(0,s.jsx)(F,{children:(0,s.jsxs)(s.Fragment,"amount_too_low"===u?{children:[(0,s.jsx)(Q,{children:"Amount too low"}),(0,s.jsx)(B,{children:"Please choose a higher amount to continue."})]}:{children:[(0,s.jsx)(Q,{children:"Currency not available"}),(0,s.jsx)(B,{children:"Please choose another currency to continue."})]})})]}):d&&p>1?(0,s.jsxs)(H,{onClick:r,children:[q[d.payment_method]??(0,s.jsx)(h,{size:14}),(0,s.jsxs)("span",{children:["Pay with ",T[y=d.payment_method]??y.replace(/_/g," ").toLowerCase().replace(/^\w/,e=>e.toUpperCase())]}),(0,s.jsx)(v,{size:14})]}):null,watermark:!0,children:[(0,s.jsx)(i.A,{currency:e.source.selectedAsset,value:c,onChange:a,inputMode:"decimal",autoFocus:!0}),(0,s.jsx)(i.C,{selectedAsset:e.source.selectedAsset,onEditSourceAsset:o})]})},D=C.zo.div`
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
`,F=C.zo.div`
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
`,Q=C.zo.span`
  font-weight: 600;
`,B=C.zo.span`
  font-weight: 400;
`,H=C.zo.button`
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
`,I={CREDIT_DEBIT_CARD:"Credit / debit card",APPLE_PAY:"Apple Pay",GOOGLE_PAY:"Google Pay",BANK_TRANSFER:"Bank transfer",ACH:"ACH",SEPA:"SEPA",PIX:"PIX"},U={CREDIT_DEBIT_CARD:(0,s.jsx)(h,{size:20}),APPLE_PAY:(0,s.jsx)(f.A,{width:20,height:20}),GOOGLE_PAY:(0,s.jsx)(f.G,{width:20,height:20}),BANK_TRANSFER:(0,s.jsx)(x,{size:20}),ACH:(0,s.jsx)(x,{size:20}),SEPA:(0,s.jsx)(x,{size:20}),PIX:(0,s.jsx)(x,{size:20})},G=({onClose:e,onSelectPaymentMethod:t,quotes:o,isLoading:r})=>(0,s.jsx)(l.S,{showClose:!0,onClose:e,title:"Select payment method",subtitle:"Choose how you'd like to pay",watermark:!0,children:(0,s.jsx)(N,{children:o.map((e,o)=>{var n;return(0,s.jsx)(O,{onClick:()=>t(e),disabled:r,children:(0,s.jsxs)(Y,{children:[(0,s.jsx)(V,{children:U[e.payment_method]??(0,s.jsx)(h,{size:20})}),(0,s.jsx)(W,{children:(0,s.jsx)(X,{children:I[n=e.payment_method]??n.replace(/_/g," ").toLowerCase().replace(/^\w/,e=>e.toUpperCase())})})]})},`${e.provider}-${e.payment_method}-${o}`)})})}),N=C.zo.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
`,O=C.zo.button`
  border-color: var(--privy-color-border-default);
  border-width: 1px;
  border-radius: var(--privy-border-radius-md);
  border-style: solid;
  display: flex;

  && {
    padding: 1rem 1rem;
  }
`,Y=C.zo.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
`,V=C.zo.div`
  color: var(--privy-color-foreground-3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,W=C.zo.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  flex: 1;
`,X=C.zo.span`
  color: var(--privy-color-foreground);
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
`,K=({onClose:e,onContinue:t,onAmountChange:o,onSelectSource:r,onEditSourceAsset:n,onEditPaymentMethod:a,onSelectPaymentMethod:l,onRetry:c,opts:d,state:u,amount:h,selectedQuote:p,quotesWarning:m,quotesCount:y,isLoading:g})=>"select-amount"===u.status?(0,s.jsx)(Z,{onClose:e,onContinue:t,onAmountChange:o,onEditSourceAsset:n,onEditPaymentMethod:a,opts:d,amount:h,selectedQuote:p,quotesWarning:m,quotesCount:y,isLoading:g}):"select-source-asset"===u.status?(0,s.jsx)(i.S,{onSelectSource:r,opts:d,isLoading:g}):"select-payment-method"===u.status?(0,s.jsx)(G,{onClose:e,onSelectPaymentMethod:l,quotes:u.quotes,isLoading:g}):"provider-confirming"===u.status?(0,s.jsx)(E,{onClose:e}):"provider-error"===u.status?(0,s.jsx)(S,{onClose:e,onRetry:c}):"provider-success"===u.status?(0,s.jsx)(R,{onClose:e}):null,$={component:()=>{let{onUserCloseViaDialogOrKeybindRef:e}=(0,r.a)(),t=(0,n.Q)();if(!t)throw Error("Unexpected missing data");let{opts:o,state:a,isLoading:i,amount:l,quotesWarning:c,localQuotes:d,localSelectedQuote:u,initialQuotes:h,initialSelectedQuote:p}=t;return e.current=k,(0,s.jsx)(K,{onClose:k,opts:o,state:a,isLoading:i,amount:l,selectedQuote:u??p,quotesWarning:c,quotesCount:(d??h)?.length??0,onAmountChange:A,onContinue:b,onSelectSource:P,onEditSourceAsset:z,onEditPaymentMethod:M,onSelectPaymentMethod:_,onRetry:L})}}},2506:function(e,t,o){o.d(t,{A:function(){return r},G:function(){return n}});var s=o(57437);let r=e=>(0,s.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 210.2",xmlSpace:"preserve",...e,children:(0,s.jsx)("path",{d:"M93.6,27.1C87.6,34.2,78,39.8,68.4,39c-1.2-9.6,3.5-19.8,9-26.1c6-7.3,16.5-12.5,25-12.9  C103.4,10,99.5,19.8,93.6,27.1 M102.3,40.9c-13.9-0.8-25.8,7.9-32.4,7.9c-6.7,0-16.8-7.5-27.8-7.3c-14.3,0.2-27.6,8.3-34.9,21.2  c-15,25.8-3.9,64,10.6,85c7.1,10.4,15.6,21.8,26.8,21.4c10.6-0.4,14.8-6.9,27.6-6.9c12.9,0,16.6,6.9,27.8,6.7  c11.6-0.2,18.9-10.4,26-20.8c8.1-11.8,11.4-23.3,11.6-23.9c-0.2-0.2-22.4-8.7-22.6-34.3c-0.2-21.4,17.5-31.6,18.3-32.2  C123.3,42.9,107.7,41.3,102.3,40.9 M182.6,11.9v155.9h24.2v-53.3h33.5c30.6,0,52.1-21,52.1-51.4c0-30.4-21.1-51.2-51.3-51.2H182.6z   M206.8,32.3h27.9c21,0,33,11.2,33,30.9c0,19.7-12,31-33.1,31h-27.8V32.3z M336.6,169c15.2,0,29.3-7.7,35.7-19.9h0.5v18.7h22.4V90.2  c0-22.5-18-37-45.7-37c-25.7,0-44.7,14.7-45.4,34.9h21.8c1.8-9.6,10.7-15.9,22.9-15.9c14.8,0,23.1,6.9,23.1,19.6v8.6l-30.2,1.8  c-28.1,1.7-43.3,13.2-43.3,33.2C298.4,155.6,314.1,169,336.6,169z M343.1,150.5c-12.9,0-21.1-6.2-21.1-15.7c0-9.8,7.9-15.5,23-16.4  l26.9-1.7v8.8C371.9,140.1,359.5,150.5,343.1,150.5z M425.1,210.2c23.6,0,34.7-9,44.4-36.3L512,54.7h-24.6l-28.5,92.1h-0.5  l-28.5-92.1h-25.3l41,113.5l-2.2,6.9c-3.7,11.7-9.7,16.2-20.4,16.2c-1.9,0-5.6-0.2-7.1-0.4v18.7C417.3,210,423.3,210.2,425.1,210.2z"})}),n=e=>(0,s.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 80 38.1",xmlSpace:"preserve",...e,children:[(0,s.jsx)("path",{style:{fill:"#5F6368"},d:"M37.8,19.7V29h-3V6h7.8c1.9,0,3.7,0.7,5.1,2c1.4,1.2,2.1,3,2.1,4.9c0,1.9-0.7,3.6-2.1,4.9c-1.4,1.3-3.1,2-5.1,2  L37.8,19.7L37.8,19.7z M37.8,8.8v8h5c1.1,0,2.2-0.4,2.9-1.2c1.6-1.5,1.6-4,0.1-5.5c0,0-0.1-0.1-0.1-0.1c-0.8-0.8-1.8-1.3-2.9-1.2  L37.8,8.8L37.8,8.8z"}),(0,s.jsx)("path",{style:{fill:"#5F6368"},d:"M56.7,12.8c2.2,0,3.9,0.6,5.2,1.8s1.9,2.8,1.9,4.8V29H61v-2.2h-0.1c-1.2,1.8-2.9,2.7-4.9,2.7  c-1.7,0-3.2-0.5-4.4-1.5c-1.1-1-1.8-2.4-1.8-3.9c0-1.6,0.6-2.9,1.8-3.9c1.2-1,2.9-1.4,4.9-1.4c1.8,0,3.2,0.3,4.3,1v-0.7  c0-1-0.4-2-1.2-2.6c-0.8-0.7-1.8-1.1-2.9-1.1c-1.7,0-3,0.7-3.9,2.1l-2.6-1.6C51.8,13.8,53.9,12.8,56.7,12.8z M52.9,24.2  c0,0.8,0.4,1.5,1,1.9c0.7,0.5,1.5,0.8,2.3,0.8c1.2,0,2.4-0.5,3.3-1.4c1-0.9,1.5-2,1.5-3.2c-0.9-0.7-2.2-1.1-3.9-1.1  c-1.2,0-2.2,0.3-3,0.9C53.3,22.6,52.9,23.3,52.9,24.2z"}),(0,s.jsx)("path",{style:{fill:"#5F6368"},d:"M80,13.3l-9.9,22.7h-3l3.7-7.9l-6.5-14.7h3.2l4.7,11.3h0.1l4.6-11.3H80z"}),(0,s.jsx)("path",{style:{fill:"#4285F4"},d:"M25.9,17.7c0-0.9-0.1-1.8-0.2-2.7H13.2v5.1h7.1c-0.3,1.6-1.2,3.1-2.6,4v3.3H22C24.5,25.1,25.9,21.7,25.9,17.7z"}),(0,s.jsx)("path",{style:{fill:"#34A853"},d:"M13.2,30.6c3.6,0,6.6-1.2,8.8-3.2l-4.3-3.3c-1.2,0.8-2.7,1.3-4.5,1.3c-3.4,0-6.4-2.3-7.4-5.5H1.4v3.4  C3.7,27.8,8.2,30.6,13.2,30.6z"}),(0,s.jsx)("path",{style:{fill:"#FBBC04"},d:"M5.8,19.9c-0.6-1.6-0.6-3.4,0-5.1v-3.4H1.4c-1.9,3.7-1.9,8.1,0,11.9L5.8,19.9z"}),(0,s.jsx)("path",{style:{fill:"#EA4335"},d:"M13.2,9.4c1.9,0,3.7,0.7,5.1,2l0,0l3.8-3.8c-2.4-2.2-5.6-3.5-8.8-3.4c-5,0-9.6,2.8-11.8,7.3l4.4,3.4  C6.8,11.7,9.8,9.4,13.2,9.4z"})]})}}]);