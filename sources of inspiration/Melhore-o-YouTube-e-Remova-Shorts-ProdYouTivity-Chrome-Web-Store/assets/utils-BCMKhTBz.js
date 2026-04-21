const c=async({maxRetries:o=15,interval:a=200,fn:n,args:s})=>{let e=null;for(let r=1;r<o;r++){try{return await n(...s)}catch(t){e=t}await new Promise(t=>setTimeout(t,a*r))}throw e};export{c as r};
